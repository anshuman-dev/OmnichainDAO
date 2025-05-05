// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IOmniGovernToken
 * @dev Interface for the OmniGovernToken contract
 */
interface IOmniGovernToken {
    // Enum for proposal status
    enum ProposalStatus {
        Active,
        Succeeded,
        Defeated,
        Executed
    }
    
    // Struct for proposals
    struct Proposal {
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        ProposalStatus status;
    }
    
    // Struct for votes
    struct Vote {
        bool hasVoted;
        uint8 support; // 0=against, 1=for, 2=abstain
        uint256 weight;
    }
    
    // OFT V2 has its own MessagingFee struct
    struct MessagingFee {
        uint256 nativeFee;
        uint256 lzTokenFee;
    }
    
    /**
     * @dev Creates a new proposal for cross-chain governance
     * @param _title Title of the proposal
     * @param _description Detailed description of the proposal
     * @param _startTime When voting begins
     * @param _endTime When voting ends
     * @return proposalId The unique identifier for the proposal
     */
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external returns (bytes32);
    
    /**
     * @dev Casts a vote on a proposal
     * @param _proposalId The unique identifier of the proposal
     * @param _support 0=against, 1=for, 2=abstain
     */
    function castVote(bytes32 _proposalId, uint8 _support) external;
    
    /**
     * @dev Sends a cross-chain vote via LayerZero
     * @param _proposalId The unique identifier of the proposal
     * @param _support 0=against, 1=for, 2=abstain
     * @param _dstChainId The destination chain ID (LayerZero chain ID)
     * @param _msgFee The messaging fee structure
     * @param _options Additional options for LayerZero
     */
    function castCrossChainVote(
        bytes32 _proposalId,
        uint8 _support,
        uint32 _dstChainId,
        MessagingFee memory _msgFee,
        bytes memory _options
    ) external payable;
    
    /**
     * @dev Gets the details of a proposal
     * @param _proposalId The unique identifier of the proposal
     * @return proposal The proposal details
     */
    function getProposal(bytes32 _proposalId) external view returns (Proposal memory);
    
    /**
     * @dev Checks whether a voter has voted on a proposal
     * @param _proposalId The unique identifier of the proposal
     * @param _voter The address to check
     * @return hasVoted Whether the address has voted
     * @return support The vote type (0=against, 1=for, 2=abstain)
     * @return weight The voting weight
     */
    function getVote(bytes32 _proposalId, address _voter) external view returns (
        bool hasVoted,
        uint8 support,
        uint256 weight
    );
    
    /**
     * @dev Update proposal status based on votes
     * @param _proposalId The unique identifier of the proposal
     */
    function updateProposalStatus(bytes32 _proposalId) external;
    
    /**
     * @dev Get the total voting power from a specific chain
     * @param _chainId The LayerZero chain ID
     * @return votingPower The total voting power from that chain
     */
    function getChainVotingPower(uint32 _chainId) external view returns (uint256);
}