// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/lz-evm-sdk-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DVNConfigManager
 * @dev Handles configuration of Data Validation Networks (DVNs) for LayerZero security
 */
contract DVNConfigManager is Ownable {
    // LayerZero endpoint
    ILayerZeroEndpointV2 public endpoint;
    
    // Registered DVNs
    struct DVN {
        address dvnAddress;
        string name;
        uint8 requiredSignatures;
        bool enabled;
    }
    
    // Security configuration for a chain
    struct SecurityConfig {
        uint8 minRequiredDVNs;
        bool trustedEndpointMode;
        bool multiSignatureVerification;
        uint32[] enabledDVNs; // Indexes into the dvns array
    }
    
    // Map of DVN index to DVN details
    mapping(uint32 => DVN) public dvns;
    
    // Total number of registered DVNs
    uint32 public dvnCount;
    
    // Security configuration for each chain
    mapping(uint32 => SecurityConfig) public chainSecurityConfigs;
    
    // Events
    event DVNAdded(uint32 dvnId, address dvnAddress, string name);
    event DVNEnabled(uint32 dvnId, bool enabled);
    event DVNSignaturesUpdated(uint32 dvnId, uint8 requiredSignatures);
    event SecurityConfigUpdated(uint32 chainId, uint8 minRequiredDVNs);
    event TrustedEndpointModeUpdated(uint32 chainId, bool enabled);
    event MultiSignatureVerificationUpdated(uint32 chainId, bool enabled);
    
    /**
     * @dev Constructor
     * @param _endpoint The LayerZero endpoint
     * @param _owner The owner of the contract
     */
    constructor(address _endpoint, address _owner) Ownable() {
        endpoint = ILayerZeroEndpointV2(_endpoint);
        _transferOwnership(_owner);
    }
    
    /**
     * @dev Add a new DVN to the registry
     * @param _dvnAddress The DVN contract address
     * @param _name The DVN name
     * @param _requiredSignatures The number of required signatures
     */
    function addDVN(
        address _dvnAddress,
        string memory _name,
        uint8 _requiredSignatures
    ) external onlyOwner returns (uint32) {
        require(_dvnAddress != address(0), "DVN address cannot be zero");
        require(_requiredSignatures > 0, "Required signatures must be > 0");
        
        uint32 dvnId = dvnCount++;
        
        dvns[dvnId] = DVN({
            dvnAddress: _dvnAddress,
            name: _name,
            requiredSignatures: _requiredSignatures,
            enabled: true
        });
        
        emit DVNAdded(dvnId, _dvnAddress, _name);
        
        return dvnId;
    }
    
    /**
     * @dev Toggle DVN enabled status
     * @param _dvnId The DVN ID
     * @param _enabled Whether the DVN should be enabled
     */
    function setDVNEnabled(uint32 _dvnId, bool _enabled) external onlyOwner {
        require(_dvnId < dvnCount, "Invalid DVN ID");
        
        dvns[_dvnId].enabled = _enabled;
        
        emit DVNEnabled(_dvnId, _enabled);
    }
    
    /**
     * @dev Update DVN required signatures
     * @param _dvnId The DVN ID
     * @param _requiredSignatures The new number of required signatures
     */
    function updateDVNSignatures(uint32 _dvnId, uint8 _requiredSignatures) external onlyOwner {
        require(_dvnId < dvnCount, "Invalid DVN ID");
        require(_requiredSignatures > 0, "Required signatures must be > 0");
        
        dvns[_dvnId].requiredSignatures = _requiredSignatures;
        
        emit DVNSignaturesUpdated(_dvnId, _requiredSignatures);
    }
    
    /**
     * @dev Configure security settings for a chain
     * @param _chainId The chain ID
     * @param _minRequiredDVNs The minimum number of DVNs required
     * @param _trustedEndpointMode Whether to enable trusted endpoint mode
     * @param _multiSignatureVerification Whether to enable multi-signature verification
     * @param _enabledDVNs The array of enabled DVN IDs
     */
    function configureChainSecurity(
        uint32 _chainId,
        uint8 _minRequiredDVNs,
        bool _trustedEndpointMode,
        bool _multiSignatureVerification,
        uint32[] memory _enabledDVNs
    ) external onlyOwner {
        require(_minRequiredDVNs > 0, "Min required DVNs must be > 0");
        require(_enabledDVNs.length >= _minRequiredDVNs, "Not enough DVNs enabled");
        
        // Validate all DVN IDs
        for (uint256 i = 0; i < _enabledDVNs.length; i++) {
            require(_enabledDVNs[i] < dvnCount, "Invalid DVN ID");
            require(dvns[_enabledDVNs[i]].enabled, "DVN is not enabled");
        }
        
        // Update configuration
        chainSecurityConfigs[_chainId] = SecurityConfig({
            minRequiredDVNs: _minRequiredDVNs,
            trustedEndpointMode: _trustedEndpointMode,
            multiSignatureVerification: _multiSignatureVerification,
            enabledDVNs: _enabledDVNs
        });
        
        // Apply configuration to endpoint
        _applyDVNConfiguration(_chainId);
        
        emit SecurityConfigUpdated(_chainId, _minRequiredDVNs);
        emit TrustedEndpointModeUpdated(_chainId, _trustedEndpointMode);
        emit MultiSignatureVerificationUpdated(_chainId, _multiSignatureVerification);
    }
    
    /**
     * @dev Set trusted endpoint mode for a chain
     * @param _chainId The chain ID
     * @param _enabled Whether to enable trusted endpoint mode
     */
    function setTrustedEndpointMode(uint32 _chainId, bool _enabled) external onlyOwner {
        SecurityConfig storage config = chainSecurityConfigs[_chainId];
        config.trustedEndpointMode = _enabled;
        
        _applyDVNConfiguration(_chainId);
        
        emit TrustedEndpointModeUpdated(_chainId, _enabled);
    }
    
    /**
     * @dev Set multi-signature verification for a chain
     * @param _chainId The chain ID
     * @param _enabled Whether to enable multi-signature verification
     */
    function setMultiSignatureVerification(uint32 _chainId, bool _enabled) external onlyOwner {
        SecurityConfig storage config = chainSecurityConfigs[_chainId];
        config.multiSignatureVerification = _enabled;
        
        _applyDVNConfiguration(_chainId);
        
        emit MultiSignatureVerificationUpdated(_chainId, _enabled);
    }
    
    /**
     * @dev Calculate the estimated message fee based on the security configuration
     * @param _chainId The destination chain ID
     * @param _baseGas The base gas amount
     * @return The estimated message fee
     */
    function estimateMessageFee(uint32 _chainId, uint256 _baseGas) external view returns (uint256) {
        SecurityConfig storage config = chainSecurityConfigs[_chainId];
        
        // Start with base gas
        uint256 totalGas = _baseGas;
        
        // Add gas for each DVN (simplified calculation)
        for (uint256 i = 0; i < config.enabledDVNs.length; i++) {
            uint32 dvnId = config.enabledDVNs[i];
            DVN storage dvn = dvns[dvnId];
            
            // Each signature verification costs more gas
            uint256 dvnGas = 50000 * dvn.requiredSignatures;
            totalGas += dvnGas;
        }
        
        // Add more gas for advanced features
        if (config.trustedEndpointMode) {
            totalGas += 30000;
        }
        
        if (config.multiSignatureVerification) {
            totalGas += 100000;
        }
        
        // Convert gas to estimated fee (this is a simplified calculation)
        uint256 gasPrice = 100 gwei; // An example gas price
        return totalGas * gasPrice;
    }
    
    /**
     * @dev Apply DVN configuration to the LayerZero endpoint
     * @param _chainId The chain ID to configure
     */
    function _applyDVNConfiguration(uint32 _chainId) internal {
        SecurityConfig storage config = chainSecurityConfigs[_chainId];
        
        // Get addresses and signature requirements
        address[] memory dvnAddresses = new address[](config.enabledDVNs.length);
        uint8[] memory sigRequirements = new uint8[](config.enabledDVNs.length);
        
        for (uint256 i = 0; i < config.enabledDVNs.length; i++) {
            uint32 dvnId = config.enabledDVNs[i];
            DVN storage dvn = dvns[dvnId];
            
            dvnAddresses[i] = dvn.dvnAddress;
            sigRequirements[i] = dvn.requiredSignatures;
        }
        
        // Set DVN configuration on the endpoint
        // This is a simplified version - in a real implementation, you'd use the actual
        // endpoint configuration methods (varies by LayerZero version and implementation)
        
        // Example (this would need to be adapted to the actual LayerZero interface):
        // endpoint.setDVNConfig(_chainId, dvnAddresses, sigRequirements, config.minRequiredDVNs);
        // endpoint.setTrustedEndpointMode(_chainId, config.trustedEndpointMode);
        // endpoint.setMultiSignatureVerification(_chainId, config.multiSignatureVerification);
    }
    
    /**
     * @dev Get the security score for a chain's configuration
     * @param _chainId The chain ID
     * @return score The security score (0-100)
     */
    function getSecurityScore(uint32 _chainId) external view returns (uint8) {
        SecurityConfig storage config = chainSecurityConfigs[_chainId];
        
        if (config.enabledDVNs.length == 0) {
            return 0; // No DVNs configured
        }
        
        // Base score based on number of DVNs
        uint8 score = uint8(config.enabledDVNs.length * 10);
        
        // Additional points for each signature required
        uint8 sigScore = 0;
        for (uint256 i = 0; i < config.enabledDVNs.length; i++) {
            uint32 dvnId = config.enabledDVNs[i];
            DVN storage dvn = dvns[dvnId];
            sigScore += dvn.requiredSignatures * 5;
        }
        
        // Cap signature score at 30
        sigScore = sigScore > 30 ? 30 : sigScore;
        score += sigScore;
        
        // Additional points for security features
        if (config.trustedEndpointMode) {
            score += 15;
        }
        
        if (config.multiSignatureVerification) {
            score += 25;
        }
        
        // Ensure score doesn't exceed 100
        return score > 100 ? 100 : score;
    }
}