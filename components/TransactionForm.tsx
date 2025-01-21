import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../components/BlockchainContext';
import { Logger } from '../utils/logger';

const TransactionForm: React.FC = () => {
  const { web3, accounts, connect, processTransaction } = useBlockchain();
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    date: '',
    sector: '',
    ktCO2: ''
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent rendering on server
  if (!isClient) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    Logger.info('Transaction form submitted', { formData });

    if (!web3 || accounts.length === 0) {
      try {
        await connect();
        Logger.info('Wallet connected');
      } catch (connectError) {
        Logger.error('Wallet connection failed', connectError);
        setError('Failed to connect wallet');
        return;
      }
    }

    try {
      setError(null);
      const transactionResult = await processTransaction(formData);
      setResult(transactionResult);
      Logger.info('Transaction processed successfully', { transactionResult });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      Logger.error('Transaction processing error', { error: errorMessage });
      setError(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="city" 
          placeholder="City" 
          value={formData.city}
          onChange={handleChange}
          required 
        />
        <input 
          type="date" 
          name="date" 
          value={formData.date}
          onChange={handleChange}
          required 
        />
        <input 
          type="text" 
          name="sector" 
          placeholder="Sector" 
          value={formData.sector}
          onChange={handleChange}
          required 
        />
        <input 
          type="number" 
          name="ktCO2" 
          placeholder="ktCO2" 
          value={formData.ktCO2}
          onChange={handleChange}
          step="0.00000001"
          required 
        />
        <button type="submit">
          {accounts.length > 0 ? 'Process Transaction' : 'Connect Wallet'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'red' }}>
          {error}
        </div>
      )}
      
      {result && (
        <div>
          <h2>Transaction Results</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;