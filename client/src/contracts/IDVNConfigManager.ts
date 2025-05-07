// Interface for DVNConfigManager - LayerZero DVN Security Configuration
import { ethers } from 'ethers';

export const DVNConfigManagerABI = [
  // DVN Configuration
  "function setDVN(uint16 dstChainId, address dvnAddress, bool enabled) returns (bool)",
  "function setDVNRequiredSignatures(uint16 dstChainId, address dvnAddress, uint8 requiredSignatures) returns (bool)",
  "function setSecurityLevel(uint16 dstChainId, uint8 securityLevel) returns (bool)",
  
  // DVN Status
  "function isDVNEnabled(uint16 dstChainId, address dvnAddress) view returns (bool)",
  "function getRequiredSignatures(uint16 dstChainId, address dvnAddress) view returns (uint8)",
  "function getSecurityLevel(uint16 dstChainId) view returns (uint8)",
  "function getDVNs(uint16 dstChainId) view returns (address[] memory, bool[] memory, uint8[] memory)",
  
  // Admin Functions
  "function setDefaultDVN(address dvnAddress, bool enabled) returns (bool)",
  "function addSupportedDVN(address dvnAddress, string calldata name) returns (bool)",
  "function removeSupportedDVN(address dvnAddress) returns (bool)",
  "function getSupportedDVNs() view returns (address[] memory, string[] memory)",
  
  // Events
  "event DVNStatusChanged(uint16 indexed dstChainId, address indexed dvnAddress, bool enabled)",
  "event DVNSignaturesChanged(uint16 indexed dstChainId, address indexed dvnAddress, uint8 requiredSignatures)",
  "event SecurityLevelChanged(uint16 indexed dstChainId, uint8 securityLevel)",
  "event DVNAdded(address indexed dvnAddress, string name)",
  "event DVNRemoved(address indexed dvnAddress)"
];

export interface DVNConfigManager extends ethers.Contract {
  // DVN Configuration
  setDVN(
    dstChainId: number,
    dvnAddress: string,
    enabled: boolean
  ): Promise<ethers.ContractTransaction>;
  
  setDVNRequiredSignatures(
    dstChainId: number,
    dvnAddress: string,
    requiredSignatures: number
  ): Promise<ethers.ContractTransaction>;
  
  setSecurityLevel(
    dstChainId: number,
    securityLevel: number
  ): Promise<ethers.ContractTransaction>;
  
  // DVN Status
  isDVNEnabled(dstChainId: number, dvnAddress: string): Promise<boolean>;
  
  getRequiredSignatures(dstChainId: number, dvnAddress: string): Promise<number>;
  
  getSecurityLevel(dstChainId: number): Promise<number>;
  
  getDVNs(dstChainId: number): Promise<[string[], boolean[], number[]]>;
  
  // Admin Functions
  setDefaultDVN(dvnAddress: string, enabled: boolean): Promise<ethers.ContractTransaction>;
  
  addSupportedDVN(dvnAddress: string, name: string): Promise<ethers.ContractTransaction>;
  
  removeSupportedDVN(dvnAddress: string): Promise<ethers.ContractTransaction>;
  
  getSupportedDVNs(): Promise<[string[], string[]]>;
}

export function getDVNConfigManagerContract(
  address: string,
  provider: ethers.providers.Provider | ethers.Signer
): DVNConfigManager {
  return new ethers.Contract(address, DVNConfigManagerABI, provider) as DVNConfigManager;
}