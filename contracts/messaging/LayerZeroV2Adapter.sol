// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@layerzerolabs/lz-evm-sdk-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "@layerzerolabs/lz-evm-sdk-v2/contracts/interfaces/IMessageLibraryV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LayerZeroV2Adapter
 * @dev A utility contract that provides a clean interface for interacting with LayerZero V2
 * This adapter simplifies the process of sending and receiving cross-chain messages
 */
contract LayerZeroV2Adapter is Ownable {
    // LayerZero endpoint
    ILayerZeroEndpointV2 public endpoint;
    
    // Message handler mapping
    mapping(address => bool) public authorizedHandlers;
    
    // Message history
    struct MessageInfo {
        address sender;
        uint32 srcEid;
        bytes32 guid;
        bytes message;
        uint256 timestamp;
    }
    
    // Map guid to message info
    mapping(bytes32 => MessageInfo) public messages;
    
    // Track message guids by handler
    mapping(address => bytes32[]) public handlerMessages;
    
    // Events
    event MessageSent(address indexed sender, uint32 dstEid, bytes32 guid, bytes message);
    event MessageReceived(address indexed receiver, uint32 srcEid, bytes32 guid, bytes message);
    event HandlerAuthorized(address indexed handler, bool authorized);
    
    /**
     * @dev Constructor
     * @param _endpoint The LayerZero endpoint address
     * @param _owner The owner of the contract
     */
    constructor(address _endpoint, address _owner) Ownable() {
        endpoint = ILayerZeroEndpointV2(_endpoint);
        _transferOwnership(_owner);
    }
    
    /**
     * @dev Authorize a handler to receive messages
     * @param _handler The handler address
     * @param _authorized Whether the handler is authorized
     */
    function authorizeHandler(address _handler, bool _authorized) external onlyOwner {
        authorizedHandlers[_handler] = _authorized;
        emit HandlerAuthorized(_handler, _authorized);
    }
    
    /**
     * @dev Send a message to a destination chain
     * @param _dstEid The destination endpoint ID
     * @param _receiver The receiver address on the destination chain
     * @param _message The message to send
     * @param _options The LayerZero send options
     * @return guid The message guid
     */
    function sendMessage(
        uint32 _dstEid,
        address _receiver,
        bytes calldata _message,
        bytes calldata _options,
        address payable _refundAddress
    ) external payable returns (bytes32) {
        // Send message through LayerZero
        bytes32 guid = endpoint.send{value: msg.value}(
            _dstEid,
            abi.encodePacked(_receiver),
            _message,
            _options,
            _refundAddress
        );
        
        // Store message info
        messages[guid] = MessageInfo({
            sender: msg.sender,
            srcEid: 0, // Not relevant for outgoing messages
            guid: guid,
            message: _message,
            timestamp: block.timestamp
        });
        
        // Add to sender's messages
        handlerMessages[msg.sender].push(guid);
        
        emit MessageSent(msg.sender, _dstEid, guid, _message);
        
        return guid;
    }
    
    /**
     * @dev Forward message to appropriate handler
     * @param _origin The origin of the message
     * @param _guid The message guid
     * @param _message The message payload
     * @param _executor The executor of the message
     * @param _extraData Any extra data
     */
    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external {
        // Ensure this is called by the endpoint
        require(msg.sender == address(endpoint), "Not authorized endpoint");
        
        // Extract the intended receiver from the origin data
        address targetHandler = abi.decode(_origin.receiver, (address));
        
        // Ensure the handler is authorized
        require(authorizedHandlers[targetHandler], "Handler not authorized");
        
        // Store message info
        messages[_guid] = MessageInfo({
            sender: address(0), // Not directly known for incoming messages
            srcEid: _origin.srcEid,
            guid: _guid,
            message: _message,
            timestamp: block.timestamp
        });
        
        // Add to handler's messages
        handlerMessages[targetHandler].push(_guid);
        
        emit MessageReceived(targetHandler, _origin.srcEid, _guid, _message);
        
        // Forward the message to the appropriate handler
        (bool success, ) = targetHandler.call(
            abi.encodeWithSignature(
                "handleLayerZeroMessage(uint32,bytes32,bytes)",
                _origin.srcEid,
                _guid,
                _message
            )
        );
        
        require(success, "Handler call failed");
    }
    
    /**
     * @dev Get message info by guid
     * @param _guid The message guid
     * @return MessageInfo The message info
     */
    function getMessageInfo(bytes32 _guid) external view returns (MessageInfo memory) {
        return messages[_guid];
    }
    
    /**
     * @dev Get all message guids for a handler
     * @param _handler The handler address
     * @return bytes32[] The message guids
     */
    function getHandlerMessages(address _handler) external view returns (bytes32[] memory) {
        return handlerMessages[_handler];
    }
    
    /**
     * @dev Get message verification status
     * @param _guid The message guid
     * @return status Whether the message has been verified
     */
    function getMessageVerificationStatus(bytes32 _guid) external view returns (bool) {
        // This is a simplified implementation - in a real contract,
        // you would query the endpoint for verification status
        return true;
    }
    
    /**
     * @dev Quote fee for sending a message to a destination chain
     * @param _dstEid The destination endpoint ID
     * @param _message The message to send
     * @param _options The LayerZero send options
     * @return nativeFee The native fee
     * @return zroFee The ZRO fee
     */
    function quoteFee(
        uint32 _dstEid,
        bytes calldata _message,
        bytes calldata _options
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        // Calculate message size
        uint256 messageSize = _message.length;
        
        // Call endpoint to get fee quote
        return endpoint.quote(_dstEid, messageSize, _options);
    }
}