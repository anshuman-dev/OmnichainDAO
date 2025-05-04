// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/lzApp/NonblockingLzApp.sol";
import "../interfaces/IOmniGovernor.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title OmniGovernor
 * @dev Implementation of OmniGovern DAO's governance contract with cross-chain voting capabilities
 * using LayerZero messaging
 */
contract OmniGovernor is 
    IOmniGovernor,
    Governor, 
    GovernorSettings, 
    GovernorCountingSimple, 
    GovernorVotes, 
    GovernorTimelockControl,
    NonblockingLzApp,
    Ownable
{
    // Mapping from proposalId to cross-chain vote information
    mapping(uint256 => mapping(uint16 => CrossChainProposal)) public crossChainProposals;
    
    // LayerZero message types
    uint16 public constant TYPE_CROSS_CHAIN_VOTE = 1;
    
    /**
     * @dev Constructor for OmniGovernor
     * @param _name Governance name
     * @param _token ERC20Votes token address
     * @param _timelock Timelock controller address
     * @param _lzEndpoint LayerZero endpoint address
     * @param _owner Owner of the contract
     * @param _initialVotingDelay Initial voting delay in blocks
     * @param _initialVotingPeriod Initial voting period in blocks
     * @param _initialProposalThreshold Initial proposal threshold in votes
     */
    constructor(
        string memory _name,
        IVotes _token,
        TimelockController _timelock,
        address _lzEndpoint,
        address _owner,
        uint48 _initialVotingDelay,
        uint32 _initialVotingPeriod,
        uint256 _initialProposalThreshold
    )
        Governor(_name)
        GovernorSettings(_initialVotingDelay, _initialVotingPeriod, _initialProposalThreshold)
        GovernorVotes(_token)
        GovernorTimelockControl(_timelock)
        NonblockingLzApp(_lzEndpoint)
        Ownable(_owner)
    {}
    
    /**
     * @dev Send a cross-chain vote to another chain
     * @param proposalId ID of the proposal
     * @param support Support value (0=against, 1=for, 2=abstain)
     * @param dstChainId Destination chain ID
     * @param votes Number of votes to cast
     */
    function sendCrossChainVote(
        uint256 proposalId,
        uint8 support,
        uint16 dstChainId,
        uint256 votes
    ) external payable {
        require(state(proposalId) == ProposalState.Active, "OmniGovernor: Proposal not active");
        require(support <= 2, "OmniGovernor: Invalid vote");
        require(votes > 0, "OmniGovernor: No votes");
        
        // Get the voting power of the sender
        address voter = _msgSender();
        uint256 weight = getVotes(voter, proposalId);
        require(weight >= votes, "OmniGovernor: Not enough votes");
        
        // Register vote locally
        _countVote(proposalId, voter, support, weight, bytes(""));
        
        // Prepare the payload
        bytes memory payload = abi.encode(
            TYPE_CROSS_CHAIN_VOTE,
            proposalId,
            support,
            votes,
            voter
        );
        
        // Estimate fee
        (uint256 fee, ) = lzEndpoint.estimateFees(
            dstChainId,
            address(this),
            payload,
            false,
            bytes("")
        );
        
        require(msg.value >= fee, "OmniGovernor: Insufficient fee");
        
        // Send message to the destination chain
        _lzSend(
            dstChainId,
            payload,
            payable(voter),
            address(0x0),
            bytes(""),
            msg.value
        );
    }
    
    /**
     * @dev Handle a received cross-chain message
     * @param _srcChainId Source chain ID
     * @param _srcAddress Source address (in bytes)
     * @param _nonce Nonce of the message
     * @param _payload Payload of the message
     */
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        // Decode the payload
        (uint16 messageType, uint256 proposalId, uint8 support, uint256 votes, address voter) = 
            abi.decode(_payload, (uint16, uint256, uint8, uint256, address));
        
        if (messageType == TYPE_CROSS_CHAIN_VOTE) {
            receiveCrossChainVote(_srcChainId, _srcAddress, proposalId, support, votes);
        } else {
            revert("OmniGovernor: Unknown message type");
        }
    }
    
    /**
     * @dev Receive a cross-chain vote
     * @param sourceChainId Source chain ID
     * @param sourceAddress Source address (in bytes)
     * @param proposalId ID of the proposal
     * @param support Support value (0=against, 1=for, 2=abstain)
     * @param votes Number of votes
     */
    function receiveCrossChainVote(
        uint16 sourceChainId,
        bytes memory sourceAddress,
        uint256 proposalId,
        uint8 support,
        uint256 votes
    ) public {
        require(_msgSender() == address(this), "OmniGovernor: Not authorized");
        require(proposalExists(proposalId), "OmniGovernor: Proposal doesn't exist");
        require(state(proposalId) == ProposalState.Active, "OmniGovernor: Proposal not active");
        
        // Get or create cross-chain proposal record
        CrossChainProposal storage crossChainProposal = crossChainProposals[proposalId][sourceChainId];
        
        // Update vote counts based on support value
        if (support == 0) {
            crossChainProposal.againstVotes += votes;
        } else if (support == 1) {
            crossChainProposal.forVotes += votes;
        } else if (support == 2) {
            crossChainProposal.abstainVotes += votes;
        }
        
        // Store the message hash to prevent duplicates
        bytes32 messageHash = keccak256(abi.encodePacked(sourceChainId, sourceAddress, proposalId, support, votes));
        crossChainProposal.messageHash = messageHash;
    }
    
    // Governor functions required overrides
    
    function votingDelay() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }
    
    function votingPeriod() public view override(IGovernor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }
    
    function quorum(uint256 blockNumber) public view override(IGovernor, Governor) returns (uint256) {
        return 4 * token.getPastTotalSupply(blockNumber) / 100; // 4% quorum
    }
    
    function proposalThreshold() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }
    
    function state(uint256 proposalId) public view override(IGovernor, Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }
    
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override(IGovernor, Governor) returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }
    
    function _execute(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._execute(proposalId, targets, values, calldatas, descriptionHash);
    }
    
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }
    
    /**
     * @dev Get proposal votes including cross-chain votes
     * @param proposalId ID of the proposal
     */
    function proposalVotes(uint256 proposalId)
        public view override
        returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)
    {
        (againstVotes, forVotes, abstainVotes) = _countVotes(proposalId, block.number - 1);
        
        // Add cross-chain votes from all chains
        for (uint16 chainId = 1; chainId <= 10000; chainId++) { // Assuming maximum 10,000 chains
            CrossChainProposal storage crossChainProposal = crossChainProposals[proposalId][chainId];
            
            // Skip if no votes from this chain
            if (crossChainProposal.messageHash == bytes32(0)) {
                continue;
            }
            
            againstVotes += crossChainProposal.againstVotes;
            forVotes += crossChainProposal.forVotes;
            abstainVotes += crossChainProposal.abstainVotes;
        }
    }
    
    /**
     * @dev Allow contract to receive Ether
     */
    receive() external payable {}
}