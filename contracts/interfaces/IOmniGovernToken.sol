// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IOmniGovernToken
 * @dev Interface for the OmniGovernToken contract
 */
interface IOmniGovernToken {
    /**
     * @dev Get the bridge fee for a specific amount
     * @param amount The amount being bridged
     * @return The fee amount
     */
    function getBridgeFee(uint256 amount) external view returns (uint256);
    
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
     * @dev Set the bridge fee rate
     * @param newBridgeFeeRate The new bridge fee rate
     */
    function setBridgeFeeRate(uint256 newBridgeFeeRate) external;
    
    /**
     * @dev Get the current bridge fee rate
     * @return The current bridge fee rate
     */
    function bridgeFeeRate() external view returns (uint256);
    
    /**
     * @dev Withdraw accumulated bridge fees
     * @param to The address to send the fees to
     */
    function withdrawBridgeFees(address to) external;
}