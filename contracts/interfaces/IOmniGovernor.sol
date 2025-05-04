// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOmniGovernor
 * @dev Interface for the OmniGovernor contract used by OmniGovern DAO
 */
interface IOmniGovernor {
    // Proposal states
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
    
    // Proposal information structure
    struct ProposalVote {
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        mapping(address => bool) hasVoted;
    }
    
    // Cross-chain proposal information
    struct CrossChainProposal {
        uint256 proposalId;
        uint16 sourceChainId;
        bytes32 messageHash;
        uint256 againstVotes;
        uint256 forVotes;
        uint256 abstainVotes;
        bool executed;
    }

    /**
     * @dev Create a new proposal
     * @param targets Target addresses for proposal calls
     * @param values ETH values for proposal calls
     * @param calldatas Function call data for proposal calls
     * @param description Description of the proposal
     * @return Proposal ID
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256);
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support Support value (0=against, 1=for, 2=abstain)
     */
    function castVote(uint256 proposalId, uint8 support) external;
    
    /**
     * @dev Execute a proposal
     * @param proposalId ID of the proposal
     * @param targets Target addresses for proposal calls
     * @param values ETH values for proposal calls
     * @param calldatas Function call data for proposal calls
     * @param descriptionHash Hash of the proposal description
     */
    function execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) external payable;
    
    /**
     * @dev Send a cross-chain vote to the source chain
     * @param proposalId ID of the proposal
     * @param support Support value (0=against, 1=for, 2=abstain)
     * @param dstChainId Destination chain ID
     * @param votes Number of votes to send
     */
    function sendCrossChainVote(
        uint256 proposalId,
        uint8 support,
        uint16 dstChainId,
        uint256 votes
    ) external payable;
    
    /**
     * @dev Receive a cross-chain vote from another chain
     * @param sourceChainId Source chain ID
     * @param sourceAddress Source address (in bytes)
     * @param proposalId ID of the proposal
     * @param support Support value (0=against, 1=for, 2=abstain)
     * @param votes Number of votes
     */
    function receiveCrossChainVote(
        uint16 sourceChainId,
        bytes memory sourceAddress,
        uint256 proposalId,
        uint8 support,
        uint256 votes
    ) external;
    
    /**
     * @dev Get the current state of a proposal
     * @param proposalId ID of the proposal
     * @return Current state of the proposal
     */
    function state(uint256 proposalId) external view returns (ProposalState);
    
    /**
     * @dev Get the voting power of an account for a specific proposal
     * @param account Address to get voting power for
     * @param proposalId ID of the proposal
     * @return Voting power of the account for the proposal
     */
    function getVotes(address account, uint256 proposalId) external view returns (uint256);
    
    /**
     * @dev Check if a proposal exists
     * @param proposalId ID of the proposal
     * @return True if the proposal exists
     */
    function proposalExists(uint256 proposalId) external view returns (bool);
    
    /**
     * @dev Get proposal vote counts
     * @param proposalId ID of the proposal
     * @return againstVotes Number of against votes
     * @return forVotes Number of for votes
     * @return abstainVotes Number of abstain votes
     */
    function proposalVotes(uint256 proposalId) external view returns (
        uint256 againstVotes,
        uint256 forVotes,
        uint256 abstainVotes
    );
}