/**
 * Example: Creating an Enterprise Token
 * 
 * This example demonstrates how to create an enterprise fungible token
 * with multi-signature supply key and custom fractional fee.
 */

import { config } from 'dotenv';
import { enterpriseTokenService } from '../services/hedera/enterpriseToken';
import { hederaClient } from '../services/hedera/client';
import { dataService } from '../services/data/dataService';

// Load environment variables
config();

/**
 * Example 1: Create token for an enterprise
 */
export async function createEnterpriseTokenExample(enterpriseId: string) {
  try {
    // Step 1: Initialize Hedera client
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    
    if (!operatorId || !operatorKey) {
      throw new Error('Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY');
    }

    hederaClient.initializeClient(operatorId, operatorKey, 'testnet');
    console.log('✓ Hedera client initialized');

    // Step 2: Load enterprise data
    const enterprise = await dataService.getEnterprise(enterpriseId);
    if (!enterprise) {
      throw new Error(`Enterprise ${enterpriseId} not found`);
    }
    console.log(`✓ Enterprise loaded: ${enterprise.name}`);

    // Step 3: Check if token already exists
    const existingToken = await enterpriseTokenService.getEnterpriseToken(enterpriseId);
    if (existingToken) {
      console.log(`⚠ Token already exists: ${existingToken.tokenId}`);
      return existingToken;
    }

    // Step 4: Create the token
    const result = await enterpriseTokenService.createEnterpriseToken({
      enterpriseId: enterprise.id,
      enterpriseName: enterprise.name,
      enterpriseSymbol: enterprise.symbol,
      adminPrivateKey: operatorKey, // Using provider key as admin
      treasuryAccountId: operatorId,
      decimals: 2,
      customFee: {
        numerator: 5,
        denominator: 1000,
        feeCollectorAccountId: operatorId,
        allCollectorsAreExempt: true,
      },
    });

    console.log('✓ Token created successfully!');
    console.log(`  Token ID: ${result.tokenId}`);
    console.log(`  Transaction: ${result.transactionId}`);
    console.log(`  Supply Key Threshold: ${result.keys.supplyKeyThreshold}`);

    return result;

  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

/**
 * Example 2: Get enterprise token information
 */
export async function getEnterpriseTokenInfo(enterpriseId: string) {
  try {
    const token = await dataService.getEnterpriseTokenByEnterpriseId(enterpriseId);
    
    if (!token) {
      console.log(`No token found for enterprise ${enterpriseId}`);
      return null;
    }

    console.log('Token Information:');
    console.log(`  Token ID: ${token.tokenId}`);
    console.log(`  Symbol: ${token.symbol}`);
    console.log(`  Name: ${token.name}`);
    console.log(`  Decimals: ${token.decimals}`);
    console.log(`  Total Supply: ${token.totalSupply}`);
    console.log(`  Treasury: ${token.treasuryAccountId}`);
    console.log(`  Fee Collector: ${token.feeCollectorAccountId}`);
    console.log(`  Fractional Fee: ${token.fractionalFee * 100}%`);
    console.log(`  Supply Key Threshold: ${token.supplyKeyThreshold}`);
    console.log(`  Created: ${token.createdAt}`);

    return token;

  } catch (error) {
    console.error('Error getting token info:', error);
    throw error;
  }
}

/**
 * Example 3: Get all decider users for an enterprise
 */
export async function getDeciderUsers(enterpriseId: string) {
  try {
    const deciders = await dataService.getUsersByCategory(enterpriseId, 'decider');
    
    console.log(`Decider Users for Enterprise ${enterpriseId}:`);
    deciders.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.role})`);
      console.log(`     Hedera ID: ${user.hedera_id}`);
      console.log(`     Email: ${user.email}`);
    });

    return deciders;

  } catch (error) {
    console.error('Error getting decider users:', error);
    throw error;
  }
}

/**
 * Example 4: Check if enterprise can create a token
 */
export async function canCreateToken(enterpriseId: string): Promise<boolean> {
  try {
    // Check if enterprise exists
    const enterprise = await dataService.getEnterprise(enterpriseId);
    if (!enterprise) {
      console.log('✗ Enterprise not found');
      return false;
    }
    console.log('✓ Enterprise exists');

    // Check if token already exists
    const hasToken = await enterpriseTokenService.hasEnterpriseToken(enterpriseId);
    if (hasToken) {
      console.log('✗ Token already exists for this enterprise');
      return false;
    }
    console.log('✓ No existing token');

    // Check if there are decider users
    const deciders = await dataService.getUsersByCategory(enterpriseId, 'decider');
    if (deciders.length === 0) {
      console.log('✗ No decider users found');
      return false;
    }
    console.log(`✓ Found ${deciders.length} decider users`);

    // Check if private keys exist for all deciders
    for (const user of deciders) {
      const privateKeyEnvVar = `${user.id}_PRIVATE_KEY`;
      if (!process.env[privateKeyEnvVar]) {
        console.log(`✗ Missing private key: ${privateKeyEnvVar}`);
        return false;
      }
    }
    console.log('✓ All decider private keys available');

    console.log('✓ Enterprise can create token');
    return true;

  } catch (error) {
    console.error('Error checking token creation eligibility:', error);
    return false;
  }
}

/**
 * Example 5: Complete workflow
 */
export async function completeTokenCreationWorkflow(enterpriseId: string) {
  console.log('=== Enterprise Token Creation Workflow ===\n');

  try {
    // Step 1: Validate prerequisites
    console.log('Step 1: Validating prerequisites...');
    const canCreate = await canCreateToken(enterpriseId);
    if (!canCreate) {
      throw new Error('Prerequisites not met for token creation');
    }
    console.log('');

    // Step 2: Show decider information
    console.log('Step 2: Loading decider users...');
    const deciders = await getDeciderUsers(enterpriseId);
    console.log('');

    // Step 3: Create the token
    console.log('Step 3: Creating token...');
    const result = await createEnterpriseTokenExample(enterpriseId);
    console.log('');

    // Step 4: Display token information
    console.log('Step 4: Token created successfully!');
    await getEnterpriseTokenInfo(enterpriseId);
    console.log('');

    console.log('=== Workflow Completed Successfully ===');
    return result;

  } catch (error) {
    console.error('\n=== Workflow Failed ===');
    console.error('Error:', error);
    throw error;
  }
}

// Usage examples (uncomment to run):

// Example 1: Create token for Innovate Analytics
// createEnterpriseTokenExample('ent_002')
//   .then(() => console.log('Done'))
//   .catch(console.error);

// Example 2: Get token information
// getEnterpriseTokenInfo('ent_002')
//   .then(() => console.log('Done'))
//   .catch(console.error);

// Example 3: Get decider users
// getDeciderUsers('ent_002')
//   .then(() => console.log('Done'))
//   .catch(console.error);

// Example 4: Check if can create token
// canCreateToken('ent_002')
//   .then(result => console.log('Can create:', result))
//   .catch(console.error);

// Example 5: Complete workflow
// completeTokenCreationWorkflow('ent_002')
//   .then(() => console.log('Done'))
//   .catch(console.error);
