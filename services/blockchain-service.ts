import Web3 from 'web3';
import { PasschainContract } from '../utils/contract-loader';

export class BlockchainService {
  private web3: Web3;
  private contracts: { [key: string]: PasschainContract };

  constructor(web3: Web3, contracts: { [key: string]: PasschainContract }) {
    this.web3 = web3;
    this.contracts = contracts;
  }

  async getContractAddresses(): Promise<{ [key: string]: string }> {
    const addresses: { [key: string]: string } = {};
    
    Object.entries(this.contracts).forEach(([name, contract]) => {
      addresses[name] = contract.options.address;
    });

    return addresses;
  }

  async getNetworkInfo(): Promise<{
    networkId: number;
    chainId: number;
    networkType: string;
  }> {
    // Get network ID
    const networkIdBigInt = await this.web3.eth.net.getId();
    const networkId = Number(networkIdBigInt);

    // Get chain ID
    const chainIdBigInt = await this.web3.eth.getChainId();
    const chainId = Number(chainIdBigInt);
    
    // Get network type
    let networkType = 'unknown';
    try {
      // Check if we're connected
      const isListening = await this.web3.eth.net.isListening();
      if (isListening) {
        // Determine network type based on chain ID
        networkType = this.getNetworkTypeFromChainId(chainId);
      }
    } catch (error) {
      console.warn('Could not determine network type', error);
    }

    return {
      networkId,
      chainId,
      networkType
    };
  }

  private getNetworkTypeFromChainId(chainId: number): string {
    switch (chainId) {
      case 1:
        return 'mainnet';
      case 3:
        return 'ropsten';
      case 4:
        return 'rinkeby';
      case 5:
        return 'goerli';
      case 42:
        return 'kovan';
      case 11155111:
        return 'sepolia';
      case 137:
        return 'polygon';
      case 80001:
        return 'polygon-mumbai';
      case 56:
        return 'bsc';
      case 97:
        return 'bsc-testnet';
      case 43114:
        return 'avalanche';
      case 43113:
        return 'avalanche-fuji';
      case 42161:
        return 'arbitrum';
      case 421613:
        return 'arbitrum-goerli';
      case 10:
        return 'optimism';
      case 420:
        return 'optimism-goerli';
      case 5777:
        return 'local';
      default:
        return 'unknown';
    }
  }
}