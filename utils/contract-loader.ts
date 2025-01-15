import Web3 from 'web3';
import { Contract as Web3Contract } from 'web3-eth-contract';



// Create a type that matches Web3 Contract structure more closely
export interface PasschainContract {
  address: string;
  methods: {
    [key: string]: (...args: any[]) => {
      send: (options?: any) => Promise<any>;
      call: (options?: any) => Promise<any>;
    };
  };
  options: {
    address: string;
  };
  _address?: string;
}

// Define network configuration interface
interface NetworkConfig {
  events: Record<string, any>;
  links: Record<string, any>;
  address: string;
  transactionHash: string;
}

interface ContractArtifact {
  networks: Record<string, NetworkConfig>;
  abi: any[];
}

// Import contract artifacts
import BlockchainRegistryArtifact from '../build/contracts/BlockchainRegistry.json';
import BlockchainMonitorArtifact from '../build/contracts/BlockchainMonitor.json';
import ChaCha20Poly1305Artifact from '../build/contracts/ChaCha20Poly1305.json';
import MetadataParserArtifact from '../build/contracts/MetadataParser.json';
import PacechainChannelArtifact from '../build/contracts/PacechainChannel.json';
import SpeculativeTransactionHandlerArtifact from '../build/contracts/SpeculativeTransactionHandler.json';
import ConfidenceScoreCalculatorArtifact from '../build/contracts/ConfidenceScoreCalculator.json';
import AssetTransferProcessorArtifact from '../build/contracts/AssetTransferProcessor.json';
import TransactionValidatorArtifact from '../build/contracts/TransactionValidator.json';
import RewardDistributorArtifact from '../build/contracts/RewardDistributor.json';
import RewardTokenArtifact from '../build/contracts/RewardToken.json';
import ProofOfStakeValidatorArtifact from '../build/contracts/ProofOfStakeValidator.json';
import StateManagerArtifact from '../build/contracts/StateManager.json';
import TransactionRelayArtifact from '../build/contracts/TransactionRelay.json';
import ReceivingBlockchainInterfaceArtifact from '../build/contracts/ReceivingBlockchainInterface.json';

// Export the interface so it can be imported by other files


export const loadContracts = (web3: Web3): { [key: string]: PasschainContract } => {
  const contractConfigs = {
    BlockchainRegistry: {
      artifact: BlockchainRegistryArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    BlockchainMonitor: {
      artifact: BlockchainMonitorArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    ChaCha20Poly1305: {
      artifact: ChaCha20Poly1305Artifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    MetadataParser: {
      artifact: MetadataParserArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    PacechainChannel: {
      artifact: PacechainChannelArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    SpeculativeTransactionHandler: {
      artifact: SpeculativeTransactionHandlerArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    ConfidenceScoreCalculator: {
      artifact: ConfidenceScoreCalculatorArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    AssetTransferProcessor: {
      artifact: AssetTransferProcessorArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    TransactionValidator: {
      artifact: TransactionValidatorArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    RewardDistributor: {
      artifact: RewardDistributorArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    RewardToken: {
      artifact: RewardTokenArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    ProofOfStakeValidator: {
      artifact: ProofOfStakeValidatorArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    StateManager: {
      artifact: StateManagerArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    TransactionRelay: {
      artifact: TransactionRelayArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
    ReceivingBlockchainInterface: {
      artifact: ReceivingBlockchainInterfaceArtifact as ContractArtifact,
      defaultNetworkId: '5777',
    },
  };

  const contracts: { [key: string]: PasschainContract } = {};

  Object.entries(contractConfigs).forEach(([name, config]) => {
    const networks = config.artifact.networks;
    const networkId = config.defaultNetworkId;
    
    // Use type assertion to handle network config
    const networkConfig = networks[networkId as keyof typeof networks] as NetworkConfig;

    if (networkConfig && networkConfig.address) {
      // Create contract and explicitly type it
      const contract = new web3.eth.Contract(
        config.artifact.abi, 
        networkConfig.address
      ) as unknown as PasschainContract;

      // Ensure address is set
      contract.address = networkConfig.address;
      contract.options = { address: networkConfig.address };

      contracts[name] = contract;
    } else {
      console.warn(`No address found for ${name} contract on network ${networkId}`);
    }
  });

  return contracts;
};

export const logContractDetails = (contracts: { [key: string]: PasschainContract }) => {
  Object.entries(contracts).forEach(([name, contract]) => {
    console.log(`Contract: ${name}`);
    console.log(`Address: ${contract.address || contract.options.address}`);
  });
};

