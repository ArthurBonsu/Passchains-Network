import Web3 from 'web3';
import { PasschainContract } from '../utils/contract-loader';
import { Logger } from '../utils/logger';

export class BlockchainService {
  private web3: Web3;
  private contracts: { [key: string]: PasschainContract };

  constructor(web3: Web3, contracts: { [key: string]: PasschainContract }) {
    this.web3 = web3;
    this.contracts = contracts;
    Logger.info('BlockchainService initialized', { 
      contractCount: Object.keys(contracts).length 
    });
  }

  async getContractAddresses(): Promise<{ [key: string]: string }> {
    Logger.info('Retrieving contract addresses');
    
    try {
      const addresses: { [key: string]: string } = {};
      
      Object.entries(this.contracts).forEach(([name, contract]) => {
        addresses[name] = contract.options.address;
      });

      Logger.info('Contract addresses retrieved', { addresses });
      return addresses;
    } catch (error) {
      Logger.error('Error retrieving contract addresses', error);
      throw error;
    }
  }

  async getNetworkInfo(): Promise<{
    networkId: number;
    chainId: number;
    networkType: string;
  }> {
    Logger.info('Retrieving network information');

    try {
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
        Logger.warn('Could not determine network type', error);
      }

      const networkInfo = {
        networkId,
        chainId,
        networkType
      };

      Logger.info('Network information retrieved', networkInfo);
      return networkInfo;
    } catch (error) {
      Logger.error('Error retrieving network information', error);
      throw error;
    }
  }

  private getNetworkTypeFromChainId(chainId: number): string {
    const networkTypes: { [key: number]: string } = {
      1: 'mainnet',
      3: 'ropsten',
      4: 'rinkeby',
      5: 'goerli',
      42: 'kovan',
      11155111: 'sepolia',
      137: 'polygon',
      80001: 'polygon-mumbai',
      56: 'bsc',
      97: 'bsc-testnet',
      43114: 'avalanche',
      43113: 'avalanche-fuji',
      42161: 'arbitrum',
      421613: 'arbitrum-goerli',
      10: 'optimism',
      420: 'optimism-goerli',
      5777: 'local'
    };

    const networkType = networkTypes[chainId] || 'unknown';
    Logger.info('Determined network type', { chainId, networkType });
    return networkType;
  }
}