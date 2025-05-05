// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../messaging/LayerZeroV2Adapter.sol";

/**
 * @title TimelockedExecutor
 * @dev Implementation of a timelock controller that executes governance decisions
 * after a delay. Integrates with LayerZero for cross-chain execution capabilities.
 */
contract TimelockedExecutor is TimelockController {
    // LayerZero adapter for cross-chain messaging
    LayerZeroV2Adapter public lzAdapter;
    
    // Mapping of proposal IDs to execution status across chains
    mapping(bytes32 => mapping(uint16 => bool)) public executedOnChain;
    
    // Execution delay for cross-chain proposals (in seconds)
    uint256 public crossChainExecutionDelay;
    
    /**
     * @dev Constructor
     * @param minDelay The minimum delay before execution
     * @param proposers List of addresses that can propose
     * @param executors List of addresses that can execute
     * @param admin Admin address
     * @param _lzAdapter LayerZero adapter address
     * @param _crossChainExecutionDelay Delay for cross-chain execution
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin,
        address _lzAdapter,
        uint256 _crossChainExecutionDelay
    ) TimelockController(minDelay, proposers, executors, admin) {
        require(_lzAdapter != address(0), "TimelockedExecutor: LZ adapter cannot be zero");
        
        lzAdapter = LayerZeroV2Adapter(_lzAdapter);
        crossChainExecutionDelay = _crossChainExecutionDelay;
    }
    
    /**
     * @dev Queue a cross-chain transaction
     * @param chainId Target chain ID
     * @param target Target address on the destination chain
     * @param value Native token value
     * @param data Function call data
     * @param predecessor Predecessor task ID (0 for no dependency)
     * @param salt Unique salt for the operation
     * @return operationId The ID of the operation
     */
    function queueCrossChainTransaction(
        uint16 chainId,
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(PROPOSER_ROLE) returns (bytes32) {
        bytes32 operationId = _hashOperation(target, value, data, predecessor, salt);
        
        // Queue the local timelock
        _schedule(operationId, crossChainExecutionDelay, predecessor, salt);
        
        // Encode the cross-chain execution data
        bytes memory crossChainData = abi.encode(operationId, target, value, data, predecessor, salt);
        
        emit CrossChainTransactionQueued(operationId, chainId, target, value, keccak256(data), msg.sender);
        
        return operationId;
    }
    
    /**
     * @dev Execute a cross-chain transaction
     * @param chainId Target chain ID
     * @param target Target address on the destination chain
     * @param value Native token value
     * @param data Function call data
     * @param predecessor Predecessor task ID
     * @param salt Unique salt for the operation
     * @param refundAddress Address to refund excess fees
     * @param adapterParams Additional parameters for the adapter
     */
    function executeCrossChainTransaction(
        uint16 chainId,
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        address payable refundAddress,
        bytes calldata adapterParams
    ) external payable onlyRole(EXECUTOR_ROLE) {
        bytes32 operationId = _hashOperation(target, value, data, predecessor, salt);
        
        // Verify that the operation is ready for execution
        require(isOperationReady(operationId), "TimelockedExecutor: Operation not ready");
        
        // Prepare cross-chain execution payload
        bytes memory crossChainPayload = abi.encode(operationId, target, value, data, predecessor, salt);
        
        // Send cross-chain message
        lzAdapter.sendMessage{value: msg.value}(
            chainId,
            crossChainPayload,
            refundAddress,
            address(0), // No ZRO payment
            adapterParams
        );
        
        // Mark as executed locally
        _afterOperation(operationId);
        executedOnChain[operationId][chainId] = true;
        
        emit CrossChainTransactionExecuted(operationId, chainId, target, value, keccak256(data), msg.sender);
    }
    
    /**
     * @dev Execute a batch of cross-chain transactions atomically using lzCompose
     * @param chainIds Array of target chain IDs
     * @param targets Array of target addresses
     * @param values Array of native token values
     * @param dataElements Array of function call data
     * @param predecessors Array of predecessor task IDs
     * @param salts Array of unique salts
     * @param refundAddress Address to refund excess fees
     * @param adapterParams Additional parameters for the adapter
     */
    function executeAtomicCrossChainBatch(
        uint16[] calldata chainIds,
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata dataElements,
        bytes32[] calldata predecessors,
        bytes32[] calldata salts,
        address payable refundAddress,
        bytes calldata adapterParams
    ) external payable onlyRole(EXECUTOR_ROLE) {
        require(
            chainIds.length == targets.length &&
            targets.length == values.length &&
            values.length == dataElements.length &&
            dataElements.length == predecessors.length &&
            predecessors.length == salts.length,
            "TimelockedExecutor: Array length mismatch"
        );
        
        // Prepare payloads for each chain
        bytes[] memory payloads = new bytes[](chainIds.length);
        
        for (uint256 i = 0; i < chainIds.length; i++) {
            bytes32 operationId = _hashOperation(targets[i], values[i], dataElements[i], predecessors[i], salts[i]);
            
            // Verify that the operation is ready for execution
            require(isOperationReady(operationId), "TimelockedExecutor: Operation not ready");
            
            // Prepare cross-chain execution payload
            payloads[i] = abi.encode(operationId, targets[i], values[i], dataElements[i], predecessors[i], salts[i]);
            
            // Mark as executed locally
            _afterOperation(operationId);
            executedOnChain[operationId][chainIds[i]] = true;
            
            emit CrossChainTransactionExecuted(operationId, chainIds[i], targets[i], values[i], keccak256(dataElements[i]), msg.sender);
        }
        
        // Send composed message to execute all operations atomically
        lzAdapter.sendComposedMessage{value: msg.value}(
            chainIds,
            payloads,
            refundAddress,
            adapterParams
        );
        
        emit AtomicBatchExecuted(chainIds.length, msg.sender);
    }
    
    /**
     * @dev Check if a cross-chain transaction has been executed on a specific chain
     * @param operationId Operation ID
     * @param chainId Chain ID
     * @return hasExecuted Whether the transaction has been executed
     */
    function hasBeenExecutedOnChain(bytes32 operationId, uint16 chainId) external view returns (bool) {
        return executedOnChain[operationId][chainId];
    }
    
    /**
     * @dev Set the LayerZero adapter
     * @param _lzAdapter New adapter address
     */
    function setLayerZeroAdapter(address _lzAdapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_lzAdapter != address(0), "TimelockedExecutor: LZ adapter cannot be zero");
        
        lzAdapter = LayerZeroV2Adapter(_lzAdapter);
        emit LayerZeroAdapterSet(_lzAdapter);
    }
    
    /**
     * @dev Set cross-chain execution delay
     * @param _delay New delay in seconds
     */
    function setCrossChainExecutionDelay(uint256 _delay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        crossChainExecutionDelay = _delay;
        emit CrossChainExecutionDelaySet(_delay);
    }
    
    /**
     * @dev Handle execution confirmation from a remote chain
     * @param operationId Operation ID
     * @param chainId Source chain ID
     * @param result Execution result (success or failure)
     */
    function confirmRemoteExecution(bytes32 operationId, uint16 chainId, bool result) external {
        // Only the LZ adapter can call this
        require(msg.sender == address(lzAdapter), "TimelockedExecutor: Only LZ adapter can confirm");
        
        executedOnChain[operationId][chainId] = result;
        emit RemoteExecutionConfirmed(operationId, chainId, result);
    }
    
    // Events
    event CrossChainTransactionQueued(bytes32 indexed operationId, uint16 indexed chainId, address target, uint256 value, bytes32 dataHash, address indexed proposer);
    event CrossChainTransactionExecuted(bytes32 indexed operationId, uint16 indexed chainId, address target, uint256 value, bytes32 dataHash, address indexed executor);
    event AtomicBatchExecuted(uint256 operationCount, address indexed executor);
    event LayerZeroAdapterSet(address indexed adapter);
    event CrossChainExecutionDelaySet(uint256 delay);
    event RemoteExecutionConfirmed(bytes32 indexed operationId, uint16 indexed chainId, bool result);
}