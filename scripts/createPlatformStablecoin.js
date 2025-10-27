/**
 * Create Platform Stablecoin Token
 *
 * This script creates a fungible token with all possible keys for the TARWIJ EWA platform.
 * The token will be used as the platform's stablecoin for wage advances.
 *
 * Features:
 * - Admin Key: Full control over the token
 * - Supply Key: Mint and burn tokens
 * - Freeze Key: Freeze/unfreeze accounts
 * - Wipe Key: Wipe tokens from accounts
 * - KYC Key: Grant/revoke KYC
 * - Pause Key: Pause/unpause token operations
 * - Fee Schedule Key: Update custom fees
 *
 * Usage: node scripts/createPlatformStablecoin.js
 */

require("dotenv").config();
const {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
  CustomFractionalFee,
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

// Configuration
const NETWORK = process.env.HEDERA_NETWORK || "testnet";
const TREASURY_ID = process.env.HEDERA_TREASURY_ID;
const TREASURY_KEY = process.env.HEDERA_TREASURY_KEY;

// Token Configuration
const TOKEN_NAME = "TARWIJ MAD Stablecoin";
const TOKEN_SYMBOL = "MADT"; // TARWIJ  MADStablecoin  Token
const DECIMALS = 2; // 2 decimals for cents precision
const INITIAL_SUPPLY = 0; // Start with 0, mint as needed

async function main() {
  console.log("🚀 TARWIJ Platform Stablecoin Creation Script");
  console.log("=".repeat(60));

  // Validate environment variables
  if (!TREASURY_ID || !TREASURY_KEY) {
    throw new Error(
      "Missing HEDERA_TREASURY_ID or HEDERA_TREASURY_KEY in .env file"
    );
  }

  // Initialize Hedera client
  console.log("\n📡 Connecting to Hedera Network...");
  const client = Client.forTestnet();

  const treasuryAccount = AccountId.fromString(TREASURY_ID);
  const treasuryPrivateKey = PrivateKey.fromStringECDSA(TREASURY_KEY);

  client.setOperator(treasuryAccount, treasuryPrivateKey);

  // Create custom fee (0.25% = 25/10000)
  const customFee = new CustomFractionalFee()
    .setNumerator(25)
    .setDenominator(10000)
    .setFeeCollectorAccountId(treasuryAccount)
    .setAllCollectorsAreExempt(true);

  console.log(`✅ Connected to ${NETWORK}`);
  console.log(`   Treasury Account: ${TREASURY_ID}`);
  console.log(`   Custom Fee: 0.25% (25/10000) - Collectors Exempt`);

  // Generate all token keys
  console.log("\n🔑 Generating Token Keys...");

  const adminKey = PrivateKey.generateECDSA();
  const supplyKey = PrivateKey.generateECDSA();
  const freezeKey = PrivateKey.generateECDSA();
  const wipeKey = PrivateKey.generateECDSA();
  const kycKey = PrivateKey.generateECDSA();
  const pauseKey = PrivateKey.generateECDSA();
  const feeScheduleKey = PrivateKey.generateECDSA();

  console.log("✅ Generated 7 token keys:");
  console.log("   - Admin Key (full control)");
  console.log("   - Supply Key (mint/burn)");
  console.log("   - Freeze Key (freeze/unfreeze accounts)");
  console.log("   - Wipe Key (wipe tokens from accounts)");
  console.log("   - KYC Key (grant/revoke KYC)");
  console.log("   - Pause Key (pause/unpause token)");
  console.log("   - Fee Schedule Key (update fees)");

  // Create the token
  console.log("\n💰 Creating Platform Stablecoin Token...");
  console.log(`   Name: ${TOKEN_NAME}`);
  console.log(`   Symbol: ${TOKEN_SYMBOL}`);
  console.log(`   Decimals: ${DECIMALS}`);
  console.log(`   Initial Supply: ${INITIAL_SUPPLY}`);

  const tokenCreateTx = await new TokenCreateTransaction()
    .setTokenName(TOKEN_NAME)
    .setTokenSymbol(TOKEN_SYMBOL)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(DECIMALS)
    .setInitialSupply(INITIAL_SUPPLY)
    .setCustomFees([customFee])
    .setTreasuryAccountId(treasuryAccount)
    .setSupplyType(TokenSupplyType.Infinite)
    .setAdminKey(adminKey.publicKey)
    .setSupplyKey(supplyKey.publicKey)
    .setFreezeKey(freezeKey.publicKey)
    .setWipeKey(wipeKey.publicKey)
    .setKycKey(kycKey.publicKey)
    .setPauseKey(pauseKey.publicKey)
    .setFeeScheduleKey(feeScheduleKey.publicKey)
    .setFreezeDefault(false) // Accounts not frozen by default
    .setTokenMemo("TARWIJ MAD Stablecoin - MADT")
    .freezeWith(client);

  //sign with admin key
  const tokenCreateTxSignedAdminkey = await tokenCreateTx.sign(adminKey);

  // Sign with treasury key
  const tokenCreateTxSigned = await tokenCreateTxSignedAdminkey.sign(
    treasuryPrivateKey
  );

  // Submit the transaction
  const tokenCreateSubmit = await tokenCreateTxSigned.execute(client);

  // Get the receipt
  const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);

  // Get the token ID
  const tokenId = tokenCreateReceipt.tokenId;

  console.log("\n✅ Token Created Successfully!");
  console.log(`   Token ID: ${tokenId.toString()}`);
  console.log(
    `   Transaction ID: ${tokenCreateSubmit.transactionId.toString()}`
  );

  // Prepare environment variables
  const envVars = {
    PLATFORM_STABLECOIN_TOKEN_ID: tokenId.toString(),
    PLATFORM_STABLECOIN_NAME: TOKEN_NAME,
    PLATFORM_STABLECOIN_SYMBOL: TOKEN_SYMBOL,
    PLATFORM_STABLECOIN_DECIMALS: DECIMALS.toString(),
    PLATFORM_STABLECOIN_ADMIN_KEY: adminKey.toStringDer(),
    PLATFORM_STABLECOIN_SUPPLY_KEY: supplyKey.toStringDer(),
    PLATFORM_STABLECOIN_FREEZE_KEY: freezeKey.toStringDer(),
    PLATFORM_STABLECOIN_WIPE_KEY: wipeKey.toStringDer(),
    PLATFORM_STABLECOIN_KYC_KEY: kycKey.toStringDer(),
    PLATFORM_STABLECOIN_PAUSE_KEY: pauseKey.toStringDer(),
    PLATFORM_STABLECOIN_FEE_SCHEDULE_KEY: feeScheduleKey.toStringDer(),
  };

  // Save to .env file
  console.log("\n💾 Saving to .env file...");

  const envPath = path.join(__dirname, "..", ".env");
  let envContent = "";

  // Read existing .env file
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf8");
  }

  // Remove old platform stablecoin entries if they exist
  const lines = envContent.split("\n");
  const filteredLines = lines.filter(
    (line) => !line.startsWith("PLATFORM_STABLECOIN_")
  );

  // Add new platform stablecoin section
  const newSection = [
    "",
    "# Platform Stablecoin Token (WAT - Wage Advance Token)",
    `# Created: ${new Date().toISOString()}`,
    `# Token ID: ${tokenId.toString()}`,
    ...Object.entries(envVars).map(([key, value]) => `${key}=${value}`),
  ];

  const updatedContent = [...filteredLines, ...newSection].join("\n");

  fs.writeFileSync(envPath, updatedContent);

  console.log("✅ Saved to .env file");

  // Save detailed information to a separate file
  const infoPath = path.join(__dirname, "..", "platform-stablecoin-info.json");
  const tokenInfo = {
    createdAt: new Date().toISOString(),
    network: NETWORK,
    token: {
      id: tokenId.toString(),
      name: TOKEN_NAME,
      symbol: TOKEN_SYMBOL,
      decimals: DECIMALS,
      initialSupply: INITIAL_SUPPLY,
      treasuryAccount: TREASURY_ID,
      transactionId: tokenCreateSubmit.transactionId.toString(),
    },
    keys: {
      admin: {
        publicKey: adminKey.publicKey.toStringDer(),
        privateKey: adminKey.toStringDer(),
        description: "Full control over the token (can update all keys)",
      },
      supply: {
        publicKey: supplyKey.publicKey.toStringDer(),
        privateKey: supplyKey.toStringDer(),
        description: "Mint new tokens and burn existing tokens",
      },
      freeze: {
        publicKey: freezeKey.publicKey.toStringDer(),
        privateKey: freezeKey.toStringDer(),
        description:
          "Freeze and unfreeze token transfers for specific accounts",
      },
      wipe: {
        publicKey: wipeKey.publicKey.toStringDer(),
        privateKey: wipeKey.toStringDer(),
        description: "Wipe tokens from an account (reduce balance to zero)",
      },
      kyc: {
        publicKey: kycKey.publicKey.toStringDer(),
        privateKey: kycKey.toStringDer(),
        description: "Grant or revoke KYC status for accounts",
      },
      pause: {
        publicKey: pauseKey.publicKey.toStringDer(),
        privateKey: pauseKey.toStringDer(),
        description: "Pause and unpause all token operations",
      },
      feeSchedule: {
        publicKey: feeScheduleKey.publicKey.toStringDer(),
        privateKey: feeScheduleKey.toStringDer(),
        description: "Update custom fee schedules",
      },
    },
    usage: {
      mint: "Use PLATFORM_STABLECOIN_SUPPLY_KEY to mint tokens for wage advances",
      burn: "Use PLATFORM_STABLECOIN_SUPPLY_KEY to burn tokens when needed",
      freeze:
        "Use PLATFORM_STABLECOIN_FREEZE_KEY to freeze suspicious accounts",
      wipe: "Use PLATFORM_STABLECOIN_WIPE_KEY to remove tokens from frozen accounts",
      kyc: "Use PLATFORM_STABLECOIN_KYC_KEY to grant KYC to verified users",
      pause: "Use PLATFORM_STABLECOIN_PAUSE_KEY in emergency situations",
    },
    security: {
      warning:
        "KEEP ALL PRIVATE KEYS SECURE AND NEVER COMMIT TO VERSION CONTROL",
      recommendation:
        "Store keys in secure key management system (e.g., AWS KMS, HashiCorp Vault)",
      backup: "Create encrypted backups of all keys",
    },
  };

  fs.writeFileSync(infoPath, JSON.stringify(tokenInfo, null, 2));

  console.log(`✅ Saved detailed info to ${path.basename(infoPath)}`);

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ PLATFORM STABLECOIN CREATED SUCCESSFULLY!");
  console.log("=".repeat(60));
  console.log("\n📋 Token Details:");
  console.log(`   Token ID: ${tokenId.toString()}`);
  console.log(`   Name: ${TOKEN_NAME}`);
  console.log(`   Symbol: ${TOKEN_SYMBOL}`);
  console.log(`   Decimals: ${DECIMALS}`);
  console.log(`   Treasury: ${TREASURY_ID}`);

  console.log("\n🔑 Keys Generated:");
  console.log(
    `   Admin Key: ${adminKey.publicKey.toStringDer().substring(0, 20)}...`
  );
  console.log(
    `   Supply Key: ${supplyKey.publicKey.toStringDer().substring(0, 20)}...`
  );
  console.log(
    `   Freeze Key: ${freezeKey.publicKey.toStringDer().substring(0, 20)}...`
  );
  console.log(
    `   Wipe Key: ${wipeKey.publicKey.toStringDer().substring(0, 20)}...`
  );
  console.log(
    `   KYC Key: ${kycKey.publicKey.toStringDer().substring(0, 20)}...`
  );
  console.log(
    `   Pause Key: ${pauseKey.publicKey.toStringDer().substring(0, 20)}...`
  );
  console.log(
    `   Fee Schedule Key: ${feeScheduleKey.publicKey
      .toStringDer()
      .substring(0, 20)}...`
  );

  console.log("\n💾 Files Updated:");
  console.log(`   ✅ .env (environment variables)`);
  console.log(`   ✅ platform-stablecoin-info.json (detailed information)`);

  console.log("\n⚠️  SECURITY WARNING:");
  console.log("   - All private keys are saved in .env file");
  console.log("   - NEVER commit .env to version control");
  console.log("   - Store keys securely in production");
  console.log("   - Create encrypted backups");

  console.log("\n🎯 Next Steps:");
  console.log("   1. Verify token on HashScan:");
  console.log(`      https://hashscan.io/testnet/token/${tokenId.toString()}`);
  console.log(
    "   2. Update your application to use PLATFORM_STABLECOIN_TOKEN_ID"
  );
  console.log(
    "   3. Grant KYC to user accounts before they can receive tokens"
  );
  console.log("   4. Mint tokens as needed for wage advances");

  console.log("\n✨ Platform stablecoin is ready to use!");

  process.exit(0);
}

// Error handling
main().catch((error) => {
  console.error("\n❌ Error creating platform stablecoin:");
  console.error(error);
  process.exit(1);
});
