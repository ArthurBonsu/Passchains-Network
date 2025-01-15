import React from 'react';
import { BlockchainProvider } from '../components/BlockchainContext';
import TransactionForm from '../components/TransactionForm';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <BlockchainProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Passchain Transaction Processor
        </h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Process New Transaction</h2>
            <TransactionForm />
          </div>
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <Link 
                href="/transactions" 
                className="block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
              >
                View Transaction History
              </Link>
              
              <Link 
                href="/performance" 
                className="block bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
              >
                Performance Metrics
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Welcome to Passchain - Secure Cross-Chain Transaction Processing
          </p>
        </div>
      </div>
    </BlockchainProvider>
  );
};

export default Home;