const { ethers } = require('ethers');
const fs = require('fs');

// Sepolia contracts
const sepoliaAddresses = {
  token: "0x8951cB1F5C2a61bFC1D78318008CDcc7a28fDB6E",
  executor: "0x4A93783AcB59A8ee172C2C01533485Db95c2fbA9",
  dvnManager: "0x6D1c889a4Cbe76e8e2f0C77c482692E4c1212820",
  adapter: "0x3E7eF8f50246982d2E7c17f77d58B6C424fBDE9C"
};

// Amoy contracts
const amoyAddresses = {
  token: "0x7C9f4aa4cE93f2119CD134EEB51c1646449f548a",
  executor: "0x5bA8abC6e18E81D671D16861CD3aa75a2C0F0E7d",
  dvnManager: "0x8F7492DE823025b4CfaAB1D34c58e546379DA1A3",
  adapter: "0x9Bc3e5658Aa337CB27E0a9Fd8BE9c1045D389B9E"
};

// Get checksummed addresses
function getChecksumAddresses(addresses) {
  const result = {};
  
  for (const [key, address] of Object.entries(addresses)) {
    result[key] = ethers.utils.getAddress(address);
  }
  
  return result;
}

console.log('Sepolia checksummed addresses:');
console.log(getChecksumAddresses(sepoliaAddresses));

console.log('\nAmoy checksummed addresses:');
console.log(getChecksumAddresses(amoyAddresses));