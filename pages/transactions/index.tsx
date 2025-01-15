import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../../components/BlockchainContext';

interface Transaction {
  id: string;
  data: any;
  timestamp: number;
}

const TransactionList: React.FC = () => {
  const { contracts, web3 } = useBlockchain();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!contracts.RelayChain || !web3) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Placeholder: Adjust based on your actual contract method
        const txCount = await contracts.RelayChain.methods.getTransactionCount().call();
        
        const txList = await Promise.all(
          Array.from({length: Number(txCount)}, (_, i) => 
            contracts.RelayChain.methods.getTransaction(i).call()
          )
        );

        setTransactions(txList);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch transactions', error);
        setError('Failed to load transactions');
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [contracts, web3]);

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="transaction-list">
      <h1>Transaction History</h1>
      {transactions.length === 0 ? (
        <p>No transactions found</p>
      ) : (
        transactions.map((tx, index) => (
          <div key={tx.id || index} className="transaction-item">
            <details>
              <summary>Transaction {index + 1}</summary>
              <pre>{JSON.stringify(tx, null, 2)}</pre>
            </details>
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionList;