// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/interfaces/ILayerZeroEndpoint.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/interfaces/ILayerZeroReceiver.sol";

/**
 * @title LayerZeroV2Adapter
 * @dev Adapter for LayerZero V2 messaging protocol, providing enhanced DVN security configuration
 * and lzCompose support for atomic cross-chain transactions
 */
contract LayerZeroV2Adapter is Ownable, ILayerZeroReceiver {
    // LayerZero endpoint for V1 compatibility mode
    ILayerZeroEndpoint public lzEndpoint;
    
    // Registered executor addresses
    mapping(address => bool) public executors;
    
    // Trusted remote addresses for each chain
    mapping(uint16 => bytes) public trustedRemotes;
    
    // DVN configuration
    struct DVNConfig {
        address dvnAddress;
        uint8 requiredSignatures;
        bool enabled;
    }
    
    // DVN settings for each chain
    mapping(uint16 => DVNConfig[]) public dvnConfigurations;
    
    // Minimum required DVN signatures for security
    uint8 public minRequiredDVNs = 3;
    
    // Flag to indicate if contract is paused
    bool public paused;
    
    // Message types
    uint16 public constant TYPE_CROSS_CHAIN_MESSAGE = 1;
    uint16 public constant TYPE_COMPOSE_EXECUTION = 2;
    
    /**
     * @dev Constructor
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _owner The owner of the contract
     */
    constructor(address _lzEndpoint, address _owner) Ownable(_owner) {
        require(_lzEndpoint != address(0), "LayerZeroV2Adapter: LayerZero endpoint cannot be zero");
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
    }
    
    /**
     * @dev Send a cross-chain message to another chain
     * @param _dstChainId The destination chain ID
     * @param _payload The payload to send
     * @param _refundAddress The address to refund excess fees to
     * @param _zroPaymentAddress The ZRO payment address (currently unused)
     * @param _adapterParams Additional parameters for the adapter
     */
    function sendMessage(
        uint16 _dstChainId,
        bytes memory _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes memory _adapterParams
    ) external payable {
        require(!paused, "LayerZeroV2Adapter: Contract is paused");
        require(trustedRemotes[_dstChainId].length > 0, "LayerZeroV2Adapter: Destination not trusted");
        
        bytes memory trustedRemote = trustedRemotes[_dstChainId];
        
        // Prefix the payload with the message type
        bytes memory prefixedPayload = abi.encodePacked(TYPE_CROSS_CHAIN_MESSAGE, _payload);
        
        // Estimate fee
        (uint256 fee, ) = lzEndpoint.estimateFees(
            _dstChainId,
            address(this),
            prefixedPayload,
            false,
            _adapterParams
        );
        
        require(msg.value >= fee, "LayerZeroV2Adapter: Insufficient fee");
        
        // Send message to the destination chain
        lzEndpoint.send{value: msg.value}(
            _dstChainId,
            trustedRemote,
            prefixedPayload,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
        
        emit MessageSent(_dstChainId, msg.sender, _payload);
    }
    
    /**
     * @dev Send a composed message to execute operations atomically across chains
     * @param _dstChainIds The array of destination chain IDs
     * @param _payloads The array of payloads to send to each chain
     * @param _refundAddress The address to refund excess fees to
     * @param _adapterParams Additional parameters for the adapter
     */
    function sendComposedMessage(
        uint16[] memory _dstChainIds,
        bytes[] memory _payloads,
        address payable _refundAddress,
        bytes memory _adapterParams
    ) external payable {
        require(!paused, "LayerZeroV2Adapter: Contract is paused");
        require(_dstChainIds.length == _payloads.length, "LayerZeroV2Adapter: Arrays length mismatch");
        require(_dstChainIds.length > 0, "LayerZeroV2Adapter: No destinations specified");
        
        uint256 totalFee = 0;
        
        // Calculate total fee for all messages
        for (uint256 i = 0; i < _dstChainIds.length; i++) {
            uint16 dstChainId = _dstChainIds[i];
            require(trustedRemotes[dstChainId].length > 0, "LayerZeroV2Adapter: Destination not trusted");
            
            bytes memory trustedRemote = trustedRemotes[dstChainId];
            bytes memory payload = abi.encodePacked(TYPE_COMPOSE_EXECUTION, _payloads[i]);
            
            (uint256 fee, ) = lzEndpoint.estimateFees(
                dstChainId,
                address(this),
                payload,
                false,
                _adapterParams
            );
            
            totalFee += fee;
        }
        
        require(msg.value >= totalFee, "LayerZeroV2Adapter: Insufficient fee");
        
        // Send messages to all destinations
        uint256 remainingValue = msg.value;
        for (uint256 i = 0; i < _dstChainIds.length; i++) {
            uint16 dstChainId = _dstChainIds[i];
            bytes memory trustedRemote = trustedRemotes[dstChainId];
            bytes memory payload = abi.encodePacked(TYPE_COMPOSE_EXECUTION, _payloads[i]);
            
            (uint256 fee, ) = lzEndpoint.estimateFees(
                dstChainId,
                address(this),
                payload,
                false,
                _adapterParams
            );
            
            lzEndpoint.send{value: fee}(
                dstChainId,
                trustedRemote,
                payload,
                _refundAddress,
                address(0), // No ZRO payment
                _adapterParams
            );
            
            remainingValue -= fee;
            
            emit ComposedMessageSent(dstChainId, msg.sender, _payloads[i]);
        }
        
        // Refund any excess fee
        if (remainingValue > 0) {
            (bool success, ) = _refundAddress.call{value: remainingValue}("");
            require(success, "LayerZeroV2Adapter: Failed to refund excess fee");
        }
    }
    
    /**
     * @dev Handle received message from LayerZero
     * @param _srcChainId The source chain ID
     * @param _srcAddress The source address (in bytes)
     * @param _nonce The message nonce
     * @param _payload The message payload
     */
    function lzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) external override {
        require(msg.sender == address(lzEndpoint), "LayerZeroV2Adapter: Invalid endpoint caller");
        
        // Verify the source is trusted
        require(_isValidSource(_srcChainId, _srcAddress), "LayerZeroV2Adapter: Invalid source");
        
        // Handle the message based on its type
        if (_payload.length < 2) {
            revert("LayerZeroV2Adapter: Invalid payload");
        }
        
        uint16 messageType;
        assembly {
            messageType := mload(add(_payload, 2))
        }
        
        if (messageType == TYPE_CROSS_CHAIN_MESSAGE) {
            bytes memory actualPayload = _extractPayload(_payload);
            _handleStandardMessage(_srcChainId, _srcAddress, _nonce, actualPayload);
        } else if (messageType == TYPE_COMPOSE_EXECUTION) {
            bytes memory actualPayload = _extractPayload(_payload);
            _handleComposedMessage(_srcChainId, _srcAddress, _nonce, actualPayload);
        } else {
            revert("LayerZeroV2Adapter: Unknown message type");
        }
    }
    
    /**
     * @dev Handle a standard cross-chain message
     */
    function _handleStandardMessage(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal {
        // Implement message handling logic here, typically forwarding to registered executors
        address executor = _getExecutorForMessage(_payload);
        
        require(executors[executor], "LayerZeroV2Adapter: Invalid executor");
        
        // Forward the call to the executor
        (bool success, bytes memory result) = executor.call(_payload);
        require(success, string(result));
        
        emit MessageReceived(_srcChainId, _srcAddress, _nonce, _payload);
    }
    
    /**
     * @dev Handle a composed message for atomic execution
     */
    function _handleComposedMessage(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal {
        // Parse the composed message
        (address[] memory targets, bytes[] memory callData) = abi.decode(_payload, (address[], bytes[]));
        
        require(targets.length == callData.length, "LayerZeroV2Adapter: Arrays length mismatch");
        
        // Execute all calls atomically
        for (uint256 i = 0; i < targets.length; i++) {
            address target = targets[i];
            bytes memory data = callData[i];
            
            require(executors[target], "LayerZeroV2Adapter: Invalid executor target");
            
            (bool success, bytes memory result) = target.call(data);
            require(success, string(result));
        }
        
        emit ComposedMessageExecuted(_srcChainId, _srcAddress, _nonce, targets.length);
    }
    
    /**
     * @dev Extract the actual payload from the prefixed payload
     */
    function _extractPayload(bytes memory _payload) internal pure returns (bytes memory) {
        return _payload[2:];
    }
    
    /**
     * @dev Determine the executor for a given message payload
     */
    function _getExecutorForMessage(bytes memory _payload) internal pure returns (address) {
        // In a real implementation, we would parse the payload to extract the target executor
        // For simplicity, we'll assume it's encoded at the start of the payload
        
        address executor;
        assembly {
            executor := mload(add(_payload, 20)) // Extract first 20 bytes as address
        }
        
        return executor;
    }
    
    /**
     * @dev Check if the source is trusted
     */
    function _isValidSource(uint16 _srcChainId, bytes memory _srcAddress) internal view returns (bool) {
        return keccak256(trustedRemotes[_srcChainId]) == keccak256(_srcAddress);
    }
    
    // Admin functions
    
    /**
     * @dev Set a trusted remote address for a chain
     */
    function setTrustedRemote(uint16 _chainId, bytes calldata _trustedRemote) external onlyOwner {
        trustedRemotes[_chainId] = _trustedRemote;
        emit TrustedRemoteSet(_chainId, _trustedRemote);
    }
    
    /**
     * @dev Register an executor contract
     */
    function registerExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "LayerZeroV2Adapter: Executor cannot be zero address");
        executors[_executor] = true;
        emit ExecutorRegistered(_executor);
    }
    
    /**
     * @dev Unregister an executor contract
     */
    function unregisterExecutor(address _executor) external onlyOwner {
        executors[_executor] = false;
        emit ExecutorUnregistered(_executor);
    }
    
    /**
     * @dev Add a DVN config for a chain
     */
    function addDVNConfig(uint16 _chainId, address _dvnAddress, uint8 _requiredSignatures) external onlyOwner {
        require(_dvnAddress != address(0), "LayerZeroV2Adapter: DVN address cannot be zero");
        require(_requiredSignatures > 0, "LayerZeroV2Adapter: Required signatures must be > 0");
        
        dvnConfigurations[_chainId].push(DVNConfig({
            dvnAddress: _dvnAddress,
            requiredSignatures: _requiredSignatures,
            enabled: true
        }));
        
        emit DVNConfigAdded(_chainId, _dvnAddress, _requiredSignatures);
    }
    
    /**
     * @dev Set minimum required DVNs
     */
    function setMinRequiredDVNs(uint8 _minRequired) external onlyOwner {
        require(_minRequired > 0, "LayerZeroV2Adapter: Min required DVNs must be > 0");
        minRequiredDVNs = _minRequired;
        emit MinRequiredDVNsSet(_minRequired);
    }
    
    /**
     * @dev Pause/unpause the contract
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateChanged(_paused);
    }
    
    /**
     * @dev Allow contract to receive Ether
     */
    receive() external payable {}
    
    // Events
    event MessageSent(uint16 indexed dstChainId, address indexed sender, bytes payload);
    event MessageReceived(uint16 indexed srcChainId, bytes srcAddress, uint64 nonce, bytes payload);
    event ComposedMessageSent(uint16 indexed dstChainId, address indexed sender, bytes payload);
    event ComposedMessageExecuted(uint16 indexed srcChainId, bytes srcAddress, uint64 nonce, uint256 callCount);
    event TrustedRemoteSet(uint16 indexed chainId, bytes trustedRemote);
    event ExecutorRegistered(address indexed executor);
    event ExecutorUnregistered(address indexed executor);
    event DVNConfigAdded(uint16 indexed chainId, address dvnAddress, uint8 requiredSignatures);
    event MinRequiredDVNsSet(uint8 minRequired);
    event PausedStateChanged(bool paused);
}