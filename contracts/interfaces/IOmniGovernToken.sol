// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title IOmniGovernToken
 * @dev Interface for the OmniGovernToken contract used by OmniGovern DAO
 */
interface IOmniGovernToken is IERC20Metadata, IERC20Permit {
    /**
     * @dev Send tokens from one chain to another
     * @param _from Address to send tokens from
     * @param _dstChainId LayerZero destination chain ID
     * @param _toAddress Destination address (converted to bytes)
     * @param _amount Amount of tokens to send
     * @param _refundAddress Address to refund excess fees to
     * @param _zroPaymentAddress Address to pay ZRO fees (usually zero)
     * @param _adapterParams Adapter parameters for execution
     */
    function sendFrom(
        address _from,
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;
    
    /**
     * @dev Estimate fee for sending tokens to another chain
     * @param _dstChainId LayerZero destination chain ID
     * @param _toAddress Destination address (converted to bytes)
     * @param _amount Amount of tokens to send
     * @param _useZro Whether to use ZRO token for fees (usually false)
     * @param _adapterParams Adapter parameters for execution
     * @return nativeFee Fee in native gas token
     * @return zroFee Fee in ZRO tokens
     */
    function estimateSendFee(
        uint16 _dstChainId,
        bytes calldata _toAddress,
        uint256 _amount,
        bool _useZro,
        bytes calldata _adapterParams
    ) external view returns (uint256 nativeFee, uint256 zroFee);
    
    /**
     * @dev Get bridge fee percentage
     * @return Current bridge fee as a percentage (e.g., 0.1% = 1000)
     */
    function getBridgeFee() external view returns (uint256);
    
    /**
     * @dev Request delegation of votes
     * @param delegatee Address to delegate votes to
     */
    function delegate(address delegatee) external;
    
    /**
     * @dev Get current votes for an account
     * @param account Address to get votes for
     * @return Current votes the account has
     */
    function getVotes(address account) external view returns (uint256);
    
    /**
     * @dev Get past votes for an account at a specific block number
     * @param account Address to get votes for
     * @param blockNumber Block number to get votes at
     * @return Past votes the account had at the specified block
     */
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
}