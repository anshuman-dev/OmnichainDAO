// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOmniGovernor
 * @dev Interface for the OmniGovernor contract
 */
interface IOmniGovernor {
    /**
     * @dev Structure to store cross-chain proposal information
     */
    struct CrossChainProposal {
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bytes32 messageHash;
    }
    
    /**
     * @dev Send a cross-chain vote to another chain
     * @param proposalId ID of the proposal
     * @param support Support value (0=against, 1=for, 2=abstain)
     * @param dstChainId Destination chain ID
     * @param votes Number of votes to cast
     */
    function sendCrossChainVote(
        uint256 proposalId,
        uint8 support,
        uint16 dstChainId,
        uint256 votes
    ) external payable;
    
    /**
     * @dev Receive a cross-chain vote
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
}