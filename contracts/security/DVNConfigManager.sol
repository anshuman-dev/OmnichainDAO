// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DVNConfigManager
 * @dev Manages DVN (Data Validation Network) configurations for LayerZero messaging
 * This contract allows configuration of DVNs for enhanced security of cross-chain messages
 */
contract DVNConfigManager is Ownable {
    // Data structures
    struct DVNInfo {
        address dvnAddress;
        string name;
        string description;
        bool enabled;
        uint8 requiredSignatures;
    }
    
    // Storage
    mapping(string => DVNInfo) private dvns;
    string[] private dvnIds;
    uint8 private minRequiredDVNs;
    
    // Events
    event DVNAdded(string indexed dvnId, address dvnAddress);
    event DVNUpdated(string indexed dvnId, bool enabled, uint8 requiredSignatures);
    event MinRequiredDVNsUpdated(uint8 previous, uint8 current);
    event DVNConfigApplied(address indexed executor, uint32 dstChainId);
    
    /**
     * @dev Constructor initializes the DVN configuration manager
     * @param _owner The owner of the contract
     */
    constructor(address _owner) {
        transferOwnership(_owner);
        minRequiredDVNs = 1; // Default to requiring at least 1 DVN
    }
    
    /**
     * @dev Add a new DVN to the configuration
     * @param _dvnId Unique identifier for the DVN
     * @param _dvnAddress The address of the DVN
     * @param _name Human-readable name for the DVN
     * @param _description Description of the DVN
     * @param _enabled Whether the DVN is initially enabled
     * @param _requiredSignatures Number of signatures required from this DVN
     */
    function addDVN(
        string memory _dvnId,
        address _dvnAddress,
        string memory _name,
        string memory _description,
        bool _enabled,
        uint8 _requiredSignatures
    ) external onlyOwner {
        require(bytes(_dvnId).length > 0, "DVN: ID cannot be empty");
        require(_dvnAddress != address(0), "DVN: Address cannot be zero");
        require(_requiredSignatures > 0, "DVN: Required signatures must be > 0");
        require(dvns[_dvnId].dvnAddress == address(0), "DVN: ID already exists");
        
        dvns[_dvnId] = DVNInfo({
            dvnAddress: _dvnAddress,
            name: _name,
            description: _description,
            enabled: _enabled,
            requiredSignatures: _requiredSignatures
        });
        
        dvnIds.push(_dvnId);
        
        emit DVNAdded(_dvnId, _dvnAddress);
    }
    
    /**
     * @dev Update an existing DVN's configuration
     * @param _dvnId Unique identifier for the DVN
     * @param _enabled Whether the DVN should be enabled
     * @param _requiredSignatures Number of signatures required from this DVN
     */
    function updateDVN(
        string memory _dvnId,
        bool _enabled,
        uint8 _requiredSignatures
    ) external onlyOwner {
        require(bytes(_dvnId).length > 0, "DVN: ID cannot be empty");
        require(dvns[_dvnId].dvnAddress != address(0), "DVN: DVN not found");
        require(_requiredSignatures > 0, "DVN: Required signatures must be > 0");
        
        DVNInfo storage dvn = dvns[_dvnId];
        dvn.enabled = _enabled;
        dvn.requiredSignatures = _requiredSignatures;
        
        emit DVNUpdated(_dvnId, _enabled, _requiredSignatures);
    }
    
    /**
     * @dev Set the minimum number of required DVNs
     * @param _minRequired Minimum number of DVNs that must verify messages
     */
    function setMinRequiredDVNs(uint8 _minRequired) external onlyOwner {
        require(_minRequired > 0, "DVN: Min required must be > 0");
        require(_minRequired <= dvnIds.length, "DVN: Min required exceeds available DVNs");
        
        uint8 previous = minRequiredDVNs;
        minRequiredDVNs = _minRequired;
        
        emit MinRequiredDVNsUpdated(previous, _minRequired);
    }
    
    /**
     * @dev Check if current DVN configuration is valid
     * @return isValid Whether the configuration is valid
     */
    function isValidConfig() public view returns (bool) {
        uint8 enabledCount = 0;
        
        for (uint i = 0; i < dvnIds.length; i++) {
            if (dvns[dvnIds[i]].enabled) {
                enabledCount++;
            }
        }
        
        return enabledCount >= minRequiredDVNs;
    }
    
    /**
     * @dev Get all DVN IDs
     * @return ids Array of DVN IDs
     */
    function getAllDVNIds() external view returns (string[] memory) {
        return dvnIds;
    }
    
    /**
     * @dev Get information about a specific DVN
     * @param _dvnId Unique identifier for the DVN
     * @return dvnInfo The DVN information
     */
    function getDVNInfo(string memory _dvnId) external view returns (DVNInfo memory) {
        return dvns[_dvnId];
    }
    
    /**
     * @dev Get the minimum required DVNs
     * @return minRequired Minimum number of DVNs required
     */
    function getMinRequiredDVNs() external view returns (uint8) {
        return minRequiredDVNs;
    }
    
    /**
     * @dev Build the DVN configuration for LayerZero
     * @return dvnAddresses Array of DVN addresses
     * @return requiredSignatures Array of required signatures for each DVN
     */
    function buildDVNConfig() 
        public 
        view 
        returns (address[] memory dvnAddresses, uint8[] memory requiredSignatures) 
    {
        uint enabledCount = 0;
        
        // Count enabled DVNs
        for (uint i = 0; i < dvnIds.length; i++) {
            if (dvns[dvnIds[i]].enabled) {
                enabledCount++;
            }
        }
        
        // Initialize arrays with the correct size
        dvnAddresses = new address[](enabledCount);
        requiredSignatures = new uint8[](enabledCount);
        
        // Fill arrays with enabled DVN data
        uint index = 0;
        for (uint i = 0; i < dvnIds.length; i++) {
            DVNInfo memory dvn = dvns[dvnIds[i]];
            if (dvn.enabled) {
                dvnAddresses[index] = dvn.dvnAddress;
                requiredSignatures[index] = dvn.requiredSignatures;
                index++;
            }
        }
        
        return (dvnAddresses, requiredSignatures);
    }
    
    /**
     * @dev Apply DVN configuration to a LayerZero endpoint
     * This is a mock function since actual implementation would depend on the specific
     * LayerZero endpoint implementation being used
     * @param _endpoint The LayerZero endpoint address
     * @param _dstChainId The destination chain ID to configure
     */
    function applyDVNConfigToEndpoint(address _endpoint, uint32 _dstChainId) external onlyOwner {
        require(_endpoint != address(0), "DVN: Endpoint cannot be zero");
        require(isValidConfig(), "DVN: Invalid configuration");
        
        // In a real implementation, this would call the LayerZero endpoint to set the DVN configuration
        // Example: ILayerZeroEndpoint(_endpoint).setDVNConfig(_dstChainId, dvnAddresses, requiredSignatures);
        
        // For this simplified implementation, we just emit an event
        emit DVNConfigApplied(msg.sender, _dstChainId);
    }
}