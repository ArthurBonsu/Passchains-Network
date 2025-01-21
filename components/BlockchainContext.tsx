import React, { createContext, useContext, useState, PropsWithChildren, useEffect } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { loadContracts, PasschainContract } from '../utils/contract-loader';
import { Logger } from '../utils/logger';
import { useTransactions } from '../contexts/TransactionContext';

// Updated type definition to handle different contract types
type ContractType = (Contract & { 
  options?: { 
    address?: string 
  }; 
}) | (PasschainContract & {
  options?: { 
    address?: string 
  };
});

interface BlockchainContextType {
  web3: Web3 | null;
  accounts: string[];
  contracts: {
    [key: string]: ContractType;
  };
  connect: () => Promise<void>;
  processTransaction: (data: any) => Promise<TransactionResult>;
  isLoading: boolean;
}

interface TransactionResult {
  parsedMetadata: string;
  speculativeTx: string;
  zkProof: string;
  clusterProcessing: string;
  relayCrossChain: string;
}

const BlockchainContext = createContext<BlockchainContextType>({
  web3: null,
  accounts: [],
  contracts: {},
  connect: async () => {},
  processTransaction: async () => {
    throw new Error('BlockchainContext not initialized');
  },
  isLoading: false
});

export const BlockchainProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [contracts, setContracts] = useState<{[key: string]: ContractType}>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const [isContractInitialized, setIsContractInitialized] = useState(false);

  // Use transactions context
  const { addTransaction } = useTransactions();
 
  // Type-safe contract address retrieval
  const getContractAddress = (contract: ContractType): string => {
    // Check for address property
    if ('address' in contract && contract.address) {
      return contract.address;
    }
    
    // Check for address in options
    if ('options' in contract && contract.options?.address) {
      return contract.options.address;
    }
    
    // Fallback if no address found
    return 'Address not found';
  };

  const loadBlockchainContracts = async (web3Instance: Web3): Promise<void> => {
    try {
      setIsLoading(true);
      const loadedContracts = await loadContracts(web3Instance);
      
      // Verify each contract was loaded correctly
      const verifiedContracts: {[key: string]: ContractType} = {};
      for (const [name, contract] of Object.entries(loadedContracts)) {
        if (!contract || !contract.methods) {
          Logger.warn(`Contract ${name} failed to load correctly`);
          continue;
        }
        verifiedContracts[name] = contract;
      }

      if (Object.keys(verifiedContracts).length === 0) {
        throw new Error('No contracts could be loaded');
      }
      
      setContracts(verifiedContracts);
      setIsContractInitialized(true);
      Logger.info('Contracts loaded successfully', { 
        contracts: Object.keys(verifiedContracts),
        contractAddresses: Object.fromEntries(
          Object.entries(verifiedContracts).map(([name, contract]) => [
            name, 
            getContractAddress(contract)
          ])
        )
      });
    } catch (error) {
      Logger.error('Failed to load contracts', error);
      setIsContractInitialized(false);
      throw new Error('Contract loading failed');
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async (): Promise<void> => {
    // Ensure this only runs on the client
    if (!isClient) return;
  
    Logger.info('Attempting to connect blockchain');
    
    try {
      // Check for ethereum provider
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        Logger.warn('Ethereum provider not found');
        throw new Error('Non-Ethereum browser detected. Consider trying MetaMask!');
      }
  
      // Request account access
      await ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create Web3 instance
      const web3Instance = new Web3(ethereum);
      
      // Get accounts
      const accs = await web3Instance.eth.getAccounts();
      if (accs.length === 0) {
        throw new Error('No accounts found');
      }
  
      // Update state
      setWeb3(web3Instance);
      setAccounts(accs);
  
      // Load contracts
      await loadBlockchainContracts(web3Instance);
  
      Logger.info('Blockchain connected successfully', { 
        accounts: accs,
        contractsLoaded: Object.keys(contracts).length
      });
    } catch (error) {
      Logger.error('Blockchain connection failed', error);
      throw error;
    }
  };

  const processTransaction = async (data: any): Promise<TransactionResult> => {
    // Ensure client-side execution and contract initialization
    if (!isClient) {
      throw new Error('Transaction processing is client-side only');
    }
  
    if (isLoading) {
      throw new Error('Blockchain is still initializing');
    }
  
    // Track start time for performance measurement
    const startTime = performance.now();
  
    // Attempt to connect if not already connected
    try {
      // If no web3 or accounts, attempt to connect
      if (!web3 || accounts.length === 0) {
        await connect();
      }
  
      // Recheck after connection attempt
      if (!web3 || accounts.length === 0) {
        throw new Error('Failed to establish blockchain connection');
      }
  
      // Check if contracts are initialized
      if (!isContractInitialized) {
        await loadBlockchainContracts(web3);
      }
  
      // More comprehensive contract validation
      const requiredContracts = [
        'MetadataParser', 
        'PacechainChannel', 
        'TransactionValidator', 
        'ZKPVerifierBase', 
        'ClusterManager', 
        'TransactionRelay'
      ];
  
      const missingContracts = requiredContracts.filter(
        contractName => !contracts[contractName]
      );
  
      if (missingContracts.length > 0) {
        Logger.error('Missing contracts', {
          missingContracts,
          availableContracts: Object.keys(contracts)
        });
        throw new Error(`Missing required contracts: ${missingContracts.join(', ')}`);
      }
  
      // Detailed logging of available contracts
      requiredContracts.forEach(contractName => {
        const contract = contracts[contractName];
        Logger.info(`Contract ${contractName} details`, {
          address: getContractAddress(contract),
          availableMethods: contract.methods ? Object.keys(contract.methods) : 'No methods'
        });
      });
  
      Logger.info('Processing transaction', data);
  
      const { 
        MetadataParser, 
        PacechainChannel, 
        ZKPVerifierBase, 
        ClusterManager, 
        TransactionRelay 
      } = contracts;
  
      // Ensure all required contracts are present
      if (!MetadataParser || !PacechainChannel || !ZKPVerifierBase || 
          !ClusterManager || !TransactionRelay) {
        throw new Error('Required contracts not initialized');
      }
  
      const encodedData = web3.utils.fromAscii(JSON.stringify(data));
      const defaultOptions = { from: accounts[0] };
  
      const parsedMetadata = await MetadataParser.methods
        .parseMetadata(encodedData)
        .send(defaultOptions);
  
      const speculativeTx = await PacechainChannel.methods
        .initiateSpeculativeTransaction(encodedData)
        .send(defaultOptions);
  
      const zkProof = await ZKPVerifierBase.methods
        .generateProof(encodedData, web3.utils.fromAscii('witness'))
        .send(defaultOptions);
  
      const clusterProcessing = await ClusterManager.methods
        .processTransaction(encodedData)
        .send(defaultOptions);
  
      const relayCrossChain = await TransactionRelay.methods
        .relayTransaction(encodedData)
        .send(defaultOptions);
  
      const result: TransactionResult = {
        parsedMetadata: parsedMetadata.transactionHash,
        speculativeTx: speculativeTx.transactionHash,
        zkProof: zkProof.transactionHash,
        clusterProcessing: clusterProcessing.transactionHash,
        relayCrossChain: relayCrossChain.transactionHash
      };
  
      // Calculate processing time
      const endTime = performance.now();
      const processingTime = endTime - startTime;
  
      // Add transaction to context
      addTransaction({
        ...data,
        blockchainResults: result,
        processingTime
      });
  
      Logger.info('Transaction processed successfully', result);
      return result;
    } catch (error) {
      Logger.error('Transaction processing error', error);
      
      // Additional diagnostic logging
      Logger.info('Connection status', {
        isClient,
        web3Exists: !!web3,
        accountsCount: accounts.length,
        contractsInitialized: isContractInitialized
      });
  
      throw error;
    }
  };

  // Ensure client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render provider on client
  if (!isClient) {
    return null;
  }

  return (
    <BlockchainContext.Provider value={{ 
      web3, 
      accounts, 
      contracts, 
      connect, 
      processTransaction,
      isLoading 
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => useContext(BlockchainContext);