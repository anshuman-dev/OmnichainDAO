// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/token/oft/OFT.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title OmniGovernToken
 * @dev Implementation of the OmniGovern DAO token with cross-chain capabilities
 * using LayerZero's OFT (Omnichain Fungible Token) standard
 */
contract OmniGovernToken is IOmniGovernToken, OFT, ERC20Votes, Ownable {
    // Bridge fee rate (denominator is 1,000,000)
    uint256 private _bridgeFeeRate;
    
    // Accumulated bridge fees
    uint256 private _accumulatedBridgeFees;
    
    /**
     * @dev Constructor for OmniGovernToken
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _lzEndpoint LayerZero endpoint address
     * @param _owner Owner of the token contract
     * @param _initialSupply Initial token supply (all minted to the owner)
     * @param _initialBridgeFeeRate Initial bridge fee rate
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _owner,
        uint256 _initialSupply,
        uint256 _initialBridgeFeeRate
    )
        ERC20(_name, _symbol)
        ERC20Permit(_name)
        OFT(_lzEndpoint)
        Ownable(_owner)
    {
        require(_initialBridgeFeeRate <= 10000, "OmniGovernToken: Bridge fee rate too high");
        _bridgeFeeRate = _initialBridgeFeeRate;
        
        // Mint initial supply to the owner
        _mint(_owner, _initialSupply);
    }
    
    /**
     * @dev Override to support both OFT and ERC20Votes
     */
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }
    
    /**
     * @dev Override to support both OFT and ERC20Votes
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
    
    /**
     * @dev Get the bridge fee for a specific amount
     * @param amount The amount being bridged
     * @return The fee amount
     */
    function getBridgeFee(uint256 amount) public view override returns (uint256) {
        return (amount * _bridgeFeeRate) / 1_000_000;
    }
    
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
    ) external payable override {
        // Calculate and deduct bridge fee
        uint256 fee = getBridgeFee(amount);
        uint256 amountAfterFee = amount - fee;
        
        // Update accumulated fees
        _accumulatedBridgeFees += fee;
        
        // Send tokens to the destination chain
        _send(
            msg.sender,
            dstChainId,
            to,
            amountAfterFee,
            refundAddress,
            zroPaymentAddress,
            adapterParams
        );
        
        emit TokensSent(msg.sender, dstChainId, to, amount, fee, amountAfterFee);
    }
    
    /**
     * @dev Set the bridge fee rate
     * @param newBridgeFeeRate The new bridge fee rate
     */
    function setBridgeFeeRate(uint256 newBridgeFeeRate) external override onlyOwner {
        require(newBridgeFeeRate <= 10000, "OmniGovernToken: Bridge fee rate too high");
        _bridgeFeeRate = newBridgeFeeRate;
        emit BridgeFeeRateChanged(_bridgeFeeRate, newBridgeFeeRate);
    }
    
    /**
     * @dev Get the current bridge fee rate
     * @return The current bridge fee rate
     */
    function bridgeFeeRate() external view override returns (uint256) {
        return _bridgeFeeRate;
    }
    
    /**
     * @dev Get the accumulated bridge fees
     * @return The accumulated bridge fees
     */
    function accumulatedBridgeFees() external view returns (uint256) {
        return _accumulatedBridgeFees;
    }
    
    /**
     * @dev Withdraw accumulated bridge fees
     * @param to The address to send the fees to
     */
    function withdrawBridgeFees(address to) external override onlyOwner {
        require(_accumulatedBridgeFees > 0, "OmniGovernToken: No fees to withdraw");
        require(to != address(0), "OmniGovernToken: Cannot withdraw to zero address");
        
        uint256 amount = _accumulatedBridgeFees;
        _accumulatedBridgeFees = 0;
        
        _transfer(address(this), to, amount);
        
        emit BridgeFeesWithdrawn(to, amount);
    }
    
    /**
     * @dev Override this function to circumvent the OFT standard's fee mechanism
     * since we implement our own fee system
     */
    function _debitFrom(
        address from, 
        uint16, 
        bytes memory, 
        uint256 amount
    ) internal override returns (uint256) {
        require(from == _msgSender(), "OmniGovernToken: Sender must be the from address");
        
        // Burn tokens from the sender directly
        _burn(from, amount);
        
        // Return the amount after token-level fee (0 for now)
        return amount;
    }
    
    /**
     * @dev Override this function to handle the received tokens on the destination chain
     */
    function _creditTo(
        uint16, 
        address toAddress, 
        uint256 amount
    ) internal override returns (uint256) {
        // Mint tokens to the recipient
        _mint(toAddress, amount);
        
        // Return the amount received
        return amount;
    }
    
    /**
     * @dev Called by the OFT protocol to handle an incoming packet
     */
    function _nonblockingLzReceive(
        uint16 srcChainId,
        bytes memory srcAddress,
        uint64 nonce,
        bytes memory payload
    ) internal override {
        // Let OFT handle the token transfer
        super._nonblockingLzReceive(srcChainId, srcAddress, nonce, payload);
    }
    
    // Events
    event TokensSent(address indexed from, uint16 indexed dstChainId, bytes32 indexed to, uint256 amount, uint256 fee, uint256 amountAfterFee);
    event BridgeFeeRateChanged(uint256 oldRate, uint256 newRate);
    event BridgeFeesWithdrawn(address indexed to, uint256 amount);
}