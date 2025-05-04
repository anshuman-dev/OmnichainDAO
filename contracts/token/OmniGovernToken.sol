// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/token/oft/v2/OFTCoreV2.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/token/oft/v2/OFTV2.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title OmniGovernToken
 * @dev Implementation of the OmniGovernToken - a governance token that can be transferred across chains
 * using LayerZero OFT (Omnichain Fungible Token) standard
 */
contract OmniGovernToken is OFTV2, ERC20Votes, Ownable {
    uint256 public constant BRIDGE_FEE_DENOMINATOR = 1000000; // 6 decimals for precision
    uint256 public bridgeFeeRate; // Fee rate in parts per BRIDGE_FEE_DENOMINATOR (e.g., 1000 = 0.1%)
    
    /**
     * @dev Constructor for OmniGovernToken
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _lzEndpoint LayerZero endpoint contract address
     * @param _owner Owner of the contract
     * @param _initialSupply Initial token supply to mint
     * @param _bridgeFeeRate Initial bridge fee rate (in parts per BRIDGE_FEE_DENOMINATOR)
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _owner,
        uint256 _initialSupply,
        uint256 _bridgeFeeRate
    ) 
        ERC20(_name, _symbol)
        ERC20Permit(_name)
        OFTV2(_name, _symbol, 18, _lzEndpoint)
        Ownable(_owner)
    {
        require(_bridgeFeeRate <= BRIDGE_FEE_DENOMINATOR, "OmniGovernToken: Bridge fee too high");
        bridgeFeeRate = _bridgeFeeRate;
        
        // Mint initial supply to the owner
        _mint(_owner, _initialSupply);
    }
    
    /**
     * @dev Set the bridge fee rate
     * @param _newBridgeFeeRate New bridge fee rate (in parts per BRIDGE_FEE_DENOMINATOR)
     */
    function setBridgeFeeRate(uint256 _newBridgeFeeRate) external onlyOwner {
        require(_newBridgeFeeRate <= BRIDGE_FEE_DENOMINATOR, "OmniGovernToken: Bridge fee too high");
        bridgeFeeRate = _newBridgeFeeRate;
    }
    
    /**
     * @dev Get the current bridge fee percentage
     * @return Current bridge fee rate
     */
    function getBridgeFee() external view returns (uint256) {
        return bridgeFeeRate;
    }
    
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
    ) public payable virtual override {
        // Calculate bridge fee
        uint256 bridgeFee = (_amount * bridgeFeeRate) / BRIDGE_FEE_DENOMINATOR;
        
        // Check if enough native token is provided to cover bridge fee
        require(msg.value >= bridgeFee, "OmniGovernToken: Insufficient fee");
        
        // Transfer bridge fee to owner
        if (bridgeFee > 0) {
            (bool success, ) = owner().call{value: bridgeFee}("");
            require(success, "OmniGovernToken: Fee transfer failed");
        }
        
        // Call parent sendFrom with the remaining msg.value
        super.sendFrom{value: msg.value - bridgeFee}(
            _from,
            _dstChainId,
            _toAddress,
            _amount,
            _refundAddress,
            _zroPaymentAddress,
            _adapterParams
        );
    }
    
    // Override required functions to make ERC20Votes and OFTV2 compatible
    
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }
    
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
    
    // Required override for OFTV2 compatibility
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IOFTV2).interfaceId || interfaceId == type(IERC20).interfaceId;
    }
    
    // Implement circulatingSupply for OFTV2
    function circulatingSupply() public view virtual override returns (uint256) {
        return totalSupply();
    }
    
    function token() public view virtual override returns (address) {
        return address(this);
    }
}