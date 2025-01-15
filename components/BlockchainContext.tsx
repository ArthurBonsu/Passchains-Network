import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { loadContracts } from '../utils/contract-loader';

interface BlockchainContextType {
  web3: Web3 | null;
  accounts: string[];
  contracts: {
    [key: string]: Contract;
  };
  connect: () => Promise<void>;
  processTransaction: (data: any) => Promise<any>;
}

const BlockchainContext = createContext<BlockchainContextType>({
  web3: null,
  accounts: [],
  contracts: {},
  connect: async () => {},
  processTransaction: async () => {}
});

export const BlockchainProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [contracts, setContracts] = useState<{[key: string]: Contract}>({});

  const connect = async () => {
    if ((window as any).ethereum) {
      const web3Instance = new Web3((window as any).ethereum);
      try {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        
        const accs = await web3Instance.eth.getAccounts();
        setAccounts(accs);
        setWeb3(web3Instance);

        const loadedContracts = loadContracts(web3Instance);
        setContracts(loadedContracts);
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      console.log('Non-Ethereum browser detected. Consider trying MetaMask!');
    }
  };

  const processTransaction = async (data: any) => {
    if (!web3 || accounts.length === 0) {
      await connect();
    }

    try {
      const { 
        MetadataParser, 
        PacechainChannel, 
        ZKPVerifierBase, 
        ClusterManager, 
        RelayChain 
      } = contracts;

      // Step 1: Parse Metadata
      const parsedMetadata = await MetadataParser.methods
        .parseMetadata(web3.utils.fromAscii(JSON.stringify(data)))
        .send({ from: accounts[0] });

      // Step 2: Initiate Speculative Transaction
      const speculativeTx = await PacechainChannel.methods
        .initiateSpeculativeTransaction(web3.utils.fromAscii(JSON.stringify(data)))
        .send({ from: accounts[0] });

      // Step 3: Generate ZK Proof
      const zkProof = await ZKPVerifierBase.methods
        .generateProof(web3.utils.fromAscii(JSON.stringify(data)), web3.utils.fromAscii('witness'))
        .send({ from: accounts[0] });

      // Step 4: Cluster Processing
      const clusterProcessing = await ClusterManager.methods
        .processTransaction(web3.utils.fromAscii(JSON.stringify(data)))
        .send({ from: accounts[0] });

      // Step 5: Relay to Cross-Chain Network
      const relayCrossChain = await RelayChain.methods
        .relayTransaction(web3.utils.fromAscii(JSON.stringify(data)))
        .send({ from: accounts[0] });

      return {
        parsedMetadata: parsedMetadata.transactionHash,
        speculativeTx: speculativeTx.transactionHash,
        zkProof: zkProof.transactionHash,
        clusterProcessing: clusterProcessing.transactionHash,
        relayCrossChain: relayCrossChain.transactionHash
      };
    } catch (error) {
      console.error('Transaction processing error', error);
      throw error;
    }
  };

  return (
    <BlockchainContext.Provider value={{ 
      web3, 
      accounts, 
      contracts, 
      connect, 
      processTransaction 
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => useContext(BlockchainContext);