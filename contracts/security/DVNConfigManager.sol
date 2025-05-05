// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/interfaces/ILayerZeroEndpoint.sol";

/**
 * @title DVNConfigManager
 * @dev Manages DVN (Data Validation Network) configurations for enhanced
 * security with LayerZero. DVNs provide additional validation of cross-chain messages.
 */
contract DVNConfigManager is Ownable {
    // LayerZero endpoint
    ILayerZeroEndpoint public lzEndpoint;
    
    // DVN structure
    struct DVNConfig {
        address dvnAddress;
        uint8 requiredSignatures;
        bool enabled;
    }
    
    // Chain configuration
    struct ChainConfig {
        uint16 chainId;
        string chainName;
        DVNConfig[] dvns;
        uint8 minRequiredDVNs;
    }
    
    // Chain configurations
    mapping(uint16 => ChainConfig) public chainConfigs;
    
    // List of supported chain IDs
    uint16[] public supportedChainIds;
    
    // Events
    event DVNAdded(uint16 indexed chainId, address indexed dvnAddress, uint8 requiredSignatures);
    event DVNRemoved(uint16 indexed chainId, address indexed dvnAddress);
    event DVNUpdated(uint16 indexed chainId, address indexed dvnAddress, uint8 requiredSignatures, bool enabled);
    event MinRequiredDVNsSet(uint16 indexed chainId, uint8 minRequired);
    
    /**
     * @dev Constructor
     * @param _lzEndpoint The LayerZero endpoint address
     * @param _owner The contract owner
     */
    constructor(address _lzEndpoint, address _owner) Ownable(_owner) {
        require(_lzEndpoint != address(0), "DVNConfigManager: LZ endpoint cannot be zero");
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
    }
    
    /**
     * @dev Add a new chain configuration
     * @param chainId Chain ID
     * @param chainName Chain name
     * @param minRequiredDVNs Minimum required DVNs for the chain
     */
    function addChainConfig(uint16 chainId, string calldata chainName, uint8 minRequiredDVNs) external onlyOwner {
        require(minRequiredDVNs > 0, "DVNConfigManager: Min required DVNs must be > 0");
        require(bytes(chainConfigs[chainId].chainName).length == 0, "DVNConfigManager: Chain already exists");
        
        chainConfigs[chainId] = ChainConfig({
            chainId: chainId,
            chainName: chainName,
            dvns: new DVNConfig[](0),
            minRequiredDVNs: minRequiredDVNs
        });
        
        supportedChainIds.push(chainId);
    }
    
    /**
     * @dev Add a DVN to a chain configuration
     * @param chainId Chain ID
     * @param dvnAddress DVN address
     * @param requiredSignatures Required signatures for the DVN
     */
    function addDVN(uint16 chainId, address dvnAddress, uint8 requiredSignatures) external onlyOwner {
        require(bytes(chainConfigs[chainId].chainName).length > 0, "DVNConfigManager: Chain not configured");
        require(dvnAddress != address(0), "DVNConfigManager: DVN address cannot be zero");
        require(requiredSignatures > 0, "DVNConfigManager: Required signatures must be > 0");
        
        // Check if DVN already exists
        for (uint256 i = 0; i < chainConfigs[chainId].dvns.length; i++) {
            require(chainConfigs[chainId].dvns[i].dvnAddress != dvnAddress, "DVNConfigManager: DVN already exists");
        }
        
        DVNConfig memory dvnConfig = DVNConfig({
            dvnAddress: dvnAddress,
            requiredSignatures: requiredSignatures,
            enabled: true
        });
        
        chainConfigs[chainId].dvns.push(dvnConfig);
        
        _updateDVNConfigOnEndpoint(chainId);
        
        emit DVNAdded(chainId, dvnAddress, requiredSignatures);
    }
    
    /**
     * @dev Remove a DVN from a chain configuration
     * @param chainId Chain ID
     * @param dvnAddress DVN address
     */
    function removeDVN(uint16 chainId, address dvnAddress) external onlyOwner {
        require(bytes(chainConfigs[chainId].chainName).length > 0, "DVNConfigManager: Chain not configured");
        
        bool found = false;
        uint256 index;
        
        for (uint256 i = 0; i < chainConfigs[chainId].dvns.length; i++) {
            if (chainConfigs[chainId].dvns[i].dvnAddress == dvnAddress) {
                found = true;
                index = i;
                break;
            }
        }
        
        require(found, "DVNConfigManager: DVN not found");
        
        // Remove the DVN by swapping with the last element and popping
        if (index != chainConfigs[chainId].dvns.length - 1) {
            chainConfigs[chainId].dvns[index] = chainConfigs[chainId].dvns[chainConfigs[chainId].dvns.length - 1];
        }
        chainConfigs[chainId].dvns.pop();
        
        _updateDVNConfigOnEndpoint(chainId);
        
        emit DVNRemoved(chainId, dvnAddress);
    }
    
    /**
     * @dev Update a DVN configuration
     * @param chainId Chain ID
     * @param dvnAddress DVN address
     * @param requiredSignatures Required signatures for the DVN
     * @param enabled Whether the DVN is enabled
     */
    function updateDVN(uint16 chainId, address dvnAddress, uint8 requiredSignatures, bool enabled) external onlyOwner {
        require(bytes(chainConfigs[chainId].chainName).length > 0, "DVNConfigManager: Chain not configured");
        require(requiredSignatures > 0, "DVNConfigManager: Required signatures must be > 0");
        
        bool found = false;
        
        for (uint256 i = 0; i < chainConfigs[chainId].dvns.length; i++) {
            if (chainConfigs[chainId].dvns[i].dvnAddress == dvnAddress) {
                chainConfigs[chainId].dvns[i].requiredSignatures = requiredSignatures;
                chainConfigs[chainId].dvns[i].enabled = enabled;
                found = true;
                break;
            }
        }
        
        require(found, "DVNConfigManager: DVN not found");
        
        _updateDVNConfigOnEndpoint(chainId);
        
        emit DVNUpdated(chainId, dvnAddress, requiredSignatures, enabled);
    }
    
    /**
     * @dev Set minimum required DVNs for a chain
     * @param chainId Chain ID
     * @param minRequired Minimum required DVNs
     */
    function setMinRequiredDVNs(uint16 chainId, uint8 minRequired) external onlyOwner {
        require(bytes(chainConfigs[chainId].chainName).length > 0, "DVNConfigManager: Chain not configured");
        require(minRequired > 0, "DVNConfigManager: Min required DVNs must be > 0");
        
        chainConfigs[chainId].minRequiredDVNs = minRequired;
        
        _updateDVNConfigOnEndpoint(chainId);
        
        emit MinRequiredDVNsSet(chainId, minRequired);
    }
    
    /**
     * @dev Update DVN configuration on the LayerZero endpoint
     */
    function _updateDVNConfigOnEndpoint(uint16 chainId) internal {
        // In a real-world implementation, we would call the appropriate
        // functions on the LayerZero endpoint to update the DVN configuration.
        // This is a simplified version that would need to be adapted to the
        // specific LayerZero endpoint implementation.
        
        // Example (pseudocode):
        // bytes memory dvnConfig = _encodeDVNConfig(chainId);
        // lzEndpoint.setConfig(chainId, CONFIG_TYPE_DVN, dvnConfig);
    }
    
    /**
     * @dev Get DVN configuration for a chain
     * @param chainId Chain ID
     * @return The chain configuration
     */
    function getChainConfig(uint16 chainId) external view returns (
        string memory chainName,
        DVNConfig[] memory dvns,
        uint8 minRequiredDVNs
    ) {
        require(bytes(chainConfigs[chainId].chainName).length > 0, "DVNConfigManager: Chain not configured");
        
        return (
            chainConfigs[chainId].chainName,
            chainConfigs[chainId].dvns,
            chainConfigs[chainId].minRequiredDVNs
        );
    }
    
    /**
     * @dev Get all supported chain IDs
     * @return Array of supported chain IDs
     */
    function getSupportedChainIds() external view returns (uint16[] memory) {
        return supportedChainIds;
    }
    
    /**
     * @dev Get the number of DVNs for a chain
     * @param chainId Chain ID
     * @return The number of DVNs
     */
    function getDVNCount(uint16 chainId) external view returns (uint256) {
        return chainConfigs[chainId].dvns.length;
    }
}