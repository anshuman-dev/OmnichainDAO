// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOmniGovernToken
 * @dev Interface for the OmniGovernToken contract
 */
interface IOmniGovernToken {
    /**
     * @dev Send tokens to another chain
     * @param dstChainId The destination chain ID
     * @param to The recipient address
     * @param amount The amount to send
     * @param refundAddress The address to refund excess fees to
     * @param zroPaymentAddress The ZRO payment address (if applicable)
     * @param adapterParams Additional parameters for the adapter
     */
    function sendTokens(
        uint16 dstChainId,
        bytes32 to,
        uint256 amount,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable;
    
    /**
     * @dev Set trusted remote address for a chain
     * @param remoteChainId The remote chain ID
     * @param path The path to the remote contract
     */
    function setTrustedRemote(uint16 remoteChainId, bytes calldata path) external;
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId The ID of the proposal
     * @param support Whether to support the proposal
     */
    function vote(uint256 proposalId, bool support) external;
    
    /**
     * @dev Get the voting power for an account
     * @param account The account to get voting power for
     * @return The voting power
     */
    function getVotingPower(address account) external view returns (uint256);
    
    /**
     * @dev Delegate voting power to another address
     * @param delegatee The address to delegate to
     */
    function delegateVotingPower(address delegatee) external;
    
    /**
     * @dev Set the hub chain ID
     * @param hubChainId The new hub chain ID
     */
    function setHubChainId(uint16 hubChainId) external;
}