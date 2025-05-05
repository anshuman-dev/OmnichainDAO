// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title SupplyConsistencyChecker
 * @dev Contract to verify token supply consistency across chains
 * in the OmniGovern ecosystem
 */
contract SupplyConsistencyChecker is Ownable {
    // The OmniGovernToken to check
    IOmniGovernToken public token;
    
    // Mapping of chain ID to expected token supply
    mapping(uint16 => uint256) public expectedSupplies;
    
    // Last verified supply timestamp per chain
    mapping(uint16 => uint256) public lastVerificationTime;
    
    // Verification threshold (in seconds)
    uint256 public verificationThreshold;
    
    // Maximum allowed supply deviation (in percentage, denominator: 10000)
    uint256 public maxDeviationRate;
    
    // Flag to enable automatic reconciliation
    bool public autoReconciliationEnabled;
    
    // Structure to track chain supply info
    struct ChainSupplyInfo {
        uint16 chainId;
        string chainName;
        uint256 reportedSupply;
        uint256 expectedSupply;
        bool verified;
        uint256 lastVerified;
    }
    
    /**
     * @dev Constructor
     * @param _token The token address to monitor
     * @param _owner The owner of the contract
     * @param _verificationThreshold Minimum time between verifications (in seconds)
     * @param _maxDeviationRate Maximum allowed supply deviation rate (denominator: 10000)
     */
    constructor(
        address _token,
        address _owner,
        uint256 _verificationThreshold,
        uint256 _maxDeviationRate
    ) Ownable(_owner) {
        require(_token != address(0), "SupplyConsistencyChecker: Token address cannot be zero");
        require(_maxDeviationRate <= 1000, "SupplyConsistencyChecker: Max deviation rate too high");
        
        token = IOmniGovernToken(_token);
        verificationThreshold = _verificationThreshold;
        maxDeviationRate = _maxDeviationRate;
        autoReconciliationEnabled = false;
    }
    
    /**
     * @dev Set expected supply for a chain
     * @param _chainId Chain ID
     * @param _expectedSupply Expected token supply on that chain
     */
    function setExpectedSupply(uint16 _chainId, uint256 _expectedSupply) external onlyOwner {
        expectedSupplies[_chainId] = _expectedSupply;
        emit ExpectedSupplySet(_chainId, _expectedSupply);
    }
    
    /**
     * @dev Set verification threshold
     * @param _newThreshold New threshold in seconds
     */
    function setVerificationThreshold(uint256 _newThreshold) external onlyOwner {
        verificationThreshold = _newThreshold;
        emit VerificationThresholdSet(_newThreshold);
    }
    
    /**
     * @dev Set maximum deviation rate
     * @param _newMaxDeviationRate New max deviation rate (denominator: 10000)
     */
    function setMaxDeviationRate(uint256 _newMaxDeviationRate) external onlyOwner {
        require(_newMaxDeviationRate <= 1000, "SupplyConsistencyChecker: Max deviation rate too high");
        maxDeviationRate = _newMaxDeviationRate;
        emit MaxDeviationRateSet(_newMaxDeviationRate);
    }
    
    /**
     * @dev Enable/disable automatic reconciliation
     * @param _enabled Whether auto reconciliation should be enabled
     */
    function setAutoReconciliation(bool _enabled) external onlyOwner {
        autoReconciliationEnabled = _enabled;
        emit AutoReconciliationSet(_enabled);
    }
    
    /**
     * @dev Verify token supply consistency
     * @param _chainId Chain ID to verify
     * @return verified Whether verification was successful
     * @return deviation The deviation amount (if any)
     */
    function verifySupply(uint16 _chainId) public returns (bool verified, int256 deviation) {
        // Ensure enough time has passed since last verification
        require(
            block.timestamp >= lastVerificationTime[_chainId] + verificationThreshold,
            "SupplyConsistencyChecker: Verification too frequent"
        );
        
        // Get actual token supply
        (uint256 actualSupply, uint256 totalMinted, uint256 totalBurned) = token.getSupplyConsistencyData();
        
        // Get expected supply
        uint256 expectedSupply = expectedSupplies[_chainId];
        
        // Calculate deviation
        if (actualSupply > expectedSupply) {
            deviation = int256(actualSupply - expectedSupply);
        } else {
            deviation = -int256(expectedSupply - actualSupply);
        }
        
        // Check if deviation is within acceptable range
        uint256 deviationPercentage;
        if (expectedSupply > 0) {
            deviationPercentage = (uint256(deviation < 0 ? -deviation : deviation) * 10000) / expectedSupply;
        } else {
            deviationPercentage = actualSupply > 0 ? 10000 : 0; // 100% deviation if expected is 0 but actual is not
        }
        
        verified = deviationPercentage <= maxDeviationRate;
        
        // Update last verification time
        lastVerificationTime[_chainId] = block.timestamp;
        
        // If auto reconciliation is enabled and verification failed, attempt to reconcile
        if (!verified && autoReconciliationEnabled) {
            reconcileSupply(_chainId);
        }
        
        emit SupplyVerified(_chainId, actualSupply, expectedSupply, verified, deviation);
        
        return (verified, deviation);
    }
    
    /**
     * @dev Reconcile token supply if verification fails
     * @param _chainId Chain ID to reconcile
     * @return success Whether reconciliation was successful
     */
    function reconcileSupply(uint16 _chainId) public returns (bool success) {
        // Get expected supply
        uint256 expectedSupply = expectedSupplies[_chainId];
        
        // Attempt to reconcile through the token contract
        success = token.reconcileSupply(expectedSupply);
        
        if (success) {
            emit SupplyReconciled(_chainId, expectedSupply);
        }
        
        return success;
    }
    
    /**
     * @dev Get all supply verification data
     * @param _chainIds Array of chain IDs to get data for
     * @return data Array of ChainSupplyInfo structs
     */
    function getSupplyVerificationData(uint16[] calldata _chainIds) external view returns (ChainSupplyInfo[] memory data) {
        data = new ChainSupplyInfo[](_chainIds.length);
        
        for (uint256 i = 0; i < _chainIds.length; i++) {
            uint16 chainId = _chainIds[i];
            string memory chainName = getChainName(chainId);
            uint256 expectedSupply = expectedSupplies[chainId];
            
            // For actual supply, we need to query the token contract
            // This won't be updated in real-time without an actual verification
            (uint256 actualSupply, , ) = token.getSupplyConsistencyData();
            
            uint256 lastVerified = lastVerificationTime[chainId];
            bool verified = lastVerified > 0 && 
                            (block.timestamp - lastVerified <= verificationThreshold * 2);
            
            data[i] = ChainSupplyInfo({
                chainId: chainId,
                chainName: chainName,
                reportedSupply: actualSupply,
                expectedSupply: expectedSupply,
                verified: verified,
                lastVerified: lastVerified
            });
        }
        
        return data;
    }
    
    /**
     * @dev Get chain name from chain ID
     * @param _chainId Chain ID
     * @return chainName The name of the chain
     */
    function getChainName(uint16 _chainId) internal pure returns (string memory chainName) {
        if (_chainId == 1) return "Ethereum";
        if (_chainId == 10) return "Optimism";
        if (_chainId == 56) return "BSC";
        if (_chainId == 137) return "Polygon";
        if (_chainId == 42161) return "Arbitrum";
        if (_chainId == 43114) return "Avalanche";
        return "Unknown";
    }
    
    // Events
    event ExpectedSupplySet(uint16 indexed chainId, uint256 expectedSupply);
    event VerificationThresholdSet(uint256 threshold);
    event MaxDeviationRateSet(uint256 rate);
    event AutoReconciliationSet(bool enabled);
    event SupplyVerified(uint16 indexed chainId, uint256 actualSupply, uint256 expectedSupply, bool verified, int256 deviation);
    event SupplyReconciled(uint16 indexed chainId, uint256 targetSupply);
}