const {
  Client,
  PrivateKey,
  AccountId,
  TransferTransaction,
  ScheduleCreateTransaction,
  ScheduleSignTransaction,
  ScheduleInfoQuery,
  Hbar,
  KeyList,
  AccountCreateTransaction,
  TransactionId,
  TokenCreateTransaction,
  CustomFractionalFee,
  TokenMintTransaction,
  Allowance,
  BatchTransaction,
} = require("@hashgraph/sdk");

// ============================================
// Configuration - Replace with your values
// ============================================

// Operator account (pays for the transaction)
const OPERATOR_ID = AccountId.fromString("0.0.6606998");
const OPERATOR_KEY = PrivateKey.fromString(
  "3030020100300706052b8104000a04220420fc34d8e0235b7719522d71778160adafe26c8a22ef4ac917c3f92c41b15bfd08"
);

// Three accounts that must sign the scheduled transaction
const SIGNER_1_ID = AccountId.fromString("0.0.6974151");
const SIGNER_1_KEY = PrivateKey.fromString(
  "3030020100300706052b8104000a042204205df8d925647a0f6b0bce7cda7efe106e2ba007b274b0af8c7557149940fa87c4"
);

const SIGNER_2_ID = AccountId.fromString("0.0.6974242");
const SIGNER_2_KEY = PrivateKey.fromString(
  "3030020100300706052b8104000a0422042075871bdb68390f2bd8aaabfd4b4bc58095037714dfd64e160b7ce72fbbac83c8"
);

const SIGNER_3_ID = AccountId.fromString("0.0.6974232");
const SIGNER_3_KEY = PrivateKey.fromString(
  "3030020100300706052b8104000a042204206412b160dc4dd3b1de5497c82e9f863b95316ee264b6135896b366b7236cc7c8"
);

// Recipient account
const RECIPIENT_ID = AccountId.fromString("0.0.6974223");

// ============================================
// Modular Functions
// ============================================

/**
 * Create a multi-signature account with KeyList
 * @param {Client} client - Hedera client
 * @param {KeyList} keyList - KeyList for multi-sig
 * @param {Hbar} initialBalance - Initial balance for the account
 * @returns {Promise<AccountId>} - Created account ID
 */
async function createMultiSigAccount(
  client,
  keyList,
  initialBalance = new Hbar(5)
) {
  console.log("🔐 Creating multi-signature account...");

  try {
    const multiSigAccount = await new AccountCreateTransaction()
      .setKey(keyList)
      .setInitialBalance(initialBalance)
      .execute(client);

    const multiSigAccountId = (await multiSigAccount.getReceipt(client))
      .accountId;
    console.log(`✅ Multi-Sig Account created: ${multiSigAccountId}`);
    return multiSigAccountId;
  } catch (error) {
    console.error("❌ Error creating multi-sig account:", error.message);
    throw error;
  }
}

/**
 * Create a fungible token with custom fees
 * @param {Client} client - Hedera client
 * @param {Object} tokenConfig - Token configuration
 * @returns {Promise<TokenId>} - Created token ID
 */
async function createToken(client, tokenConfig) {
  console.log("🪙 Creating fungible token...");

  try {
    const {
      name = "Multi-Sig Token",
      symbol = "MST",
      decimals = 2,
      treasuryAccountId = OPERATOR_ID,
      adminKey = OPERATOR_KEY.publicKey,
      supplyKey,
      customFees = [],
    } = tokenConfig;

    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setDecimals(decimals)
      .setCustomFees(customFees)
      .setTreasuryAccountId(treasuryAccountId)
      .setAdminKey(adminKey)
      .setSupplyKey(supplyKey)
      .execute(client);

    const tokenId = (await tokenCreateTx.getReceipt(client)).tokenId;
    console.log(`✅ Token created: ${tokenId}`);
    return tokenId;
  } catch (error) {
    console.error("❌ Error creating token:", error.message);
    throw error;
  }
}

/**
 *
 * @param {Client} client - Hedera client
 * @param {TokenId} tokenId - Token ID
 * @param {AccountId} senderAccountId - Sender account ID
 * @param {AccountId} receiverAccountId - Receiver account ID
 * @param {number} amount - Amount to transfer
 * @param {PrivateKey} senderPrivateKey - Sender private key
 */

async function transferToken(
  client,
  tokenId,
  senderAccountId,
  receiverAccountId,
  amount,
  senderPrivateKey
) {
  try {
    const transaction = await new TransferTransaction()
      .addTokenTransfer(tokenId, senderAccountId, -amount) // Sender: negative amount
      .addTokenTransfer(tokenId, receiverAccountId, amount) // Receiver: positive amount
      .freezeWith(client)
      .sign(senderPrivateKey); // Sign with the sender's private key

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);

    console.log("Token transfer status:", receipt.status.toString());
    return txResponse.transactionId;
  } catch (error) {
    console.error("❌ Error transferring token:", error.message);
    throw error;
  }
}

/**
 * Create a memo in JSON format with timestamps and optional fields
 * @param {string} ref - Reference (e.g. wage advance request)
 * @param {string} [employeeName] - Employee name (optional)
 * @returns {string} - Memo in JSON format
 */
function createMemo(ref, employeeRef) {
  const now = new Date();
  const timestamp = now.toISOString();
  const memo = {
    timestamp,
  };

  if (ref) {
    memo.ref = ref;
  }

  if (employeeRef) {
    memo.employeeRef = employeeRef;
  }

  return JSON.stringify(memo);
}

/**
 * Create a scheduled transaction with multi-signature requirements
 * @param {Client} client - Hedera client
 * @param {Transaction} transaction - Transaction to be scheduled
 * @param {string} memo - Memo for the scheduled transaction
 * @param {Object} scheduleConfig - Schedule configuration
 * @returns {Promise<Object>} - Schedule ID and transaction ID
 */
async function createScheduledTransaction(
  client,
  transaction,
  memo,
  scheduleConfig
) {
  console.log("📅 Creating scheduled transaction...");

  try {
    const { adminKey = OPERATOR_KEY.publicKey, payerAccountId = OPERATOR_ID } =
      scheduleConfig;

    const scheduleTransaction = await new ScheduleCreateTransaction()
      .setScheduledTransaction(transaction)
      .setAdminKey(adminKey)
      .setPayerAccountId(payerAccountId)
      .setScheduleMemo(memo)
      .execute(client);

    const receipt = await scheduleTransaction.getReceipt(client);
    const scheduleId = receipt.scheduleId;
    const scheduledTxId = receipt.scheduledTransactionId;

    console.log(`✅ Schedule created: ${scheduleId}`);
    console.log(`📋 Scheduled Transaction ID: ${scheduledTxId}`);

    return { scheduleId, scheduledTxId };
  } catch (error) {
    console.error("❌ Error creating scheduled transaction:", error.message);
    throw error;
  }
}

/**
 * Sign a scheduled transaction with a specific key
 * @param {Client} client - Hedera client
 * @param {ScheduleId} scheduleId - Schedule ID to sign
 * @param {PrivateKey} signerKey - Private key to sign with
 * @param {string} signerName - Name of the signer (for logging)
 * @returns {Promise<Object>} - Transaction receipt and schedule info
 */
async function signScheduledTransaction(
  client,
  scheduleId,
  signerKey,
  signerName
) {
  console.log(`✍️ ${signerName} signing scheduled transaction...`);

  try {
    const signature = await (
      await new ScheduleSignTransaction()
        .setScheduleId(scheduleId)
        .freezeWith(client)
        .sign(signerKey)
    ).execute(client);

    const receipt = await signature.getReceipt(client);
    console.log(
      `✅ ${signerName} signature status: ${receipt.status.toString()}`
    );

    // Get updated schedule info
    const scheduleInfo = await new ScheduleInfoQuery()
      .setScheduleId(scheduleId)
      .execute(client);

    return { receipt, scheduleInfo };
  } catch (error) {
    console.error(`❌ Error with ${signerName} signature:`, error.message);
    throw error;
  }
}

/**
 * Create a KeyList for multi-signature requirements
 * @param {Array<PublicKey>} publicKeys - Array of public keys
 * @param {number} threshold - Number of signatures required
 * @returns {KeyList} - KeyList object
 */
function createKeyList(publicKeys, threshold) {
  console.log(
    `🔑 Creating KeyList with ${publicKeys.length} keys, threshold: ${threshold}`
  );
  return new KeyList(publicKeys, threshold);
}

/**
 * Create custom fractional fee for token
 * @param {Object} feeConfig - Fee configuration
 * @returns {CustomFractionalFee} - Custom fee object
 */
function createCustomFee(feeConfig) {
  const {
    numerator = 5,
    denominator = 1000,
    feeCollectorAccountId = OPERATOR_ID,
    allCollectorsAreExempt = true,
  } = feeConfig;

  return new CustomFractionalFee()
    .setNumerator(numerator)
    .setDenominator(denominator)
    .setFeeCollectorAccountId(feeCollectorAccountId)
    .setAllCollectorsAreExempt(allCollectorsAreExempt);
}

// ============================================
// Main Function
// ============================================

async function createScheduledTransactionWithMultiSig() {
  console.log("🚀 Starting Multi-Signature Scheduled Transaction Demo\n");

  // Initialize Hedera client (testnet)
  const client = Client.forTestnet();
  client.setOperator(OPERATOR_ID, OPERATOR_KEY);

  try {
    // Step 1: Create KeyList for multi-signature (2 out of 3 signatures required)
    /*     const multiSigKeyList = createKeyList(
      [SIGNER_1_KEY.publicKey, SIGNER_2_KEY.publicKey, SIGNER_3_KEY.publicKey],
      2 // Require 2 out of the 3 keys to sign
    ); */

    // Step 2: Create multi-signature account
    /*     const multiSigAccountId = await createMultiSigAccount(
      client,
      multiSigKeyList
    ); */

    // Step 3: Create custom fee for the token
    /*     const customFee = createCustomFee({
      numerator: 5,
      denominator: 1000,
      feeCollectorAccountId: OPERATOR_ID,
      allCollectorsAreExempt: true,
    }); */

    // Step 4: Create token with multi-sig supply key
    /*     const tokenId = await createToken(client, {
      name: "Multi-Sig Demo Token",
      symbol: "MSDT",
      decimals: 2,
      treasuryAccountId: OPERATOR_ID, // test with multi-sig account instead of operator trigger error INVALID_SIGNATURE
      adminKey: OPERATOR_KEY.publicKey,
      supplyKey: multiSigKeyList,
      customFees: [customFee],
    }); */

    // Step 5: Create batch transaction (mint + transfer)
    console.log(
      "📦 Creating Scheduled transaction mint and after that transfer..."
    );

    memo = createMemo("test with existing token ID 0.0.7091937");

    const mintTransaction = new TokenMintTransaction()
      .setTokenId("0.0.7091937") // with an existing token ID
      .setAmount(1100);

    // Step 6: Create scheduled transaction
    const { scheduleId, scheduledTxId } = await createScheduledTransaction(
      client,
      mintTransaction,
      memo,
      {
        adminKey: OPERATOR_KEY.publicKey,
        payerAccountId: OPERATOR_ID,
      }
    );

    // Step 7: Collect required signatures
    console.log("\n=== Collecting Multi-Signatures ===\n");

    // First signature (Signer 2)
    const signature1Result = await signScheduledTransaction(
      client,
      scheduleId,
      SIGNER_2_KEY,
      "Signer 2 (CFO)"
    );

    // Second signature (Signer 1) - This should trigger execution
    const signature2Result = await signScheduledTransaction(
      client,
      scheduleId,
      SIGNER_1_KEY,
      "Signer 1 (CEO)"
    );

    const signature3Result = await signScheduledTransaction(
      client,
      scheduleId,
      SIGNER_3_KEY,
      "Signer 3 (CHRM)"
    );

    // Step 7.5: Execute token transfer after successful multi-sig
    let transferTxId = null;
    if (signature3Result.receipt.status.toString() == "SUCCESS") {
      transferTxId = await transferToken(
        client,
        "0.0.7091937", //test with an existing token ID
        OPERATOR_ID,
        RECIPIENT_ID,
        1000,
        OPERATOR_KEY
      );
      console.log(`✅ Token transfer completed: ${transferTxId}`);
    } else {
      console.log("❌ Scheduled transaction execution failed");
    }

    // Step 8: Check final status
    console.log("\n=== Final Status ===");
    console.log(`📋 Schedule ID: ${scheduleId}`);
    console.log(`🔗 Scheduled Transaction ID: ${scheduledTxId}`);
    if (tokenId != null) console.log(`🪙 Token ID: ${tokenId}`);
    if (transferTxId)
      console.log(`💸 Transfer transaction ID: ${transferTxId}`);
    console.log(`👤 Recipient: ${RECIPIENT_ID}`);

    return {
      scheduleId: scheduleId.toString(),
      scheduledTxId: scheduledTxId.toString(),
      tokenId: tokenId.toString(),
      multiSigAccountId: multiSigAccountId.toString(),
      transferTxId: transferTxId ? transferTxId.toString() : null,
      signatures: [
        {
          signer: "Signer 2",
          status: signature1Result.receipt.status.toString(),
        },
        {
          signer: "Signer 1",
          status: signature2Result.receipt.status.toString(),
        },
      ],
    };
  } catch (error) {
    console.error("💥 Error in main function:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

// ============================================
// Additional Utility Functions
// ============================================

/**
 * Create a simple HBAR transfer transaction for testing
 * @param {AccountId} fromAccount - Source account
 * @param {AccountId} toAccount - Destination account
 * @param {Hbar} amount - Amount to transfer
 * @returns {TransferTransaction} - Transfer transaction
 */
function createHbarTransferTransaction(fromAccount, toAccount, amount) {
  console.log(
    `💸 Creating HBAR transfer: ${amount} from ${fromAccount} to ${toAccount}`
  );

  return new TransferTransaction()
    .addHbarTransfer(fromAccount, amount.negated())
    .addHbarTransfer(toAccount, amount);
}

/**
 * Create a token transfer transaction
 * @param {TokenId} tokenId - Token ID
 * @param {AccountId} fromAccount - Source account
 * @param {AccountId} toAccount - Destination account
 * @param {number} amount - Amount to transfer
 * @returns {TransferTransaction} - Token transfer transaction
 */
function createTokenTransferTransaction(
  tokenId,
  fromAccount,
  toAccount,
  amount
) {
  console.log(
    `🪙 Creating token transfer: ${amount} ${tokenId} from ${fromAccount} to ${toAccount}`
  );

  return new TransferTransaction()
    .addTokenTransfer(tokenId, fromAccount, -amount)
    .addTokenTransfer(tokenId, toAccount, amount);
}

/**
 * Demo function using only HBAR transfers (simpler for testing)
 */
async function createSimpleHbarScheduledTransaction() {
  console.log("🚀 Starting Simple HBAR Multi-Signature Demo\n");

  const client = Client.forTestnet();
  client.setOperator(OPERATOR_ID, OPERATOR_KEY);

  try {
    // Step 1: Create KeyList (2 out of 3 signatures required)
    const keyList = createKeyList(
      [SIGNER_1_KEY.publicKey, SIGNER_2_KEY.publicKey, SIGNER_3_KEY.publicKey],
      2
    );

    // Step 2: Create simple HBAR transfer
    const transferTx = createHbarTransferTransaction(
      SIGNER_1_ID,
      RECIPIENT_ID,
      new Hbar(5)
    ).freezeWith(client);

    // Step 3: Create scheduled transaction
    const { scheduleId, scheduledTxId } = await createScheduledTransaction(
      client,
      transferTx,
      {
        adminKey: keyList,
        payerAccountId: OPERATOR_ID,
        memo: "Simple HBAR multi-sig transfer",
      }
    );

    // Step 4: Collect signatures
    console.log("\n=== Collecting Signatures ===\n");

    const sig1 = await signScheduledTransaction(
      client,
      scheduleId,
      SIGNER_1_KEY,
      "Signer 1"
    );
    const sig2 = await signScheduledTransaction(
      client,
      scheduleId,
      SIGNER_2_KEY,
      "Signer 2"
    );

    return {
      scheduleId: scheduleId.toString(),
      scheduledTxId: scheduledTxId.toString(),
      signatures: [
        { signer: "Signer 1", status: sig1.receipt.status.toString() },
        { signer: "Signer 2", status: sig2.receipt.status.toString() },
      ],
    };
  } catch (error) {
    console.error("💥 Error in simple demo:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

// ============================================
// Alternative: Offline Signing Approach
// ============================================

async function createScheduledTransactionOfflineSigning() {
  const client = Client.forTestnet();
  client.setOperator(OPERATOR_ID, OPERATOR_KEY);

  try {
    console.log("=== Alternative: Offline Signing Pattern ===\n");

    // Create KeyList
    const keyList = new KeyList(
      [
        SIGNER_1_KEY.publicKey,
        SIGNER_2_KEY.publicKey,
        SIGNER_3_KEY.publicKey,
        OPERATOR_KEY.publicKey, // Optional: include operator key if they need to sign too
      ],
      3
    );

    // Create and schedule the transaction
    const innerTx = new TransferTransaction()
      .addHbarTransfer(SIGNER_1_ID, new Hbar(-5))
      .addHbarTransfer(RECIPIENT_ID, new Hbar(5));

    const scheduleTx = await new ScheduleCreateTransaction()
      .setScheduledTransaction(innerTx)
      .setAdminKey(keyList)
      .setPayerAccountId(OPERATOR_ID)
      .freezeWith(client);

    // Sign with operator
    const signedTx = await scheduleTx.sign(OPERATOR_KEY);
    const response = await signedTx.execute(client);
    const receipt = await response.getReceipt(client);
    const scheduleId = receipt.scheduleId;

    console.log(
      `📋 Schedule ID (for offline signing): ${scheduleId.toString()}`
    );
    console.log("\nShare this Schedule ID with the other signers.");
    console.log("They can sign using: ScheduleSignTransaction\n");

    return scheduleId.toString();
  } catch (error) {
    console.error("Error:", error.message);
    throw error;
  } finally {
    client.close();
  }
}

// ============================================
// Execute - Choose Your Demo
// ============================================

// Choose which demo to run by uncommenting one of the following:

// 1. Full token-based multi-signature demo (complex)
createScheduledTransactionWithMultiSig()
  .then((result) => {
    console.log("\n🎉 === Full Demo Result ===");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(console.error);

// 2. Simple HBAR transfer multi-signature demo (recommended for testing)
// createSimpleHbarScheduledTransaction()
//   .then((result) => {
//     console.log("\n🎉 === Simple Demo Result ===");
//     console.log(JSON.stringify(result, null, 2));
//   })
//   .catch(console.error);

// 3. Offline signing pattern demo
// createScheduledTransactionOfflineSigning()
//   .then(scheduleId => {
//     console.log('\n📋 Schedule ID for offline signing:', scheduleId);
//     console.log('Share this ID with other signers to collect signatures offline.');
//   })
//   .catch(console.error);

// ============================================
// Usage Examples
// ============================================

/*
// Example: Create a custom multi-sig workflow
async function customWorkflow() {
  const client = Client.forTestnet();
  client.setOperator(OPERATOR_ID, OPERATOR_KEY);
  
  try {
    // 1. Create KeyList
    const keyList = createKeyList([...publicKeys], threshold);
    
    // 2. Create account (optional)
    const accountId = await createMultiSigAccount(client, keyList);
    
    // 3. Create token (optional)
    const tokenId = await createToken(client, tokenConfig);
    
    // 4. Create transaction
    const transaction = createHbarTransferTransaction(from, to, amount);
    
    // 5. Schedule transaction
    const { scheduleId } = await createScheduledTransaction(client, transaction, config);
    
    // 6. Collect signatures
    await signScheduledTransaction(client, scheduleId, key1, "Signer 1");
    await signScheduledTransaction(client, scheduleId, key2, "Signer 2");
    
  } finally {
    client.close();
  }
}
*/
