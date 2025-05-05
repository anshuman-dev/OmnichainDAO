// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-sdk-v2/contracts/MessagingBase.sol";
import "@layerzerolabs/lz-evm-sdk-v2/contracts/interfaces/IMessagingComposer.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title OmniProposalExecutor
 * @dev Executes successful governance proposals across multiple chains using lzCompose
 * This contract coordinates atomic execution of proposals on all connected chains
 */
contract OmniProposalExecutor is Ownable, MessagingBase {
    enum ExecutionStatus {
        Pending,
        Queued,
        Executed,
        Failed,
        Cancelled
    }
    
    struct ExecutionRecord {
        bytes32 proposalId;
        uint256 queuedAt;
        ExecutionStatus status;
        bytes[] calls;
        uint32[] targetChainIds;
        bool isAtomic;
    }
    
    // Storage
    mapping(bytes32 => ExecutionRecord) private executions;
    address public govToken;
    uint256 public executionDelay;
    
    // Events
    event ProposalExecutionQueued(bytes32 indexed proposalId, uint256 executeAfter);
    event ProposalExecutionStarted(bytes32 indexed proposalId, bool isAtomic);
    event ProposalExecutionComplete(bytes32 indexed proposalId, bool success);
    event CrossChainExecutionSent(bytes32 indexed proposalId, uint32 dstChainId);
    event CrossChainExecutionReceived(bytes32 indexed proposalId, uint32 srcChainId);
    
    /**
     * @dev Constructor initializes the proposal executor
     * @param _endpoint LayerZero endpoint address
     * @param _govToken Address of the governance token contract
     * @param _executionDelay Delay before execution after queuing (in seconds)
     * @param _owner Owner of the contract
     */
    constructor(
        address _endpoint,
        address _govToken,
        uint256 _executionDelay,
        address _owner
    ) MessagingBase(_endpoint) {
        require(_govToken != address(0), "OPE: Gov token cannot be zero");
        govToken = _govToken;
        executionDelay = _executionDelay;
        transferOwnership(_owner);
    }
    
    /**
     * @dev Queue a proposal for execution
     * @param _proposalId The unique identifier of the proposal
     * @param _calls Array of encoded function calls to execute
     * @param _targetChainIds Array of target chain IDs (LayerZero IDs)
     * @param _isAtomic Whether execution should be atomic
     */
    function queueExecution(
        bytes32 _proposalId,
        bytes[] memory _calls,
        uint32[] memory _targetChainIds,
        bool _isAtomic
    ) external {
        // Check if the proposal has succeeded
        IOmniGovernToken.Proposal memory proposal = IOmniGovernToken(govToken).getProposal(_proposalId);
        require(proposal.status == IOmniGovernToken.ProposalStatus.Succeeded, "OPE: Proposal not successful");
        
        // Ensure calls and targetChainIds match
        require(_calls.length == _targetChainIds.length, "OPE: Calls and targets mismatch");
        require(_calls.length > 0, "OPE: No calls provided");
        
        // Ensure this proposal hasn't been queued before
        require(executions[_proposalId].status == ExecutionStatus.Pending, "OPE: Already queued");
        
        // Create execution record
        executions[_proposalId] = ExecutionRecord({
            proposalId: _proposalId,
            queuedAt: block.timestamp,
            status: ExecutionStatus.Queued,
            calls: _calls,
            targetChainIds: _targetChainIds,
            isAtomic: _isAtomic
        });
        
        // Emit event with execution time
        emit ProposalExecutionQueued(_proposalId, block.timestamp + executionDelay);
    }
    
    /**
     * @dev Execute a queued proposal
     * @param _proposalId The unique identifier of the proposal
     */
    function execute(bytes32 _proposalId) external payable {
        ExecutionRecord storage execution = executions[_proposalId];
        
        // Verify execution is ready
        require(execution.status == ExecutionStatus.Queued, "OPE: Not in queued state");
        require(block.timestamp >= execution.queuedAt + executionDelay, "OPE: Execution delay not met");
        
        // Update status to executing
        execution.status = ExecutionStatus.Executed;
        
        emit ProposalExecutionStarted(_proposalId, execution.isAtomic);
        
        // If atomic, use lzCompose, otherwise execute directly
        if (execution.isAtomic) {
            _executeWithLzCompose(_proposalId);
        } else {
            _executeDirectly(_proposalId);
        }
        
        // Execution complete
        emit ProposalExecutionComplete(_proposalId, true);
    }
    
    /**
     * @dev Cancel a queued execution
     * @param _proposalId The unique identifier of the proposal
     */
    function cancelExecution(bytes32 _proposalId) external onlyOwner {
        ExecutionRecord storage execution = executions[_proposalId];
        require(execution.status == ExecutionStatus.Queued, "OPE: Not in queued state");
        
        execution.status = ExecutionStatus.Cancelled;
    }
    
    /**
     * @dev Get the status of an execution
     * @param _proposalId The unique identifier of the proposal
     * @return status The current execution status
     */
    function getExecutionStatus(bytes32 _proposalId) external view returns (ExecutionStatus) {
        return executions[_proposalId].status;
    }
    
    /**
     * @dev Get full execution details
     * @param _proposalId The unique identifier of the proposal
     * @return execution The execution record
     */
    function getExecution(bytes32 _proposalId) external view returns (ExecutionRecord memory) {
        return executions[_proposalId];
    }
    
    /**
     * @dev Internal function to execute proposal directly (non-atomic)
     * @param _proposalId The unique identifier of the proposal
     */
    function _executeDirectly(bytes32 _proposalId) internal {
        ExecutionRecord storage execution = executions[_proposalId];
        
        for (uint i = 0; i < execution.targetChainIds.length; i++) {
            uint32 dstChainId = execution.targetChainIds[i];
            bytes memory call = execution.calls[i];
            
            // If the target chain is this chain, execute locally
            if (dstChainId == lzChainId) {
                // Execute local call
                // This is simplified - in a real implementation, we'd decode and call the target
                emit CrossChainExecutionReceived(_proposalId, lzChainId);
            } else {
                // Send to remote chain
                _sendCrossChainExecution(_proposalId, dstChainId, call);
                emit CrossChainExecutionSent(_proposalId, dstChainId);
            }
        }
    }
    
    /**
     * @dev Internal function to execute proposal with lzCompose (atomic)
     * @param _proposalId The unique identifier of the proposal
     */
    function _executeWithLzCompose(bytes32 _proposalId) internal {
        ExecutionRecord storage execution = executions[_proposalId];
        
        // Prepare arrays for lzCompose
        uint32[] memory dstChainIds = new uint32[](execution.targetChainIds.length);
        bytes[] memory messages = new bytes[](execution.targetChainIds.length);
        
        for (uint i = 0; i < execution.targetChainIds.length; i++) {
            dstChainIds[i] = execution.targetChainIds[i];
            
            // Prepare message (includes proposalId and call data)
            messages[i] = abi.encode(
                _proposalId,
                execution.calls[i]
            );
        }
        
        // Use lzCompose to send all messages atomically
        address composer = quoter.getComposer(msg.sender);
        require(composer != address(0), "OPE: Composer not found");
        
        // Get the fee for the composed message
        try IMessagingComposer(composer).quoteMessagesGas(
            dstChainIds,
            messages,
            bytes("")
        ) returns (MessagingFee memory fee) {
            // Ensure enough ETH was provided
            require(msg.value >= fee.nativeFee, "OPE: Insufficient fee for lzCompose");
            
            // Send composed message
            IMessagingComposer(composer).sendComposedMessages{value: fee.nativeFee}(
                dstChainIds,
                messages,
                payable(msg.sender), // Refund address
                bytes("")            // Options
            );
            
            // Emit events for each destination
            for (uint i = 0; i < dstChainIds.length; i++) {
                emit CrossChainExecutionSent(_proposalId, dstChainIds[i]);
            }
        } catch {
            execution.status = ExecutionStatus.Failed;
            revert("OPE: lzCompose failed");
        }
    }
    
    /**
     * @dev Send an execution message to a remote chain
     * @param _proposalId The unique identifier of the proposal
     * @param _dstChainId The destination chain ID
     * @param _callData The encoded call data
     */
    function _sendCrossChainExecution(
        bytes32 _proposalId,
        uint32 _dstChainId,
        bytes memory _callData
    ) internal {
        bytes memory payload = abi.encode(
            _proposalId,
            _callData
        );
        
        try this.quoteFee(_dstChainId, payload, bytes("")) returns (MessagingFee memory fee) {
            require(msg.value >= fee.nativeFee, "OPE: Insufficient fee");
            
            // Send message
            _lzSend(
                _dstChainId,
                payload,
                fee,
                payload, // Options
                msg.value
            );
        } catch {
            executions[_proposalId].status = ExecutionStatus.Failed;
            revert("OPE: Cross-chain send failed");
        }
    }
    
    /**
     * @dev Process received cross-chain execution message
     */
    function _lzReceive(
        Origin memory _origin,
        bytes32 _guid,
        bytes memory _message,
        address _executor,
        bytes memory _extraData
    ) internal override {
        // Decode the message
        (
            bytes32 proposalId,
            bytes memory callData
        ) = abi.decode(_message, (bytes32, bytes));
        
        // Execute the call (simplified - in a real implementation we'd decode and call the target)
        emit CrossChainExecutionReceived(proposalId, _origin.srcChainId);
    }
}