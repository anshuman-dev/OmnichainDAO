// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/lz-evm-sdk-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "@layerzerolabs/lz-evm-sdk-v2/contracts/lzApp/MessagingComposer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title OmniProposalExecutor
 * @dev Handles atomic execution of governance proposals across multiple chains using lzCompose
 */
contract OmniProposalExecutor is Ownable, MessagingComposer {
    using Counters for Counters.Counter;
    
    ILayerZeroEndpointV2 public endpoint;
    
    // Track proposals
    Counters.Counter private proposalIds;
    
    // Proposal status
    enum ProposalStatus { Pending, Succeeded, Failed, Executed }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address proposer;
        bytes[] calldatas;
        address[] targets;
        uint256 executionTime;
        ProposalStatus status;
        mapping(uint32 => bool) executedOnChain; // Track execution per chain
    }
    
    // Map proposal IDs to Proposal structs
    mapping(uint256 => Proposal) public proposals;
    
    // Chain configuration
    struct ChainConfig {
        uint32 eid;
        string name;
        address executor; // Remote executor address on that chain
        bool isActive;
    }
    
    // Map of chain ID to ChainConfig
    mapping(uint32 => ChainConfig) public chainConfigs;
    
    // Array to track all configured chains
    uint32[] public configuredChains;
    
    // Events
    event ProposalCreated(uint256 proposalId, address proposer, string title);
    event ProposalExecuted(uint256 proposalId, uint32[] chains);
    event ChainConfigured(uint32 eid, string name, address executor);
    event ExecutionRequested(uint256 proposalId, uint32 chainId);
    event ExecutionCompleted(uint256 proposalId, uint32 chainId, bool success);
    
    /**
     * @dev Constructor
     * @param _endpoint The LayerZero endpoint
     * @param _owner The owner of the contract
     */
    constructor(address _endpoint, address _owner) Ownable() {
        endpoint = ILayerZeroEndpointV2(_endpoint);
        _transferOwnership(_owner);
    }
    
    /**
     * @dev Configure a chain for cross-chain execution
     * @param _eid The chain endpoint ID
     * @param _name Chain name (for readability)
     * @param _executor The executor contract address on the remote chain
     */
    function configureChain(
        uint32 _eid,
        string memory _name,
        address _executor
    ) external onlyOwner {
        require(_executor != address(0), "Executor address cannot be zero");
        
        // If this is a new chain, add it to the array
        if (!chainConfigs[_eid].isActive) {
            configuredChains.push(_eid);
        }
        
        // Update the chain configuration
        chainConfigs[_eid] = ChainConfig({
            eid: _eid,
            name: _name,
            executor: _executor,
            isActive: true
        });
        
        emit ChainConfigured(_eid, _name, _executor);
    }
    
    /**
     * @dev Create a new proposal
     * @param _title The proposal title
     * @param _description The proposal description
     * @param _targets The target addresses for each transaction
     * @param _calldatas The call data for each transaction
     */
    function createProposal(
        string memory _title,
        string memory _description,
        address[] memory _targets,
        bytes[] memory _calldatas
    ) external returns (uint256) {
        require(_targets.length == _calldatas.length, "Target and calldata count mismatch");
        require(_targets.length > 0, "No targets specified");
        
        // Increment proposal ID
        proposalIds.increment();
        uint256 proposalId = proposalIds.current();
        
        // Create new proposal
        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.proposer = msg.sender;
        newProposal.targets = _targets;
        newProposal.calldatas = _calldatas;
        newProposal.status = ProposalStatus.Pending;
        
        emit ProposalCreated(proposalId, msg.sender, _title);
        
        return proposalId;
    }
    
    /**
     * @dev Execute a proposal atomically across all chains using lzCompose
     * @param _proposalId The ID of the proposal to execute
     * @param _options Configuration options for LayerZero
     */
    function executeProposal(
        uint256 _proposalId,
        bytes calldata _options
    ) external payable {
        Proposal storage proposal = proposals[_proposalId];
        
        require(proposal.id == _proposalId, "Proposal does not exist");
        require(proposal.status == ProposalStatus.Pending, "Proposal cannot be executed");
        
        // Set execution timestamp
        proposal.executionTime = block.timestamp;
        
        // Mark proposal as in progress
        proposal.status = ProposalStatus.Succeeded;
        
        // Prepare for lzCompose
        uint32[] memory chains = new uint32[](configuredChains.length);
        address[] memory remoteDsts = new address[](configuredChains.length);
        bytes[] memory messages = new bytes[](configuredChains.length);
        
        // Build messages for each chain
        for (uint256 i = 0; i < configuredChains.length; i++) {
            uint32 chainId = configuredChains[i];
            
            if (chainConfigs[chainId].isActive) {
                chains[i] = chainId;
                remoteDsts[i] = chainConfigs[chainId].executor;
                
                // Build message with proposal data
                messages[i] = abi.encode(
                    _proposalId,
                    proposal.targets,
                    proposal.calldatas
                );
                
                emit ExecutionRequested(_proposalId, chainId);
            }
        }
        
        // Create the composed message
        MessagingParams[] memory msgParams = _createMessagingParams(chains, remoteDsts, messages);
        
        // Pay for the message
        endpoint.send{value: msg.value}(msgParams, _options, payable(msg.sender));
        
        // Note which chains this was executed on
        emit ProposalExecuted(_proposalId, chains);
    }
    
    /**
     * @dev Handle incoming cross-chain execution message
     * @param _origin The origin of the message
     * @param _guid The message GUID
     * @param _message The encoded message
     * @param _executor The executor of the message
     * @param _extraData Any extra data
     */
    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external {
        require(msg.sender == address(endpoint), "Invalid sender");
        
        // Decode message
        (
            uint256 proposalId,
            address[] memory targets,
            bytes[] memory calldatas
        ) = abi.decode(_message, (uint256, address[], bytes[]));
        
        // Execute each transaction
        bool allSuccess = true;
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call(calldatas[i]);
            if (!success) {
                allSuccess = false;
                break;
            }
        }
        
        // Mark the chain as executed
        Proposal storage proposal = proposals[proposalId];
        proposal.executedOnChain[_origin.srcEid] = true;
        
        emit ExecutionCompleted(proposalId, _origin.srcEid, allSuccess);
    }
    
    /**
     * @dev Check if proposal has been executed on a specific chain
     * @param _proposalId The proposal ID
     * @param _chainId The chain ID
     * @return Whether the proposal has been executed on the chain
     */
    function isExecutedOnChain(uint256 _proposalId, uint32 _chainId) external view returns (bool) {
        return proposals[_proposalId].executedOnChain[_chainId];
    }
    
    /**
     * @dev Get proposal details
     * @param _proposalId The proposal ID
     * @return title The proposal title
     * @return description The proposal description
     * @return proposer The proposer address
     * @return status The proposal status
     * @return executionTime The execution timestamp
     */
    function getProposalDetails(uint256 _proposalId) external view returns (
        string memory title,
        string memory description,
        address proposer,
        ProposalStatus status,
        uint256 executionTime
    ) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.id == _proposalId, "Proposal does not exist");
        
        return (
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.status,
            proposal.executionTime
        );
    }
}