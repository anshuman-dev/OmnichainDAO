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
    
    /**
     * @dev Set the supply consistency checker address
     * @param _supplyChecker The address of the supply checker contract
     */
    function setSupplyChecker(address _supplyChecker) external;
    
    /**
     * @dev Get supply consistency stats
     * @return totalSupply Current total supply
     * @return totalMinted Total amount minted
     * @return totalBurned Total amount burned
     */
    function getSupplyConsistencyData() external view returns (uint256 totalSupply, uint256 totalMinted, uint256 totalBurned);
    
    /**
     * @dev Check if supply is consistent
     * @return isConsistent Whether supply is consistent
     * @return expectedSupply Expected supply based on mint/burn tracking
     * @return actualSupply Actual supply reported by the token
     */
    function checkSupplyConsistency() external view returns (bool isConsistent, uint256 expectedSupply, uint256 actualSupply);
    
    /**
     * @dev Reconcile supply if a mismatch is detected (only callable by supply checker)
     * @param expectedSupply The expected supply to reconcile to
     * @return success Whether reconciliation was successful
     */
    function reconcileSupply(uint256 expectedSupply) external returns (bool);
}