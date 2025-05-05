// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/lz-evm-sdk-v2/contracts/oft/OFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title OmniGovernToken
 * @dev Implementation of the governance token that uses LayerZero OFT V2 for cross-chain functionality
 * This allows for a unified token across multiple chains with consistent cross-chain state
 */
contract OmniGovernToken is OFT, Ownable, IOmniGovernToken {
    using SafeMath for uint256;
    
    // Governance related storage
    mapping(uint32 => uint256) private _chainVotingPower;
    mapping(bytes32 => Proposal) private _proposals;
    mapping(bytes32 => mapping(address => Vote)) private _votes;
    
    // Events
    event ProposalCreated(
        bytes32 indexed proposalId,
        address proposer,
        string title,
        string description,
        uint256 startTime,
        uint256 endTime
    );
    
    event VoteCast(
        bytes32 indexed proposalId,
        address indexed voter,
        uint8 support,
        uint256 weight
    );
    
    event CrossChainVoteCast(
        bytes32 indexed proposalId,
        uint32 srcChainId,
        uint256 totalWeight,
        uint8 support
    );
    
    /**
     * @dev Constructor initializes the token with name, symbol, and decimals
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _endpoint LayerZero V2 endpoint address
     * @param _owner Owner of the token contract
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _endpoint,
        address _owner
    ) OFT(_name, _symbol, 18, _endpoint) {
        transferOwnership(_owner);
    }
    
    /**
     * @dev Creates a new proposal for cross-chain governance
     * @param _title Title of the proposal
     * @param _description Detailed description of the proposal
     * @param _startTime When voting begins
     * @param _endTime When voting ends
     * @return proposalId The unique identifier for the proposal
     */
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external override returns (bytes32) {
        require(balanceOf(msg.sender) > 0, "OGT: Must hold tokens to create proposals");
        require(_startTime >= block.timestamp, "OGT: Start time must be in the future");
        require(_endTime > _startTime, "OGT: End time must be after start time");
        
        bytes32 proposalId = keccak256(abi.encodePacked(
            msg.sender,
            _title,
            block.timestamp
        ));
        
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.startTime == 0, "OGT: Proposal already exists");
        
        proposal.proposer = msg.sender;
        proposal.title = _title;
        proposal.description = _description;
        proposal.startTime = _startTime;
        proposal.endTime = _endTime;
        proposal.status = ProposalStatus.Active;
        
        emit ProposalCreated(
            proposalId,
            msg.sender,
            _title,
            _description,
            _startTime,
            _endTime
        );
        
        return proposalId;
    }
    
    /**
     * @dev Casts a vote on a proposal
     * @param _proposalId The unique identifier of the proposal
     * @param _support 0=against, 1=for, 2=abstain
     */
    function castVote(bytes32 _proposalId, uint8 _support) external override {
        address voter = msg.sender;
        uint256 votingPower = balanceOf(voter);
        
        require(votingPower > 0, "OGT: Must have voting power to vote");
        _castVote(_proposalId, voter, votingPower, _support);
    }
    
    /**
     * @dev Internal function to cast a vote
     * @param _proposalId The unique identifier of the proposal
     * @param _voter The address casting the vote
     * @param _weight The voting weight
     * @param _support 0=against, 1=for, 2=abstain
     */
    function _castVote(
        bytes32 _proposalId,
        address _voter,
        uint256 _weight,
        uint8 _support
    ) internal {
        Proposal storage proposal = _proposals[_proposalId];
        require(proposal.startTime > 0, "OGT: Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "OGT: Voting not started");
        require(block.timestamp <= proposal.endTime, "OGT: Voting ended");
        require(_support <= 2, "OGT: Invalid vote type");
        
        Vote storage vote = _votes[_proposalId][_voter];
        require(vote.hasVoted == false, "OGT: Already voted");
        
        vote.hasVoted = true;
        vote.support = _support;
        vote.weight = _weight;
        
        if (_support == 0) {
            proposal.againstVotes = proposal.againstVotes.add(_weight);
        } else if (_support == 1) {
            proposal.forVotes = proposal.forVotes.add(_weight);
        } else {
            proposal.abstainVotes = proposal.abstainVotes.add(_weight);
        }
        
        emit VoteCast(_proposalId, _voter, _support, _weight);
    }
    
    /**
     * @dev Sends a cross-chain vote via LayerZero
     * @param _proposalId The unique identifier of the proposal
     * @param _support 0=against, 1=for, 2=abstain
     * @param _dstChainId The destination chain ID (LayerZero chain ID)
     * @param _options Additional options for LayerZero
     */
    function castCrossChainVote(
        bytes32 _proposalId,
        uint8 _support,
        uint32 _dstChainId,
        MessagingFee memory _msgFee,
        bytes memory _options
    ) external payable override {
        address voter = msg.sender;
        uint256 votingPower = balanceOf(voter);
        
        require(votingPower > 0, "OGT: Must have voting power to vote");
        
        // Store the vote locally first
        _castVote(_proposalId, voter, votingPower, _support);
        
        // Prepare the message to send
        bytes memory payload = abi.encode(
            _proposalId,
            lzChainId,  // LZ V2 uses local chain ID
            votingPower,
            _support
        );
        
        // Send the cross-chain message
        _lzSend(
            _dstChainId,
            payload,
            _msgFee,
            _options,
            msg.value
        );
    }
    
    /**
     * @dev Receives cross-chain votes and aggregates them
     * This function is called by LayerZero when a message arrives from another chain
     */
    function _lzReceive(
        Origin memory _origin,
        bytes32 _guid,
        bytes memory _message,
        address _executor,
        bytes memory _extraData
    ) internal override {
        // Decode the message
        (
            bytes32 proposalId,
            uint32 srcChainId,
            uint256 votingPower,
            uint8 support
        ) = abi.decode(_message, (bytes32, uint32, uint256, uint8));
        
        // Verify proposal exists
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.startTime > 0, "OGT: Proposal does not exist");
        require(block.timestamp >= proposal.startTime, "OGT: Voting not started");
        require(block.timestamp <= proposal.endTime, "OGT: Voting ended");
        
        // Add the cross-chain vote
        if (support == 0) {
            proposal.againstVotes = proposal.againstVotes.add(votingPower);
        } else if (support == 1) {
            proposal.forVotes = proposal.forVotes.add(votingPower);
        } else {
            proposal.abstainVotes = proposal.abstainVotes.add(votingPower);
        }
        
        // Update the chain's total voting power for this proposal
        _chainVotingPower[srcChainId] = _chainVotingPower[srcChainId].add(votingPower);
        
        emit CrossChainVoteCast(proposalId, srcChainId, votingPower, support);
    }
    
    /**
     * @dev Gets the details of a proposal
     * @param _proposalId The unique identifier of the proposal
     * @return proposal The proposal details
     */
    function getProposal(bytes32 _proposalId) external view override returns (Proposal memory) {
        return _proposals[_proposalId];
    }
    
    /**
     * @dev Checks whether a voter has voted on a proposal
     * @param _proposalId The unique identifier of the proposal
     * @param _voter The address to check
     * @return hasVoted Whether the address has voted
     * @return support The vote type (0=against, 1=for, 2=abstain)
     * @return weight The voting weight
     */
    function getVote(bytes32 _proposalId, address _voter) external view override returns (
        bool hasVoted,
        uint8 support,
        uint256 weight
    ) {
        Vote memory vote = _votes[_proposalId][_voter];
        return (vote.hasVoted, vote.support, vote.weight);
    }
    
    /**
     * @dev Update proposal status based on votes
     * @param _proposalId The unique identifier of the proposal
     */
    function updateProposalStatus(bytes32 _proposalId) external override {
        Proposal storage proposal = _proposals[_proposalId];
        require(proposal.startTime > 0, "OGT: Proposal does not exist");
        require(block.timestamp > proposal.endTime, "OGT: Voting not ended");
        require(proposal.status == ProposalStatus.Active, "OGT: Not in active state");
        
        uint256 totalVotes = proposal.forVotes.add(proposal.againstVotes).add(proposal.abstainVotes);
        uint256 quorum = totalSupply().div(4); // 25% quorum
        
        if (totalVotes < quorum) {
            proposal.status = ProposalStatus.Defeated;
        } else if (proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.Succeeded;
        } else {
            proposal.status = ProposalStatus.Defeated;
        }
    }
    
    /**
     * @dev Get the total voting power from a specific chain
     * @param _chainId The LayerZero chain ID
     * @return votingPower The total voting power from that chain
     */
    function getChainVotingPower(uint32 _chainId) external view override returns (uint256) {
        return _chainVotingPower[_chainId];
    }
    
    /**
     * @dev Admin function to mint new tokens
     * @param _to Address to mint tokens to
     * @param _amount Amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
}