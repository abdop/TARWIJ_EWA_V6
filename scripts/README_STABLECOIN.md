# Platform Stablecoin Creation Script

## Overview

This script creates a fungible token (WAT - Wage Advance Token) that serves as the platform's stablecoin for wage advance operations.

## Features

The token is created with **all 7 possible Hedera token keys**:

1. **Admin Key** - Full control over the token, can update all other keys
2. **Supply Key** - Mint new tokens and burn existing tokens
3. **Freeze Key** - Freeze/unfreeze accounts from transferring tokens
4. **Wipe Key** - Wipe tokens from frozen accounts
5. **KYC Key** - Grant/revoke KYC status for accounts
6. **Pause Key** - Pause/unpause all token operations (emergency use)
7. **Fee Schedule Key** - Update custom fee schedules

## Token Specifications

- **Name:** TARWIJ Stablecoin
- **Symbol:** WAT (Wage Advance Token)
- **Type:** Fungible Common
- **Decimals:** 2 (for cents precision)
- **Initial Supply:** 0 (mint as needed)
- **Max Supply:** 1,000,000,000 (1 billion tokens = $10 million)
- **Supply Type:** Finite
- **Freeze Default:** false (accounts not frozen by default)

## Prerequisites

1. Node.js installed
2. `@hashgraph/sdk` package installed
3. Treasury account with HBAR for transaction fees
4. `.env` file with treasury credentials:
   ```
   HEDERA_TREASURY_ID=0.0.xxxxxxx
   HEDERA_TREASURY_KEY=302e...
   ```

## Installation

```bash
npm install @hashgraph/sdk dotenv
```

## Usage

### Run the Script

```bash
node scripts/createPlatformStablecoin.js
```

### What It Does

1. ✅ Connects to Hedera testnet
2. ✅ Generates 7 private keys (one for each token key type)
3. ✅ Creates the fungible token with all keys
4. ✅ Saves token ID and all keys to `.env` file
5. ✅ Creates `platform-stablecoin-info.json` with detailed information
6. ✅ Displays summary and next steps

### Output Files

#### `.env` (Updated)

New environment variables added:
```bash
# Platform Stablecoin Token (WAT - Wage Advance Token)
# Created: 2025-10-21T...
# Token ID: 0.0.xxxxxxx
PLATFORM_STABLECOIN_TOKEN_ID=0.0.xxxxxxx
PLATFORM_STABLECOIN_NAME=TARWIJ Stablecoin
PLATFORM_STABLECOIN_SYMBOL=WAT
PLATFORM_STABLECOIN_DECIMALS=2
PLATFORM_STABLECOIN_ADMIN_KEY=302e...
PLATFORM_STABLECOIN_SUPPLY_KEY=302e...
PLATFORM_STABLECOIN_FREEZE_KEY=302e...
PLATFORM_STABLECOIN_WIPE_KEY=302e...
PLATFORM_STABLECOIN_KYC_KEY=302e...
PLATFORM_STABLECOIN_PAUSE_KEY=302e...
PLATFORM_STABLECOIN_FEE_SCHEDULE_KEY=302e...
```

#### `platform-stablecoin-info.json`

Detailed JSON file with:
- Token information
- All public and private keys
- Key descriptions
- Usage examples
- Security recommendations

## Key Usage Guide

### 1. Admin Key
**Purpose:** Full control over the token

**Use Cases:**
- Update any other key
- Change token properties
- Emergency recovery

**Example:**
```javascript
const adminKey = PrivateKey.fromStringDer(process.env.PLATFORM_STABLECOIN_ADMIN_KEY);
```

### 2. Supply Key
**Purpose:** Mint and burn tokens

**Use Cases:**
- Mint tokens for approved wage advances
- Burn tokens when repaid
- Adjust circulating supply

**Example:**
```javascript
const supplyKey = PrivateKey.fromStringDer(process.env.PLATFORM_STABLECOIN_SUPPLY_KEY);

// Mint 1000 tokens (100.00 dollars)
const mintTx = await new TokenMintTransaction()
  .setTokenId(tokenId)
  .setAmount(100000) // 1000.00 with 2 decimals
  .freezeWith(client)
  .sign(supplyKey);
```

### 3. Freeze Key
**Purpose:** Freeze/unfreeze accounts

**Use Cases:**
- Freeze suspicious accounts
- Prevent unauthorized transfers
- Compliance requirements

**Example:**
```javascript
const freezeKey = PrivateKey.fromStringDer(process.env.PLATFORM_STABLECOIN_FREEZE_KEY);

// Freeze an account
const freezeTx = await new TokenFreezeTransaction()
  .setTokenId(tokenId)
  .setAccountId(suspiciousAccount)
  .freezeWith(client)
  .sign(freezeKey);
```

### 4. Wipe Key
**Purpose:** Wipe tokens from accounts

**Use Cases:**
- Remove tokens from frozen accounts
- Compliance actions
- Error correction

**Example:**
```javascript
const wipeKey = PrivateKey.fromStringDer(process.env.PLATFORM_STABLECOIN_WIPE_KEY);

// Wipe tokens from account
const wipeTx = await new TokenWipeTransaction()
  .setTokenId(tokenId)
  .setAccountId(accountToWipe)
  .setAmount(50000) // 500.00 tokens
  .freezeWith(client)
  .sign(wipeKey);
```

### 5. KYC Key
**Purpose:** Grant/revoke KYC status

**Use Cases:**
- Grant KYC to verified users
- Revoke KYC from non-compliant users
- Compliance management

**Example:**
```javascript
const kycKey = PrivateKey.fromStringDer(process.env.PLATFORM_STABLECOIN_KYC_KEY);

// Grant KYC to user
const kycTx = await new TokenGrantKycTransaction()
  .setTokenId(tokenId)
  .setAccountId(userAccount)
  .freezeWith(client)
  .sign(kycKey);
```

### 6. Pause Key
**Purpose:** Pause/unpause token operations

**Use Cases:**
- Emergency situations
- Security incidents
- Maintenance windows

**Example:**
```javascript
const pauseKey = PrivateKey.fromStringDer(process.env.PLATFORM_STABLECOIN_PAUSE_KEY);

// Pause token
const pauseTx = await new TokenPauseTransaction()
  .setTokenId(tokenId)
  .freezeWith(client)
  .sign(pauseKey);

// Unpause token
const unpauseTx = await new TokenUnpauseTransaction()
  .setTokenId(tokenId)
  .freezeWith(client)
  .sign(pauseKey);
```

### 7. Fee Schedule Key
**Purpose:** Update custom fees

**Use Cases:**
- Add transaction fees
- Update fee structures
- Revenue generation

**Example:**
```javascript
const feeScheduleKey = PrivateKey.fromStringDer(process.env.PLATFORM_STABLECOIN_FEE_SCHEDULE_KEY);

// Update fee schedule
const feeUpdateTx = await new TokenFeeScheduleUpdateTransaction()
  .setTokenId(tokenId)
  .setCustomFees([...])
  .freezeWith(client)
  .sign(feeScheduleKey);
```

## Workflow Integration

### Wage Advance Flow with Platform Stablecoin

```
1. Employee requests wage advance
   ↓
2. Deciders approve request
   ↓
3. Backend mints WAT tokens (using Supply Key)
   ↓
4. Grant KYC to employee if needed (using KYC Key)
   ↓
5. Transfer WAT tokens to employee
   ↓
6. Employee receives wage advance
   ↓
7. On payday, tokens are burned (using Supply Key)
```

## Security Best Practices

### ⚠️ CRITICAL SECURITY WARNINGS

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Store keys securely**
   - Use AWS KMS, HashiCorp Vault, or similar
   - Encrypt keys at rest
   - Rotate keys periodically

3. **Limit key access**
   - Only authorized personnel
   - Use role-based access control
   - Audit key usage

4. **Create backups**
   - Encrypted backups of all keys
   - Store in multiple secure locations
   - Test recovery procedures

5. **Monitor token operations**
   - Log all key usage
   - Set up alerts for suspicious activity
   - Regular security audits

## Verification

After running the script, verify the token on HashScan:

```
https://hashscan.io/testnet/token/{TOKEN_ID}
```

Check:
- ✅ Token name and symbol
- ✅ Decimals and supply
- ✅ All 7 keys are set
- ✅ Treasury account
- ✅ Token memo

## Troubleshooting

### Error: "Missing HEDERA_TREASURY_ID or HEDERA_TREASURY_KEY"

**Solution:** Ensure `.env` file has:
```
HEDERA_TREASURY_ID=0.0.xxxxxxx
HEDERA_TREASURY_KEY=302e...
```

### Error: "Insufficient balance"

**Solution:** Treasury account needs HBAR for:
- Token creation fee (~$1)
- Transaction fees

Fund the treasury account with at least 10 HBAR.

### Error: "Invalid private key format"

**Solution:** Ensure treasury key is in DER format (starts with `302e`)

## Next Steps After Creation

1. **Verify Token**
   - Check on HashScan
   - Verify all keys are set
   - Test token operations

2. **Update Application**
   - Use `PLATFORM_STABLECOIN_TOKEN_ID` in your app
   - Implement minting logic
   - Implement KYC granting

3. **Test Operations**
   - Mint test tokens
   - Grant KYC to test accounts
   - Transfer tokens
   - Burn tokens

4. **Production Deployment**
   - Secure all keys
   - Set up monitoring
   - Document procedures
   - Train operators

## Cost Estimate

- **Token Creation:** ~$1 USD (one-time)
- **Mint Transaction:** ~$0.001 USD per mint
- **Transfer:** ~$0.001 USD per transfer
- **KYC Grant:** ~$0.001 USD per account

## Support

For issues or questions:
1. Check Hedera documentation: https://docs.hedera.com
2. Review token creation guide: https://docs.hedera.com/guides/docs/sdks/tokens
3. Check HashScan for transaction details

## License

MIT License - See LICENSE file for details
