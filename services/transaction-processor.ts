import { PasschainContract } from '../utils/contract-loader';
import Web3 from 'web3';

export class TransactionProcessor {
  private contracts: { [key: string]: PasschainContract };

  constructor(contracts: { [key: string]: PasschainContract }) {
    this.contracts = contracts;
  }

  async processTransaction(transactionData: any, account: string) {
    try {
      // Step 1: Metadata Parsing
      const parsedMetadata = await this.contracts.MetadataParser.methods
        .parseMetadata(this.toHex(transactionData))
        .send({ from: account });

      // Step 2: Speculative Transaction
      const speculativeTx = await this.contracts.PacechainChannel.methods
        .initiateSpeculativeTransaction(this.toHex(transactionData))
        .send({ from: account });

      // Step 3: ZK Proof Generation
      const zkProof = await this.contracts.ZKPVerifierBase.methods
        .generateProof(this.toHex(transactionData), this.toHex('witness'))
        .send({ from: account });

      // Step 4: Cluster Processing
      const clusterProcessing = await this.contracts.ClusterManager.methods
        .processTransaction(this.toHex(transactionData))
        .send({ from: account });

      // Step 5: Cross-Chain Relay
      const relayCrossChain = await this.contracts.RelayChain.methods
        .relayTransaction(this.toHex(transactionData))
        .send({ from: account });

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
  }

  private toHex(data: any): string {
    return Web3.utils.fromAscii(JSON.stringify(data));
  }
}