// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GasAbstractionLayer
 * @dev Contract to handle gas abstractions for cross-chain governance.
 * Enables relaying transactions and covering gas fees for users to improve UX.
 */
contract GasAbstractionLayer is Ownable {
    // Structure for a transaction to relay
    struct RelayTransaction {
        address target;
        uint256 value;
        bytes data;
        uint256 deadline;
        uint256 nonce;
        address relayer;
        uint256 relayerFee;
        bytes signature;
    }
    
    // Fee multiplier for different transaction types (basis points)
    mapping(bytes4 => uint256) public feeMultipliers;
    
    // Base fee in wei
    uint256 public baseFee;
    
    // Gas price oracle contract
    address public gasPriceOracle;
    
    // Default gas limit per operation type
    mapping(bytes4 => uint256) public defaultGasLimits;
    
    // User nonces for replay protection
    mapping(address => uint256) public nonces;
    
    // Whitelisted relayers
    mapping(address => bool) public whitelistedRelayers;
    
    // Relayer stats
    mapping(address => uint256) public relayerTransactionCount;
    mapping(address => uint256) public relayerFeesEarned;
    
    // Payment token (address(0) for native token)
    address public paymentToken;
    
    // Domain separator for EIP-712 signatures
    bytes32 private immutable _DOMAIN_SEPARATOR;
    
    // EIP-712 type hash
    bytes32 private constant _RELAY_TYPEHASH = keccak256(
        "RelayTransaction(address target,uint256 value,bytes data,uint256 deadline,uint256 nonce,address relayer,uint256 relayerFee)"
    );
    
    /**
     * @dev Constructor
     * @param _owner Contract owner
     * @param _baseFee Base fee for relayed transactions
     * @param _paymentToken Token used for payment (address(0) for native token)
     */
    constructor(address _owner, uint256 _baseFee, address _paymentToken) Ownable(_owner) {
        baseFee = _baseFee;
        paymentToken = _paymentToken;
        
        // Initialize EIP-712 domain separator
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("OmniGovern GasAbstraction")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    /**
     * @dev Relay a transaction
     * @param transaction The transaction to relay
     */
    function relayTransaction(RelayTransaction calldata transaction) external {
        // Validate signature
        address signer = _recoverSigner(transaction);
        
        // Check nonce
        require(nonces[signer] == transaction.nonce, "GasAbstraction: Invalid nonce");
        nonces[signer]++;
        
        // Check deadline
        require(block.timestamp <= transaction.deadline, "GasAbstraction: Transaction expired");
        
        // Check relayer
        require(
            transaction.relayer == address(0) || transaction.relayer == msg.sender,
            "GasAbstraction: Not authorized relayer"
        );
        
        // Process relayer fee
        if (transaction.relayerFee > 0) {
            if (paymentToken == address(0)) {
                // Pay fee in native token
                require(address(this).balance >= transaction.relayerFee, "GasAbstraction: Insufficient balance for fee");
                payable(msg.sender).transfer(transaction.relayerFee);
            } else {
                // Pay fee in ERC20 token
                // Implementation omitted for brevity
                // Would require ERC20 transfer from contract to relayer
            }
            
            // Update relayer stats
            relayerFeesEarned[msg.sender] += transaction.relayerFee;
        }
        
        // Execute the transaction
        (bool success, ) = transaction.target.call{value: transaction.value}(transaction.data);
        require(success, "GasAbstraction: Transaction execution failed");
        
        // Update relayer stats
        relayerTransactionCount[msg.sender]++;
        
        emit TransactionRelayed(signer, transaction.target, transaction.value, keccak256(transaction.data), msg.sender, transaction.relayerFee);
    }
    
    /**
     * @dev Estimate fee for a transaction
     * @param functionSelector Function selector for the transaction
     * @param gasPrice Current gas price
     * @return fee The estimated fee
     */
    function estimateFee(bytes4 functionSelector, uint256 gasPrice) external view returns (uint256 fee) {
        uint256 gasLimit = defaultGasLimits[functionSelector];
        if (gasLimit == 0) {
            gasLimit = 100000; // Default gas limit if not specified
        }
        
        uint256 baseGasCost = gasLimit * gasPrice;
        uint256 multiplier = feeMultipliers[functionSelector];
        if (multiplier == 0) {
            multiplier = 10000; // Default 100% if not specified
        }
        
        fee = baseFee + (baseGasCost * multiplier) / 10000;
        return fee;
    }
    
    /**
     * @dev Recover signer from signature
     * @param transaction The transaction with signature
     * @return signer The address that signed the transaction
     */
    function _recoverSigner(RelayTransaction calldata transaction) internal view returns (address signer) {
        bytes32 structHash = keccak256(
            abi.encode(
                _RELAY_TYPEHASH,
                transaction.target,
                transaction.value,
                keccak256(transaction.data),
                transaction.deadline,
                transaction.nonce,
                transaction.relayer,
                transaction.relayerFee
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                _DOMAIN_SEPARATOR,
                structHash
            )
        );
        
        // Recover signer from signature
        // Split signature into r, s, v components
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(transaction.signature, 32))
            s := mload(add(transaction.signature, 64))
            v := byte(0, mload(add(transaction.signature, 96)))
        }
        
        // EIP-2 compliant (forbids malleable signatures)
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert("GasAbstraction: Invalid signature 's' value");
        }
        
        // EIP-155 compliant (forbids replay attacks across chains)
        if (v != 27 && v != 28) {
            revert("GasAbstraction: Invalid signature 'v' value");
        }
        
        // Recover the signer
        signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "GasAbstraction: Invalid signature");
        
        return signer;
    }
    
    /**
     * @dev Set fee multiplier for a function
     * @param functionSelector The function selector
     * @param multiplier The fee multiplier (in basis points)
     */
    function setFeeMultiplier(bytes4 functionSelector, uint256 multiplier) external onlyOwner {
        require(multiplier <= 20000, "GasAbstraction: Multiplier too high"); // Max 200%
        feeMultipliers[functionSelector] = multiplier;
        emit FeeMultiplierSet(functionSelector, multiplier);
    }
    
    /**
     * @dev Set default gas limit for a function
     * @param functionSelector The function selector
     * @param gasLimit The default gas limit
     */
    function setDefaultGasLimit(bytes4 functionSelector, uint256 gasLimit) external onlyOwner {
        require(gasLimit <= 10000000, "GasAbstraction: Gas limit too high"); // Reasonable max
        defaultGasLimits[functionSelector] = gasLimit;
        emit DefaultGasLimitSet(functionSelector, gasLimit);
    }
    
    /**
     * @dev Set base fee
     * @param _baseFee The new base fee
     */
    function setBaseFee(uint256 _baseFee) external onlyOwner {
        baseFee = _baseFee;
        emit BaseFeeSet(_baseFee);
    }
    
    /**
     * @dev Set gas price oracle
     * @param _gasPriceOracle The new gas price oracle address
     */
    function setGasPriceOracle(address _gasPriceOracle) external onlyOwner {
        gasPriceOracle = _gasPriceOracle;
        emit GasPriceOracleSet(_gasPriceOracle);
    }
    
    /**
     * @dev Set payment token
     * @param _paymentToken The new payment token address
     */
    function setPaymentToken(address _paymentToken) external onlyOwner {
        paymentToken = _paymentToken;
        emit PaymentTokenSet(_paymentToken);
    }
    
    /**
     * @dev Set relayer whitelist status
     * @param relayer The relayer address
     * @param whitelisted Whether the relayer is whitelisted
     */
    function setRelayerWhitelist(address relayer, bool whitelisted) external onlyOwner {
        whitelistedRelayers[relayer] = whitelisted;
        emit RelayerWhitelistSet(relayer, whitelisted);
    }
    
    /**
     * @dev Withdraw funds from the contract
     * @param to Address to send funds to
     * @param amount Amount to withdraw
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "GasAbstraction: Insufficient balance");
        to.transfer(amount);
        emit FundsWithdrawn(to, amount);
    }
    
    /**
     * @dev Allows the contract to receive ETH
     */
    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }
    
    // Events
    event TransactionRelayed(address indexed signer, address indexed target, uint256 value, bytes32 dataHash, address indexed relayer, uint256 relayerFee);
    event FeeMultiplierSet(bytes4 indexed functionSelector, uint256 multiplier);
    event DefaultGasLimitSet(bytes4 indexed functionSelector, uint256 gasLimit);
    event BaseFeeSet(uint256 baseFee);
    event GasPriceOracleSet(address indexed gasPriceOracle);
    event PaymentTokenSet(address indexed paymentToken);
    event RelayerWhitelistSet(address indexed relayer, bool whitelisted);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event FundsReceived(address indexed from, uint256 amount);
}