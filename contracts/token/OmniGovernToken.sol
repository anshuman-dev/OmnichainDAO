// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/lz-evm-sdk-v2/contracts/oft/OFT.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OmniGovernToken
 * @dev Cross-chain governance token built on LayerZero v2
 * Combines OFT (Omnichain Fungible Token) with ERC20Votes for cross-chain governance
 */
contract OmniGovernToken is OFT, ERC20Votes, Ownable {
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18; // 100 million tokens
    
    /**
     * @dev Constructor for OmniGovernToken
     * @param _endpoint The LayerZero endpoint address
     * @param _owner The owner of the contract
     */
    constructor(address _endpoint, address _owner) 
        OFT("OmniGovernToken", "OGT", _endpoint) 
        ERC20Permit("OmniGovernToken")
    {
        _transferOwnership(_owner);
        
        // Initial supply mint to the hub chain
        _mint(_owner, MAX_SUPPLY);
    }
    
    /**
     * @dev Override _update to make it compatible with both OFT and ERC20Votes
     */
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }
    
    /**
     * @dev Override nonces to make it compatible with both OFT and ERC20Votes
     */
    function nonces(address owner) public view override(ERC20Permit, Nonceable) returns (uint256) {
        return super.nonces(owner);
    }
    
    /**
     * @dev Override decimals to be 18 as required by LayerZero
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    /**
     * @dev Burns tokens on the specified chain (used by governor)
     * @param account The account to burn from
     * @param amount The amount to burn
     */
    function burn(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
    
    /**
     * @dev Mints tokens to the specified account (used in initial deployment and governance)
     * @param account The account to mint to
     * @param amount The amount to mint
     */
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
    
    /**
     * @dev Cross-chain vote delegation
     * @param dstEid The destination endpoint ID
     * @param delegatee The address to delegate to
     * @param options The LayerZero messaging options
     */
    function crossChainDelegate(
        uint32 dstEid,
        address delegatee,
        bytes calldata options
    ) external payable {
        bytes memory payload = abi.encode(delegatee, msg.sender);
        
        _lzSend(
            dstEid,
            payload,
            options,
            msg.value,
            payable(msg.sender)
        );
    }
    
    /**
     * @dev Handles lzReceive from LayerZero with processing incoming messages
     * @param _origin The origin endpoint and sender
     * @param _guid The guid for the message
     * @param _message The message being received
     * @param _executor Who called lzReceive
     * @param _extraData Any extra data
     */
    function _lzReceive(
        Origin memory _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        (address delegatee, address delegator) = abi.decode(_message, (address, address));
        
        // Execute the delegation
        _delegate(delegator, delegatee);
    }
}