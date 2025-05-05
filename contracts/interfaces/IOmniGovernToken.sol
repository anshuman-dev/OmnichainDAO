// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

/**
 * @title IOmniGovernToken
 * @dev Interface for the OmniGovernToken contract
 */
interface IOmniGovernToken is IERC20Metadata, IERC20Permit {
    /**
     * @dev Burns tokens on the specified chain
     * @param account The account to burn from
     * @param amount The amount to burn
     */
    function burn(address account, uint256 amount) external;
    
    /**
     * @dev Mints tokens to the specified account
     * @param account The account to mint to
     * @param amount The amount to mint
     */
    function mint(address account, uint256 amount) external;
    
    /**
     * @dev Cross-chain vote delegation
     * @param dstEid The destination endpoint ID
     * @param delegatee The address to delegate to
     * @param options The LayerZero options
     */
    function crossChainDelegate(
        uint32 dstEid,
        address delegatee,
        bytes calldata options
    ) external payable;
    
    /**
     * @dev Returns the delegation power of an account
     * @param account The account to get the delegation power of
     * @return The delegation power of the account
     */
    function getVotes(address account) external view returns (uint256);
    
    /**
     * @dev Returns the delegation power of an account at a certain block
     * @param account The account to get the delegation power of
     * @param blockNumber The block number to get the delegation power at
     * @return The delegation power of the account at the block
     */
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    
    /**
     * @dev Returns the current delegation power of a delegatee
     * @param delegatee The delegatee to get the delegation power of
     * @return The delegation power of the delegatee
     */
    function delegates(address delegatee) external view returns (address);
    
    /**
     * @dev Delegates voting power to an address
     * @param delegatee The address to delegate to
     */
    function delegate(address delegatee) external;
    
    /**
     * @dev Delegates voting power to an address with a signature
     * @param delegatee The address to delegate to
     * @param nonce The nonce for the signature
     * @param expiry The expiry for the signature
     * @param v The v component of the signature
     * @param r The r component of the signature
     * @param s The s component of the signature
     */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}