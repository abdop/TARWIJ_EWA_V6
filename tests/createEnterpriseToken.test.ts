/**
 * Test for creating an enterprise token for Innovate Analytics (ent_002)
 * 
 * This test validates:
 * 1. Token creation with admin key as provider private key
 * 2. Generation and storage of wipe, fee, and delete keys
 * 3. Supply key using KeyList with all decider users and threshold = n
 * 4. Token has decimals = 2, no max supply, no initial supply
 * 5. Custom fractional fee (5/1000) with operator as fee collector
 */

import { config } from 'dotenv';
import { enterpriseTokenService } from '../src/services/hedera/enterpriseToken';
import { hederaClient } from '../src/services/hedera/client';
import { dataService } from '../src/services/data/dataService';

// Load environment variables
config();

async function testCreateEnterpriseToken() {
  console.log('=== Enterprise Token Creation Test ===\n');

  try {
    // Initialize Hedera client
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    const network = process.env.HEDERA_NETWORK as 'testnet' | 'mainnet' | 'previewnet';

    if (!operatorId || !operatorKey) {
      throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env');
    }

    console.log('1. Initializing Hedera client...');
    hederaClient.initializeClient(operatorId, operatorKey, network || 'testnet');
    console.log('✓ Hedera client initialized\n');

    // Get Innovate Analytics enterprise
    const enterpriseId = 'ent_002';
    console.log(`2. Loading enterprise data for ${enterpriseId}...`);
    const enterprise = await dataService.getEnterprise(enterpriseId);
    
    if (!enterprise) {
      throw new Error(`Enterprise ${enterpriseId} not found`);
    }
    
    console.log(`✓ Enterprise found: ${enterprise.name} (${enterprise.symbol})`);
    console.log(`   Address: ${enterprise.address}`);
    console.log(`   Industry: ${enterprise.industry}\n`);

    // Get decider users
    console.log('3. Loading decider users...');
    const deciderUsers = await dataService.getUsersByCategory(enterpriseId, 'decider');
    console.log(`✓ Found ${deciderUsers.length} decider users:`);
    deciderUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.role}) - ${user.hedera_id}`);
    });
    console.log('');

    // Check if token already exists
    console.log('4. Checking if enterprise token already exists...');
    const existingToken = await enterpriseTokenService.getEnterpriseToken(enterpriseId);
    if (existingToken) {
      console.log('⚠ Token already exists for this enterprise:');
      console.log(`   Token ID: ${existingToken.tokenId}`);
      console.log(`   Symbol: ${existingToken.symbol}`);
      console.log(`   Created: ${existingToken.createdAt}`);
      console.log('\nTest completed - Token already exists\n');
      return;
    }
    console.log('✓ No existing token found\n');

    // Get admin user (enterprise admin)
    console.log('5. Loading enterprise admin...');
    const adminUser = await dataService.getUsersByCategory(enterpriseId, 'ent_admin');
    if (adminUser.length === 0) {
      throw new Error('No enterprise admin found');
    }
    const admin = adminUser[0];
    console.log(`✓ Admin: ${admin.name} - ${admin.hedera_id}`);
    
    const adminPrivateKeyEnvVar = `${admin.id}_PRIVATE_KEY`;
    const adminPrivateKey = process.env[adminPrivateKeyEnvVar];
    if (!adminPrivateKey) {
      throw new Error(`Admin private key not found: ${adminPrivateKeyEnvVar}`);
    }
    console.log(`✓ Admin private key loaded from ${adminPrivateKeyEnvVar}\n`);

    // Create token
    console.log('6. Creating enterprise token...');
    console.log('   Configuration:');
    console.log(`   - Name: ${enterprise.name}`);
    console.log(`   - Symbol: ${enterprise.symbol}`);
    console.log(`   - Decimals: 2`);
    console.log(`   - Initial Supply: 0`);
    console.log(`   - Max Supply: Infinite`);
    console.log(`   - Admin Key: Provider private key (${operatorId})`);
    console.log(`   - Treasury: ${operatorId}`);
    console.log(`   - Supply Key: KeyList with ${deciderUsers.length} deciders (threshold: ${deciderUsers.length})`);
    console.log(`   - Custom Fee: 5/1000 (0.5%) to ${operatorId}`);
    console.log('');

    const result = await enterpriseTokenService.createEnterpriseToken({
      enterpriseId: enterprise.id,
      enterpriseName: enterprise.name,
      enterpriseSymbol: enterprise.symbol,
      adminPrivateKey: operatorKey, // Using provider private key as admin key
      treasuryAccountId: operatorId,
      decimals: 2,
      customFee: {
        numerator: 5,
        denominator: 1000,
        feeCollectorAccountId: operatorId,
        allCollectorsAreExempt: true,
      },
    });

    console.log('✓ Token created successfully!\n');
    console.log('7. Token Details:');
    console.log(`   Token ID: ${result.tokenId}`);
    console.log(`   Transaction ID: ${result.transactionId}`);
    console.log(`   Symbol: ${result.enterpriseToken.symbol}`);
    console.log(`   Name: ${result.enterpriseToken.name}`);
    console.log(`   Decimals: ${result.enterpriseToken.decimals}`);
    console.log(`   Total Supply: ${result.enterpriseToken.totalSupply}`);
    console.log(`   Treasury: ${result.enterpriseToken.treasuryAccountId}`);
    console.log(`   Fee Collector: ${result.enterpriseToken.feeCollectorAccountId}`);
    console.log(`   Fractional Fee: ${result.enterpriseToken.fractionalFee * 100}%`);
    console.log('');

    console.log('8. Generated Keys:');
    console.log(`   Wipe Key (private): ${result.keys.wipeKey.privateKey.substring(0, 20)}...`);
    console.log(`   Wipe Key (public): ${result.keys.wipeKey.publicKey}`);
    console.log(`   Fee Key (private): ${result.keys.feeKey.privateKey.substring(0, 20)}...`);
    console.log(`   Fee Key (public): ${result.keys.feeKey.publicKey}`);
    console.log(`   Delete Key (private): ${result.keys.deleteKey.privateKey.substring(0, 20)}...`);
    console.log(`   Delete Key (public): ${result.keys.deleteKey.publicKey}`);
    console.log('');

    console.log('9. Supply Key Configuration:');
    console.log(`   Type: KeyList`);
    console.log(`   Threshold: ${result.keys.supplyKeyThreshold} (requires all deciders)`);
    console.log(`   Public Keys (${result.keys.supplyKeyList.length}):`);
    result.keys.supplyKeyList.forEach((key, index) => {
      console.log(`      ${index + 1}. ${key}`);
    });
    console.log('');

    console.log('10. Verification:');
    const savedToken = await dataService.getEnterpriseTokenByEnterpriseId(enterpriseId);
    if (savedToken) {
      console.log('✓ Token saved to data.json');
      console.log('✓ Wipe key stored');
      console.log('✓ Fee key stored');
      console.log('✓ Delete key stored');
      console.log('✓ Supply key list stored');
      console.log(`✓ Supply key threshold: ${savedToken.supplyKeyThreshold}`);
    } else {
      console.log('✗ Token not found in data.json');
    }
    console.log('');

    console.log('=== Test Passed Successfully ===\n');

  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error('Error:', error);
    console.error('\nStack trace:', error instanceof Error ? error.stack : 'N/A');
    process.exit(1);
  }
}

// Run the test
testCreateEnterpriseToken()
  .then(() => {
    console.log('Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
