// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/token/oft/OFT.sol";
import "@layerzerolabs/lz-evm-v1-0.7/contracts/lzApp/NonblockingLzApp.sol";
import "../interfaces/IOmniGovernToken.sol";

/**
 * @title OmniGovernToken
 * @dev Implementation of the OmniGovern DAO token with cross-chain capabilities
 * using LayerZero's OFT (Omnichain Fungible Token) standard.
 * Simplified to focus on core LayerZero OFT functionality with governance features.
 */
contract OmniGovernToken is IOmniGovernToken, OFT, ERC20Votes, Ownable {
    // Hub chain ID for governance coordination
    uint16 public hubChainId;
    uint16 public constant HUB_CHAIN_ID_DEFAULT = 1; // Default to Ethereum mainnet
    
    // Mapping of proposal IDs to votes
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => uint256) public proposalVotes;
    
    // LayerZero message types
    uint8 public constant LZ_MESSAGE_TYPE_TRANSFER = 0;
    uint8 public constant LZ_MESSAGE_TYPE_VOTE = 1;
    uint8 public constant LZ_MESSAGE_TYPE_EXECUTE = 2;
    
    /**
     * @dev Constructor for OmniGovernToken
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _lzEndpoint LayerZero endpoint address
     * @param _owner Owner of the token contract
     * @param _initialSupply Initial token supply (all minted to the owner)
     * @param _hubChainId The chain ID of the hub/coordinator chain
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _owner,
        uint256 _initialSupply,
        uint16 _hubChainId
    )
        ERC20(_name, _symbol)
        ERC20Permit(_name)
        OFT(_lzEndpoint)
        Ownable(_owner)
    {
        // Set hub chain ID
        hubChainId = _hubChainId == 0 ? HUB_CHAIN_ID_DEFAULT : _hubChainId;
        
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
     * @dev Send tokens to another chain using LayerZero OFT
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
        // Send tokens to the destination chain
        _send(
            msg.sender,
            dstChainId,
            to,
            amount,
            refundAddress,
            zroPaymentAddress,
            adapterParams
        );
        
        emit TokensSent(msg.sender, dstChainId, to, amount);
    }
    
    /**
     * @dev Set trusted remote address for a chain
     * @param remoteChainId The remote chain ID
     * @param path The path to the remote contract
     */
    function setTrustedRemote(uint16 remoteChainId, bytes calldata path) external override onlyOwner {
        _setTrustedRemote(remoteChainId, path);
        emit TrustedRemoteSet(remoteChainId, path);
    }
    
    /**
     * @dev Set trusted remote addresses for multiple chains
     * @param remoteChainIds Array of remote chain IDs
     * @param paths Array of paths to the remote contracts
     */
    function setTrustedRemoteAddresses(uint16[] calldata remoteChainIds, bytes[] calldata paths) external onlyOwner {
        require(remoteChainIds.length == paths.length, "OmniGovernToken: Array length mismatch");
        
        for (uint256 i = 0; i < remoteChainIds.length; i++) {
            _setTrustedRemote(remoteChainIds[i], paths[i]);
            emit TrustedRemoteSet(remoteChainIds[i], paths[i]);
        }
    }
    
    /**
     * @dev Set the hub chain ID
     * @param _hubChainId The new hub chain ID
     */
    function setHubChainId(uint16 _hubChainId) external onlyOwner {
        require(_hubChainId != 0, "OmniGovernToken: Hub chain ID cannot be zero");
        hubChainId = _hubChainId;
        emit HubChainIdSet(_hubChainId);
    }
    
    /**
     * @dev Cast a vote on a proposal
     * @param proposalId The ID of the proposal
     * @param support Whether to support the proposal
     */
    function vote(uint256 proposalId, bool support) external {
        require(!hasVoted[proposalId][msg.sender], "OmniGovernToken: Already voted");
        
        // Record the vote locally
        hasVoted[proposalId][msg.sender] = true;
        
        // Calculate voting power based on token balance
        uint256 votingPower = getVotes(msg.sender);
        require(votingPower > 0, "OmniGovernToken: No voting power");
        
        // If we're not on the hub chain, send the vote to the hub
        if (block.chainid != hubChainId) {
            bytes memory payload = abi.encode(
                LZ_MESSAGE_TYPE_VOTE,
                proposalId,
                support,
                msg.sender,
                votingPower
            );
            
            // Estimate fee
            (uint256 fee, ) = lzEndpoint.estimateFees(
                hubChainId,
                address(this),
                payload,
                false,
                bytes("")
            );
            
            require(msg.value >= fee, "OmniGovernToken: Insufficient fee for cross-chain vote");
            
            // Send vote to hub chain
            lzEndpoint.send{value: msg.value}(
                hubChainId,
                abi.encodePacked(address(this)),
                payload,
                payable(msg.sender),
                address(0),
                bytes("")
            );
        } else {
            // If we're on the hub chain, record the vote directly
            if (support) {
                proposalVotes[proposalId] += votingPower;
            }
        }
        
        emit VoteCast(proposalId, msg.sender, support, votingPower);
    }
    
    /**
     * @dev Handle vote message from another chain (only on hub chain)
     * @param srcChainId Source chain ID
     * @param proposalId Proposal ID
     * @param support Whether the vote supports the proposal
     * @param voter The address of the voter
     * @param votingPower The voting power
     */
    function _handleVoteMessage(
        uint16 srcChainId,
        uint256 proposalId,
        bool support,
        address voter,
        uint256 votingPower
    ) internal {
        // Only the hub chain should process votes
        require(block.chainid == hubChainId, "OmniGovernToken: Not hub chain");
        
        // Record the vote
        if (support) {
            proposalVotes[proposalId] += votingPower;
        }
        
        emit CrossChainVoteReceived(srcChainId, proposalId, voter, support, votingPower);
    }
    
    /**
     * @dev Override the _nonblockingLzReceive to handle different message types
     */
    function _nonblockingLzReceive(
        uint16 srcChainId,
        bytes memory srcAddress,
        uint64 nonce,
        bytes memory payload
    ) internal override {
        // Decode the message type
        if (payload.length < 1) {
            revert("OmniGovernToken: Invalid payload");
        }
        
        uint8 messageType;
        assembly {
            messageType := mload(add(payload, 1))
        }
        
        if (messageType == LZ_MESSAGE_TYPE_TRANSFER) {
            // Handle standard OFT transfer
            super._nonblockingLzReceive(srcChainId, srcAddress, nonce, payload);
        } else if (messageType == LZ_MESSAGE_TYPE_VOTE) {
            // Handle vote message
            (uint8 _, uint256 proposalId, bool support, address voter, uint256 votingPower) = 
                abi.decode(payload, (uint8, uint256, bool, address, uint256));
                
            _handleVoteMessage(srcChainId, proposalId, support, voter, votingPower);
        } else if (messageType == LZ_MESSAGE_TYPE_EXECUTE) {
            // Handle execution message (to be implemented when we add the execution layer)
            revert("OmniGovernToken: Execution not implemented yet");
        } else {
            revert("OmniGovernToken: Unknown message type");
        }
    }
    
    /**
     * @dev Get the voting power for an account
     * @param account The account to get voting power for
     * @return The voting power
     */
    function getVotingPower(address account) external view returns (uint256) {
        return getVotes(account);
    }
    
    /**
     * @dev Delegate voting power to another address
     * @param delegatee The address to delegate to
     */
    function delegateVotingPower(address delegatee) external {
        _delegate(msg.sender, delegatee);
    }
    
    // Events
    event TokensSent(address indexed from, uint16 indexed dstChainId, bytes32 indexed to, uint256 amount);
    event TrustedRemoteSet(uint16 indexed chainId, bytes path);
    event HubChainIdSet(uint16 hubChainId);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
    event CrossChainVoteReceived(uint16 indexed srcChainId, uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
}