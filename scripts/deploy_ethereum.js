require('dotenv').config({ path: '.env.local' });

const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Environment variables with validation
const TATUM_API_KEY = process.env.TATUM_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INFURA_URL = process.env.ETHEREUM_PROVIDER_URL;

// Updated providers configuration with error handling
const providers = [
  {
    url: 'https://ethereum-sepolia.gateway.tatum.io/',
    name: 'Tatum',
    minBalance: '0.1',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'x-api-key': TATUM_API_KEY
    }
  },
  {
    url: INFURA_URL,
    name: 'Infura',
    minBalance: '0.1'
  }
];

// Enhanced error handling for provider testing
async function testProviderConnection(provider) {
  if (provider.name === 'Tatum') {
    try {
      const response = await axios.post(provider.url, {
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        id: 1
      }, {
        headers: provider.headers,
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data) {
        throw new Error('No response data received');
      }
      
      if (response.data.error) {
        throw new Error(`RPC Error: ${JSON.stringify(response.data.error)}`);
      }
      
      if (!response.data.result) {
        throw new Error('No result in response');
      }
      
      console.log(`${provider.name} connection test successful`);
      return true;
    } catch (error) {
      console.error(`${provider.name} connection test failed:`, {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return false;
    }
  }
  return true;
}

// Improved Web3 provider setup with better error handling
async function getWeb3Provider(privateKey) {
  if (!privateKey) {
    throw new Error('Private key not found in environment variables');
  }

  let lastError = null;
  
  for (const provider of providers) {
    let web3Provider = null;
    
    try {
      console.log(`Attempting to connect to ${provider.name} with URL: ${provider.url}`);
      
      if (!provider.url) {
        throw new Error(`Provider URL not configured for ${provider.name}`);
      }

      // Test provider connectivity first
      const isConnected = await testProviderConnection(provider);
      if (!isConnected) {
        throw new Error(`Failed to connect to ${provider.name}`);
      }

      // Configure provider with appropriate headers and error handling
      const providerOptions = {
        privateKeys: [privateKey],
        providerOrUrl: provider.url,
        pollingInterval: 8000,
        timeout: 10000
      };

      if (provider.name === 'Tatum' && provider.headers) {
        providerOptions.headers = provider.headers;
      }

      try {
        web3Provider = new HDWalletProvider(providerOptions);
      } catch (error) {
        throw new Error(`Failed to create HDWalletProvider: ${error.message}`);
      }

      const web3 = new Web3(web3Provider);
      
      // Test the connection with a timeout
      const accounts = await Promise.race([
        web3.eth.getAccounts(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Account retrieval timeout')), 10000)
        )
      ]);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found with provided private key');
      }

      const accountDisplay = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
      console.log(`Account loaded: ${accountDisplay}`);

      try {
        const balance = await web3.eth.getBalance(accounts[0]);
        const balanceInEth = web3.utils.fromWei(balance, 'ether');
        
        console.log(`Connected to ${provider.name}. Account balance: ${balanceInEth} ETH`);
        
        if (parseFloat(balanceInEth) >= parseFloat(provider.minBalance)) {
          return { web3, provider: web3Provider };
        }
        
        throw new Error(`Insufficient balance on ${provider.name}`);
      } catch (error) {
        throw new Error(`Failed to get balance: ${error.message}`);
      }
    } catch (error) {
      lastError = error;
      console.error(`Failed to connect to ${provider.name}:`, error.message);
      
      if (web3Provider && web3Provider.engine) {
        try {
          await new Promise((resolve) => {
            web3Provider.engine.stop();
            resolve();
          });
        } catch (stopError) {
          console.error(`Error stopping provider engine: ${stopError.message}`);
        }
      }
      
      continue;
    }
  }

  throw new Error(`No viable provider found. Last error: ${lastError?.message}`);
}

async function retryOperation(operation, maxRetries = 3, delay = 2000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed: ${error.message}`);
      
      if (i === maxRetries - 1) {
        console.error(`All ${maxRetries} attempts failed. Last error:`, error);
        throw error;
      }
      
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function verifyContract(contractAddress, contractName, contractSource, compilerVersion = 'v0.8.19') {
  if (!ETHERSCAN_API_KEY) {
    throw new Error('ETHERSCAN_API_KEY not found in environment variables');
  }

  try {
    const response = await axios.post('https://api-sepolia.etherscan.io/api', null, {
      params: {
        module: 'contract',
        action: 'verifysourcecode',
        apikey: ETHERSCAN_API_KEY,
        contractaddress: contractAddress,
        sourceCode: contractSource,
        codeformat: 'solidity-single-file',
        contractname: contractName,
        compilerversion: compilerVersion,
        optimizationUsed: 1
      }
    });

    if (response.data.status !== '1') {
      throw new Error(`Contract verification failed: ${response.data.result}`);
    }

    return response.data;
  } catch (error) {
    console.error(`Verification error for ${contractName}:`, error);
    throw error;
  }
}

async function deployContract(contractName, abi, bytecode) {
  return retryOperation(async () => {
    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not found in environment variables');
    }

    const { web3, provider } = await getWeb3Provider(PRIVATE_KEY);
    const accounts = await web3.eth.getAccounts();
    
    try {
      const contract = new web3.eth.Contract(abi);
      
      console.log(`Estimating gas for ${contractName}...`);
      const gasEstimate = await contract.deploy({ data: bytecode })
        .estimateGas({ from: accounts[0] });
      
      const gasPrice = await web3.eth.getGasPrice();
      const totalCost = web3.utils.fromWei(
        (BigInt(gasEstimate) * BigInt(gasPrice)).toString(),
        'ether'
      );
      
      console.log(`Estimated deployment cost for ${contractName}: ${totalCost} ETH`);
      
      console.log(`Deploying ${contractName}...`);
      const deployedContract = await contract
        .deploy({ data: bytecode })
        .send({ 
          from: accounts[0],
          gas: Math.floor(gasEstimate * 1.2)
        });
      
      console.log(`${contractName} deployed to:`, deployedContract.options.address);
      
      return {
        address: deployedContract.options.address,
        transactionHash: deployedContract.transactionHash
      };
    } catch (error) {
      console.error(`Deployment error for ${contractName}:`, error);
      throw error;
    } finally {
      if (provider && provider.engine) {
        await new Promise((resolve) => {
          provider.engine.stop();
          resolve();
        });
      }
    }
  }, 3, 5000);
}

async function deployAllContracts() {
  console.log('Starting contract deployment...');
  
  const contractsDir = path.join(__dirname, '../contracts');
  const buildContractsDir = path.join(__dirname, '../build/contracts');
  const addressesPath = path.join(__dirname, '../config/contract_addresses.json');
  
  // Ensure directories exist
  if (!fs.existsSync(buildContractsDir)) {
    throw new Error('Build directory not found. Please compile contracts first.');
  }
  
  // Read or create addresses file
  let existingAddresses = {};
  try {
    existingAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  } catch (error) {
    console.log('No existing addresses file found. Creating new one.');
  }
  
  const deployedContracts = {};
  
  const contractFiles = fs.readdirSync(buildContractsDir)
    .filter(f => f.endsWith('.json') && !f.includes('Metadata'));
  
  for (const file of contractFiles) {
    const contractName = path.basename(file, '.json');
    console.log(`Processing ${contractName}...`);
    
    try {
      const contractPath = path.join(buildContractsDir, file);
      const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      
      const existingAddress = existingAddresses[contractName]?.address;
      
      const deploymentResult = await deployContract(
        contractName, 
        contractData.abi, 
        contractData.bytecode
      );
      
      const sourceCodePath = path.join(contractsDir, `**/${contractName}.sol`);
      const sourceCodes = glob.sync(sourceCodePath);
      
      if (sourceCodes.length > 0) {
        const sourceCode = fs.readFileSync(sourceCodes[0], 'utf8');
        console.log(`Verifying ${contractName}...`);
        
        const verificationResult = await verifyContract(
          deploymentResult.address,
          contractName,
          sourceCode
        );
        
        deployedContracts[contractName] = {
          address: deploymentResult.address,
          abi: `${contractName}.json`,
          transactionHash: deploymentResult.transactionHash,
          verificationStatus: verificationResult,
          previousAddress: existingAddress
        };
        
        console.log(`${contractName} deployed and verified successfully`);
      }
    } catch (error) {
      console.error(`Failed to deploy and verify ${contractName}:`, error);
      // Continue with other contracts even if one fails
    }
  }
  
  const updatedAddresses = {
    ...existingAddresses,
    ...Object.fromEntries(
      Object.entries(deployedContracts).map(([name, contract]) => [
        name,
        {
          address: contract.address,
          abi: contract.abi,
          previousAddress: contract.previousAddress
        }
      ])
    )
  };
  
  // Ensure config directory exists
  const configDir = path.dirname(addressesPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(addressesPath, JSON.stringify(updatedAddresses, null, 2));
  
  console.log('Contracts deployed and addresses updated:', deployedContracts);
  return deployedContracts;
}

// Enhanced main execution with proper error handling
if (require.main === module) {
    // Process-level unhandled rejection handler
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled promise rejection:', error);
      process.exit(1);
    });
  
    // Validate required environment variables
    const requiredEnvVars = {
      'TATUM_API_KEY': TATUM_API_KEY,
      'PRIVATE_KEY': PRIVATE_KEY,
      'ETHERSCAN_API_KEY': ETHERSCAN_API_KEY
    };
  
    const missingEnvVars = Object.entries(requiredEnvVars)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
  
    if (missingEnvVars.length > 0) {
      console.error('Missing required environment variables:', missingEnvVars.join(', '));
      process.exit(1);
    }
  
    // Add timeout for the entire deployment process
    const deploymentTimeout = setTimeout(() => {
      console.error('Deployment timed out after 5 minutes');
      process.exit(1);
    }, 300000); // 5 minutes
  
    deployAllContracts()
      .then(() => {
        clearTimeout(deploymentTimeout);
        console.log('Deployment completed successfully');
        process.exit(0);
      })
      .catch(error => {
        clearTimeout(deploymentTimeout);
        console.error('Deployment failed:', {
          message: error.message,
          stack: error.stack,
          details: error.details || 'No additional details'
        });
        process.exit(1);
      });
  }
  
  module.exports = {
    deployContract,
    deployAllContracts,
    verifyContract,
    getWeb3Provider
  };