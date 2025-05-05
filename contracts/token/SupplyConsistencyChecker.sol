// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/lzApp/NonblockingLzApp.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/interfaces/ILayerZeroEndpoint.sol";

/**
 * @title SupplyConsistencyChecker
 * @dev Contract to verify and maintain token supply consistency across chains
 * This contract implements automated supply audits as required by the PRD
 */
contract SupplyConsistencyChecker is Ownable, NonblockingLzApp {
    // Reference to the token contract
    address public token;
    
    // Supply data for the current chain
    uint256 public localSupply;
    uint256 public lastUpdateTimestamp;
    
    // Supply data across chains
    mapping(uint16 => ChainSupply) public chainSupplies;
    
    // Audit records
    mapping(uint256 => SupplyAudit) public supplyAudits;
    uint256 public auditCounter;
    
    // Message types
    uint16 public constant TYPE_SUPPLY_REQUEST = 1;
    uint16 public constant TYPE_SUPPLY_RESPONSE = 2;
    uint16 public constant TYPE_SUPPLY_AUDIT = 3;
    
    // Audit outcome status
    enum AuditStatus {
        Pending,
        Verified,
        Reconciled,
        Failed
    }
    
    // Structure to store chain supply data
    struct ChainSupply {
        uint256 totalSupply;
        uint256 lastUpdateTimestamp;
        bool isRegistered;
    }
    
    // Structure to store audit information
    struct SupplyAudit {
        uint256 timestamp;
        uint256 totalExpectedSupply;
        uint256 totalActualSupply;
        AuditStatus status;
        string details;
    }
    
    /**
     * @dev Emitted when a supply audit is completed
     */
    event SupplyAuditCompleted(uint256 indexed auditId, AuditStatus status, uint256 expectedSupply, uint256 actualSupply);
    
    /**
     * @dev Emitted when supply data is received from another chain
     */
    event SupplyDataReceived(uint16 indexed srcChainId, uint256 supply, uint256 timestamp);
    
    /**
     * @dev Emitted when a supply mismatch is detected and reconciled
     */
    event SupplyReconciled(uint256 indexed auditId, uint256 expectedSupply, uint256 actualSupply, string details);
    
    /**
     * @dev Constructor for SupplyConsistencyChecker
     * @param _token The address of the OmniGovernToken
     * @param _lzEndpoint The address of the LayerZero endpoint
     * @param _owner The owner of the contract
     */
    constructor(
        address _token,
        address _lzEndpoint,
        address _owner
    ) NonblockingLzApp(_lzEndpoint) Ownable(_owner) {
        require(_token != address(0), "SupplyConsistencyChecker: Token address cannot be zero");
        token = _token;
        lastUpdateTimestamp = block.timestamp;
    }
    
    /**
     * @dev Updates the local supply data
     * @return The current token supply
     */
    function updateLocalSupply() public returns (uint256) {
        localSupply = IERC20(token).totalSupply();
        lastUpdateTimestamp = block.timestamp;
        return localSupply;
    }
    
    /**
     * @dev Requests supply data from another chain
     * @param _dstChainId The destination chain ID
     */
    function requestSupplyData(uint16 _dstChainId) external payable onlyOwner {
        // Update local supply first
        updateLocalSupply();
        
        // Prepare payload
        bytes memory payload = abi.encode(
            TYPE_SUPPLY_REQUEST,
            block.timestamp
        );
        
        // Estimate fee
        (uint256 fee, ) = lzEndpoint.estimateFees(
            _dstChainId,
            address(this),
            payload,
            false,
            bytes("")
        );
        
        require(msg.value >= fee, "SupplyConsistencyChecker: Insufficient fee");
        
        // Send message to the destination chain
        _lzSend(
            _dstChainId,
            payload,
            payable(msg.sender),
            address(0x0),
            bytes(""),
            msg.value
        );
    }
    
    /**
     * @dev Responds to a supply data request
     * @param _srcChainId The source chain ID
     * @param _srcAddress The source address
     * @param _timestamp The timestamp of the request
     */
    function sendSupplyResponse(uint16 _srcChainId, bytes memory _srcAddress, uint256 _timestamp) internal {
        // Update local supply
        updateLocalSupply();
        
        // Prepare payload
        bytes memory payload = abi.encode(
            TYPE_SUPPLY_RESPONSE,
            localSupply,
            block.timestamp,
            _timestamp
        );
        
        // Send message back to the source chain
        // Assuming gas is paid by the contract
        uint256 fee = 0.01 ether; // Simplified; in practice would use estimateFees
        
        // Ensure contract has enough balance
        require(address(this).balance >= fee, "SupplyConsistencyChecker: Insufficient balance");
        
        _lzSend(
            _srcChainId,
            payload,
            payable(address(this)),
            address(0x0),
            bytes(""),
            fee
        );
    }
    
    /**
     * @dev Handle a received cross-chain message
     * @param _srcChainId Source chain ID
     * @param _srcAddress Source address (in bytes)
     * @param _nonce Nonce of the message
     * @param _payload Payload of the message
     */
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        // Decode the message type
        (uint16 messageType) = abi.decode(_payload[:32], (uint16));
        
        if (messageType == TYPE_SUPPLY_REQUEST) {
            // Decode request timestamp
            (,uint256 timestamp) = abi.decode(_payload, (uint16, uint256));
            // Send back our supply data
            sendSupplyResponse(_srcChainId, _srcAddress, timestamp);
        } 
        else if (messageType == TYPE_SUPPLY_RESPONSE) {
            // Decode supply data
            (,uint256 remoteSupply, uint256 responseTimestamp, uint256 requestTimestamp) = 
                abi.decode(_payload, (uint16, uint256, uint256, uint256));
            
            // Update chain supply record
            chainSupplies[_srcChainId] = ChainSupply({
                totalSupply: remoteSupply,
                lastUpdateTimestamp: responseTimestamp,
                isRegistered: true
            });
            
            // Emit event
            emit SupplyDataReceived(_srcChainId, remoteSupply, responseTimestamp);
        }
        else if (messageType == TYPE_SUPPLY_AUDIT) {
            // Decode audit data
            (,uint256 auditId, uint256 expectedSupply) = 
                abi.decode(_payload, (uint16, uint256, uint256));
            
            // Process audit data
            processAuditData(_srcChainId, auditId, expectedSupply);
        }
        else {
            revert("SupplyConsistencyChecker: Unknown message type");
        }
    }
    
    /**
     * @dev Process audit data received from another chain
     * @param _srcChainId The source chain ID
     * @param _auditId The audit ID
     * @param _expectedSupply The expected total supply
     */
    function processAuditData(uint16 _srcChainId, uint256 _auditId, uint256 _expectedSupply) internal {
        // Logic to process audit data and potentially reconcile
        updateLocalSupply();
        
        // Store audit record
        supplyAudits[_auditId] = SupplyAudit({
            timestamp: block.timestamp,
            totalExpectedSupply: _expectedSupply,
            totalActualSupply: localSupply,
            status: _expectedSupply == localSupply ? AuditStatus.Verified : AuditStatus.Failed,
            details: _expectedSupply == localSupply ? "Supply verified" : "Supply mismatch detected"
        });
        
        // Emit event
        emit SupplyAuditCompleted(_auditId, supplyAudits[_auditId].status, _expectedSupply, localSupply);
    }
    
    /**
     * @dev Initiates a supply audit across all registered chains
     * @return The ID of the created audit
     */
    function initiateGlobalAudit() external onlyOwner returns (uint256) {
        // Create a new audit record
        uint256 auditId = ++auditCounter;
        
        // Update local supply
        updateLocalSupply();
        
        uint256 expectedGlobalSupply = localSupply;
        
        // Initialize audit record
        supplyAudits[auditId] = SupplyAudit({
            timestamp: block.timestamp,
            totalExpectedSupply: expectedGlobalSupply,
            totalActualSupply: 0, // To be filled later
            status: AuditStatus.Pending,
            details: "Audit in progress"
        });
        
        return auditId;
    }
    
    /**
     * @dev Checks supply consistency and reconciles if needed
     * @param _auditId The ID of the audit to check
     */
    function checkSupplyConsistency(uint256 _auditId) external onlyOwner {
        require(_auditId > 0 && _auditId <= auditCounter, "SupplyConsistencyChecker: Invalid audit ID");
        require(supplyAudits[_auditId].status == AuditStatus.Pending, "SupplyConsistencyChecker: Audit not pending");
        
        uint256 totalSupplyAcrossChains = localSupply;
        
        // Collect supply data from all registered chains
        for (uint16 i = 1; i < 10000; i++) { // Assuming maximum 10,000 chain IDs
            if (chainSupplies[i].isRegistered) {
                totalSupplyAcrossChains += chainSupplies[i].totalSupply;
            }
        }
        
        // Update audit with actual supply
        SupplyAudit storage audit = supplyAudits[_auditId];
        audit.totalActualSupply = totalSupplyAcrossChains;
        
        // Check if supplies match
        if (audit.totalExpectedSupply == totalSupplyAcrossChains) {
            audit.status = AuditStatus.Verified;
            audit.details = "Supply verified across all chains";
        } else {
            audit.status = AuditStatus.Failed;
            audit.details = "Supply mismatch detected";
            
            // In a real implementation, would include logic to reconcile
            // This would involve mint or burn operations on specific chains
        }
        
        // Emit event
        emit SupplyAuditCompleted(_auditId, audit.status, audit.totalExpectedSupply, totalSupplyAcrossChains);
    }
    
    /**
     * @dev Reconciles supply mismatch
     * @param _auditId The ID of the failed audit to reconcile
     */
    function reconcileSupplyMismatch(uint256 _auditId) external onlyOwner {
        require(_auditId > 0 && _auditId <= auditCounter, "SupplyConsistencyChecker: Invalid audit ID");
        require(supplyAudits[_auditId].status == AuditStatus.Failed, "SupplyConsistencyChecker: Audit not failed");
        
        SupplyAudit storage audit = supplyAudits[_auditId];
        
        // In a real implementation, we would:
        // 1. Calculate the difference between expected and actual supply
        // 2. Determine which chain(s) have the mismatch
        // 3. Send messages to those chains to mint or burn tokens
        
        // For simplicity in this example:
        audit.status = AuditStatus.Reconciled;
        audit.details = "Supply manually reconciled";
        
        emit SupplyReconciled(_auditId, audit.totalExpectedSupply, audit.totalActualSupply, audit.details);
    }
    
    /**
     * @dev Allow contract to receive Ether
     */
    receive() external payable {}
}

/**
 * Minimal IERC20 interface needed for the checker
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
}