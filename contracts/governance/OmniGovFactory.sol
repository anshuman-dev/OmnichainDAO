// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/OmniGovernToken.sol";
import "./OmniGovernor.sol";

/**
 * @title OmniGovFactory
 * @dev Factory contract to deploy the full OmniGovern DAO suite (token, timelock, and governor)
 */
contract OmniGovFactory is Ownable {
    // Events for tracking deployments
    event TokenDeployed(address indexed tokenAddress, string name, string symbol);
    event TimelockDeployed(address indexed timelockAddress, uint256 minDelay);
    event GovernorDeployed(address indexed governorAddress, string name);
    event FullDAODeployed(
        address indexed tokenAddress,
        address indexed timelockAddress,
        address indexed governorAddress,
        address owner
    );
    
    /**
     * @dev Constructor
     * @param _owner Owner of the factory contract
     */
    constructor(address _owner) Ownable(_owner) {}
    
    /**
     * @dev Deploy the OmniGovernToken contract
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _lzEndpoint LayerZero endpoint address
     * @param _initialSupply Initial token supply
     * @param _bridgeFeeRate Bridge fee rate
     * @return Token address
     */
    function deployToken(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        uint256 _initialSupply,
        uint256 _bridgeFeeRate
    ) public returns (address) {
        OmniGovernToken token = new OmniGovernToken(
            _name,
            _symbol,
            _lzEndpoint,
            owner(),
            _initialSupply,
            _bridgeFeeRate
        );
        
        emit TokenDeployed(address(token), _name, _symbol);
        return address(token);
    }
    
    /**
     * @dev Deploy the TimelockController contract
     * @param _minDelay Minimum delay before execution
     * @param _proposers List of addresses that can propose
     * @param _executors List of addresses that can execute
     * @return Timelock address
     */
    function deployTimelock(
        uint256 _minDelay,
        address[] memory _proposers,
        address[] memory _executors
    ) public returns (address) {
        TimelockController timelock = new TimelockController(
            _minDelay,
            _proposers,
            _executors,
            owner()
        );
        
        emit TimelockDeployed(address(timelock), _minDelay);
        return address(timelock);
    }
    
    /**
     * @dev Deploy the OmniGovernor contract
     * @param _name Governor name
     * @param _tokenAddress Token (ERC20Votes) address
     * @param _timelockAddress Timelock controller address
     * @param _lzEndpoint LayerZero endpoint address
     * @param _votingDelay Voting delay in blocks
     * @param _votingPeriod Voting period in blocks
     * @param _proposalThreshold Proposal threshold in votes
     * @return Governor address
     */
    function deployGovernor(
        string memory _name,
        address _tokenAddress,
        address _timelockAddress,
        address _lzEndpoint,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold
    ) public returns (address) {
        OmniGovernor governor = new OmniGovernor(
            _name,
            IVotes(_tokenAddress),
            TimelockController(payable(_timelockAddress)),
            _lzEndpoint,
            owner(),
            _votingDelay,
            _votingPeriod,
            _proposalThreshold
        );
        
        emit GovernorDeployed(address(governor), _name);
        return address(governor);
    }
    
    /**
     * @dev Deploy the full OmniGovern DAO suite (token, timelock, governor)
     * @param _tokenName Token name
     * @param _tokenSymbol Token symbol
     * @param _governorName Governor name
     * @param _lzEndpoint LayerZero endpoint address
     * @param _initialSupply Initial token supply
     * @param _bridgeFeeRate Bridge fee rate
     * @param _minDelay Minimum timelock delay
     * @param _votingDelay Voting delay in blocks
     * @param _votingPeriod Voting period in blocks
     * @param _proposalThreshold Proposal threshold in votes
     * @return tokenAddress Token address
     * @return timelockAddress Timelock address
     * @return governorAddress Governor address
     */
    function deployFullDAO(
        string memory _tokenName,
        string memory _tokenSymbol,
        string memory _governorName,
        address _lzEndpoint,
        uint256 _initialSupply,
        uint256 _bridgeFeeRate,
        uint256 _minDelay,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _proposalThreshold
    ) external returns (
        address tokenAddress,
        address timelockAddress,
        address governorAddress
    ) {
        // Deploy token
        tokenAddress = deployToken(
            _tokenName,
            _tokenSymbol,
            _lzEndpoint,
            _initialSupply,
            _bridgeFeeRate
        );
        
        // Prepare proposers and executors for timelock
        address[] memory proposers = new address[](1);
        proposers[0] = address(0); // Will be replaced with governor
        
        address[] memory executors = new address[](1);
        executors[0] = address(0); // Will be replaced with governor
        
        // Deploy timelock
        timelockAddress = deployTimelock(_minDelay, proposers, executors);
        
        // Deploy governor
        governorAddress = deployGovernor(
            _governorName,
            tokenAddress,
            timelockAddress,
            _lzEndpoint,
            _votingDelay,
            _votingPeriod,
            _proposalThreshold
        );
        
        // Update timelock roles
        TimelockController timelock = TimelockController(payable(timelockAddress));
        
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = timelock.TIMELOCK_ADMIN_ROLE();
        
        timelock.revokeRole(proposerRole, address(0));
        timelock.revokeRole(executorRole, address(0));
        
        timelock.grantRole(proposerRole, governorAddress);
        timelock.grantRole(executorRole, governorAddress);
        
        // Revoke timelock admin role from factory
        timelock.revokeRole(adminRole, address(this));
        
        emit FullDAODeployed(tokenAddress, timelockAddress, governorAddress, owner());
        
        return (tokenAddress, timelockAddress, governorAddress);
    }
}