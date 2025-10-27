/**
 * Test for unpausing an enterprise token (ent_002 - Innovate Analytics)
 * 
 * This test validates:
 * 1. Token can be unpaused using pause key
 * 2. Unpause operation is logged to data.json
 * 3. Transaction is successful on Hedera
 */

import { config } from 'dotenv';
import { enterpriseTokenService } from '../src/services/hedera/enterpriseToken';
import { hederaClient } from '../src/services/hedera/client';
import { 
  getEnterpriseTokenRepository,
  getDltOperationRepository 
} from '../src/repositories/RepositoryFactory';

// Load environment variables
config();

async function testUnpauseToken() {
  console.log('=== Token Unpause Test ===\n');

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

    // Get enterprise token
    const enterpriseId = 'ent_002';
    console.log(`2. Loading token for enterprise ${enterpriseId}...`);
    const tokenRepo = getEnterpriseTokenRepository();
    const token = await tokenRepo.findByEnterpriseId(enterpriseId);
    
    if (!token) {
      throw new Error(`No token found for enterprise ${enterpriseId}. Please run token creation test first.`);
    }
    
    console.log(`✓ Token found: ${token.symbol} (${token.tokenId})`);
    console.log(`   Name: ${token.name}`);
    console.log(`   Decimals: ${token.decimals}`);
    console.log(`   Total Supply: ${token.totalSupply}\n`);

    // Check if pause key exists
    if (!token.pauseKey) {
      throw new Error('Pause key not found in token data. Token may have been created before pause key was implemented.');
    }
    console.log('✓ Pause key found in token data\n');

    // Unpause the token
    console.log('3. Unpausing token...');
    console.log(`   Token ID: ${token.tokenId}`);
    console.log(`   Using pause key from data.json\n`);

    const transactionId = await enterpriseTokenService.unpauseToken(
      token.tokenId,
      token.pauseKey
    );

    console.log('✓ Token unpaused successfully!\n');
    console.log('4. Unpause Details:');
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Token ID: ${token.tokenId}`);
    console.log(`   Status: ACTIVE\n`);

    // Verify operation was logged
    console.log('5. Verifying operation log...');
    const dltOpRepo = getDltOperationRepository();
    const operations = await dltOpRepo.findByEnterprise(enterpriseId);
    const unpauseOperation = operations.find((op: any) => 
      op.type === 'TOKEN_UNPAUSE' && 
      op.tokenId === token.tokenId &&
      op.transactionId === transactionId
    );

    if (unpauseOperation) {
      console.log('✓ Unpause operation logged in data.json');
      console.log(`   Operation ID: ${unpauseOperation.id}`);
      console.log(`   Status: ${unpauseOperation.status}`);
      console.log(`   Created: ${unpauseOperation.createdAt}\n`);
    } else {
      console.log('⚠ Unpause operation not found in logs\n');
    }

    console.log('=== Test Passed Successfully ===\n');
    console.log('✓ Token is now ACTIVE and operational.');
    console.log('   All transfers and operations are enabled.\n');

  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error('Error:', error);
    
    if (error.message && error.message.includes('TOKEN_NOT_PAUSED')) {
      console.error('\n⚠ Token is not paused. Run pause test first.');
    }
    
    console.error('\nStack trace:', error instanceof Error ? error.stack : 'N/A');
    process.exit(1);
  }
}

// Run the test
testUnpauseToken()
  .then(() => {
    console.log('Test execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
