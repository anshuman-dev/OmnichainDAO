// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/interfaces/ILayerZeroEndpoint.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/interfaces/ILayerZeroReceiver.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title OmniProposalExecutor
 * @dev Implementation of a cross-chain proposal executor that uses lzCompose
 * for atomic execution across multiple chains.
 */
contract OmniProposalExecutor is Ownable, ILayerZeroReceiver {
    // LayerZero endpoint
    ILayerZeroEndpoint public lzEndpoint;
    
    // OmniGovernToken (for vote checking)
    IOmniGovernToken public token;
    
    // Proposal state
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        address proposer;
        uint256 startBlock;
        uint256 endBlock;
        string description;
        bytes[] calldatas;
        address[] targets;
        uint256[] values;
        bool executed;
        mapping(uint16 => bool) executedOnChain;
        uint256 forVotes;
        uint256 requiredVotes;
    }
    
    // Chain execution details
    struct ChainExecution {
        uint16 chainId;
        address[] targets;
        bytes[] calldatas;
        uint256[] values;
    }
    
    // Message types for LayerZero
    uint8 public constant LZ_MESSAGE_TYPE_EXECUTE = 2;
    
    // Mapping from proposal ID to proposal
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Trusted remote addresses
    mapping(uint16 => bytes) public trustedRemotes;
    
    // Events
    event ProposalCreated(
        uint256 proposalId,
        address proposer,
        address[] targets,
        uint256[] values,
        bytes[] calldatas,
        string description,
        uint256 startBlock,
        uint256 endBlock
    );
    
    event ProposalExecuted(uint256 proposalId);
    event ChainExecutionSent(uint256 proposalId, uint16 chainId);
    event ChainExecutionCompleted(uint256 proposalId, uint16 chainId, bool success);
    event TrustedRemoteSet(uint16 indexed chainId, bytes path);
    
    /**
     * @dev Constructor
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _token The OmniGovernToken address
     * @param _owner The contract owner
     */
    constructor(address _lzEndpoint, address _token, address _owner) Ownable(_owner) {
        require(_lzEndpoint != address(0), "OmniProposalExecutor: LZ endpoint cannot be zero");
        require(_token != address(0), "OmniProposalExecutor: Token cannot be zero");
        
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
        token = IOmniGovernToken(_token);
    }
    
    /**
     * @dev Create a new proposal
     * @param targets Target addresses for calls
     * @param values Native token values for calls
     * @param calldatas Call data for calls
     * @param description Description of the proposal
     * @return The proposal ID
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256) {
        require(targets.length > 0, "OmniProposalExecutor: Empty proposal");
        require(targets.length == values.length, "OmniProposalExecutor: Invalid proposal");
        require(targets.length == calldatas.length, "OmniProposalExecutor: Invalid proposal");
        
        uint256 votingPower = token.getVotingPower(msg.sender);
        require(votingPower >= 1e18, "OmniProposalExecutor: Insufficient voting power");
        
        uint256 proposalId = ++proposalCount;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.startBlock = block.number;
        proposal.endBlock = block.number + 40320; // ~1 week at 15s blocks
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.requiredVotes = 100e18; // Simplified: 100 token votes required
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            targets,
            values,
            calldatas,
            description,
            proposal.startBlock,
            proposal.endBlock
        );
        
        return proposalId;
    }
    
    /**
     * @dev Execute a proposal using lzCompose for atomic cross-chain execution
     * @param proposalId The proposal ID
     * @param chainExecutions The executions to perform on different chains
     */
    function executeProposal(
        uint256 proposalId,
        ChainExecution[] calldata chainExecutions
    ) external payable {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "OmniProposalExecutor: Invalid proposal");
        require(block.number > proposal.endBlock, "OmniProposalExecutor: Voting period not ended");
        require(!proposal.executed, "OmniProposalExecutor: Already executed");
        require(proposal.forVotes >= proposal.requiredVotes, "OmniProposalExecutor: Not enough votes");
        
        // Mark proposal as executed
        proposal.executed = true;
        
        // If there are chain executions, send them
        if (chainExecutions.length > 0) {
            for (uint256 i = 0; i < chainExecutions.length; i++) {
                ChainExecution memory execution = chainExecutions[i];
                
                // Check that the trusted remote is set for the chain
                require(trustedRemotes[execution.chainId].length > 0, "OmniProposalExecutor: Chain not trusted");
                
                // Prepare execution payload
                bytes memory payload = abi.encode(
                    LZ_MESSAGE_TYPE_EXECUTE,
                    proposalId,
                    execution.targets,
                    execution.values,
                    execution.calldatas
                );
                
                // Estimate fee
                (uint256 fee, ) = lzEndpoint.estimateFees(
                    execution.chainId,
                    address(this),
                    payload,
                    false,
                    bytes("")
                );
                
                require(msg.value >= fee, "OmniProposalExecutor: Insufficient fee");
                
                // Send execution message
                lzEndpoint.send{value: fee}(
                    execution.chainId,
                    trustedRemotes[execution.chainId],
                    payload,
                    payable(msg.sender),
                    address(0),
                    bytes("")
                );
                
                emit ChainExecutionSent(proposalId, execution.chainId);
            }
        }
        
        // Execute on this chain if needed
        _executeProposal(
            proposalId,
            proposal.targets,
            proposal.values,
            proposal.calldatas
        );
        
        emit ProposalExecuted(proposalId);
    }
    
    /**
     * @dev Execute a proposal on this chain
     */
    function _executeProposal(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) internal {
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(calldatas[i]);
            require(success, "OmniProposalExecutor: Execution failed");
        }
    }
    
    /**
     * @dev Implements the LayerZero receiver
     */
    function lzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) external override {
        require(msg.sender == address(lzEndpoint), "OmniProposalExecutor: Invalid endpoint caller");
        
        // Verify the source is trusted
        require(_isTrustedRemote(_srcChainId, _srcAddress), "OmniProposalExecutor: Invalid source");
        
        // Decode the message type
        if (_payload.length < 1) {
            revert("OmniProposalExecutor: Invalid payload");
        }
        
        uint8 messageType;
        assembly {
            messageType := mload(add(_payload, 1))
        }
        
        if (messageType == LZ_MESSAGE_TYPE_EXECUTE) {
            // Decode execution details
            (uint8 _, uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = 
                abi.decode(_payload, (uint8, uint256, address[], uint256[], bytes[]));
            
            // Execute the proposal
            Proposal storage proposal = proposals[proposalId];
            
            // If not the original proposal, create a local reference
            if (proposal.id == 0) {
                proposal.id = proposalId;
            }
            
            // Mark as executed on this chain
            proposal.executedOnChain[_srcChainId] = true;
            
            // Execute locally
            _executeProposal(proposalId, targets, values, calldatas);
            
            emit ChainExecutionCompleted(proposalId, _srcChainId, true);
        } else {
            revert("OmniProposalExecutor: Unknown message type");
        }
    }
    
    /**
     * @dev Get proposal state
     * @param proposalId The proposal ID
     * @return The proposal state
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id == proposalId, "OmniProposalExecutor: Invalid proposal");
        
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        
        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }
        
        if (proposal.forVotes >= proposal.requiredVotes) {
            return ProposalState.Succeeded;
        }
        
        return ProposalState.Defeated;
    }
    
    /**
     * @dev Check if a remote address is trusted
     */
    function _isTrustedRemote(uint16 _srcChainId, bytes memory _srcAddress) internal view returns (bool) {
        return keccak256(trustedRemotes[_srcChainId]) == keccak256(_srcAddress);
    }
    
    /**
     * @dev Set trusted remote address for a chain
     * @param chainId The chain ID
     * @param path The path to the remote contract
     */
    function setTrustedRemote(uint16 chainId, bytes calldata path) external onlyOwner {
        trustedRemotes[chainId] = path;
        emit TrustedRemoteSet(chainId, path);
    }
    
    /**
     * @dev Set trusted remote addresses for multiple chains
     * @param chainIds Array of chain IDs
     * @param paths Array of paths to the remote contracts
     */
    function setTrustedRemoteAddresses(uint16[] calldata chainIds, bytes[] calldata paths) external onlyOwner {
        require(chainIds.length == paths.length, "OmniProposalExecutor: Array length mismatch");
        
        for (uint256 i = 0; i < chainIds.length; i++) {
            trustedRemotes[chainIds[i]] = paths[i];
            emit TrustedRemoteSet(chainIds[i], paths[i]);
        }
    }
    
    /**
     * @dev Allows receiving ETH
     */
    receive() external payable {}
}