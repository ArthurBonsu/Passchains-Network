import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../components/BlockchainContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Logger } from '../utils/logger';

const TransactionForm: React.FC = () => {
  const { web3, accounts, connect, processTransaction } = useBlockchain();
  const { addTransaction } = useTransactions();
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    city: '',
    date: '',
    sector: '',
    ktCO2: ''
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startTime = performance.now();
    
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
      const result = await processTransaction(formData);
      const endTime = performance.now();
      
      addTransaction({
        ...formData,
        blockchainResults: result,
        processingTime: endTime - startTime,
        timestamp: Date.now()
      });

      setResult(result);
      setFormData({ city: '', date: '', sector: '', ktCO2: '' }); // Clear form
      Logger.info('Transaction processed successfully', { 
        result,
        processingTime: endTime - startTime 
      });
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
    <div className="transaction-form">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="text" 
            name="city" 
            placeholder="City" 
            value={formData.city}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required 
          />
          <input 
            type="date" 
            name="date" 
            value={formData.date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="text" 
            name="sector" 
            placeholder="Sector" 
            value={formData.sector}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required 
          />
          <input 
            type="number" 
            name="ktCO2" 
            placeholder="ktCO2" 
            value={formData.ktCO2}
            onChange={handleChange}
            step="0.00000001"
            className="w-full p-2 border rounded"
            required 
          />
        </div>
        <button 
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
        >
          {accounts.length > 0 ? 'Process Transaction' : 'Connect Wallet'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded">
          <h2 className="text-xl font-semibold mb-2">Transaction Results</h2>
          <pre className="overflow-x-auto bg-gray-100 p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;