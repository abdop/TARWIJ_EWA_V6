# Enterprise Token Tests

This directory contains tests for the enterprise token creation functionality.

## Test: Create Enterprise Token

**File:** `createEnterpriseToken.test.ts`

### Purpose
Validates the creation of an enterprise fungible token for Innovate Analytics (ent_002) with the following specifications:

### Token Configuration
- **Admin Key**: Provider private key (from HEDERA_OPERATOR_KEY)
- **Treasury**: Operator account (HEDERA_OPERATOR_ID)
- **Decimals**: 2
- **Initial Supply**: 0
- **Max Supply**: Infinite (no limit)
- **Token Type**: Fungible

### Key Management
1. **Wipe Key**: Auto-generated and stored in data.json
2. **Fee Key**: Auto-generated and stored in data.json
3. **Delete Key**: Auto-generated and stored in data.json
4. **Supply Key**: KeyList with all enterprise users having `category: "decider"`
   - Threshold: n (total number of deciders)
   - Requires all deciders to sign for minting operations

### Custom Fee
- **Type**: Fractional Fee
- **Numerator**: 5
- **Denominator**: 1000
- **Rate**: 0.5% (5/1000)
- **Fee Collector**: Operator account
- **All Collectors Exempt**: true

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure `.env` file contains:
   - `HEDERA_NETWORK=testnet`
   - `HEDERA_OPERATOR_ID=<your-operator-id>`
   - `HEDERA_OPERATOR_KEY=<your-operator-key>`
   - Private keys for all decider users (e.g., `user_002_PRIVATE_KEY`, `user_003_PRIVATE_KEY`, etc.)

3. Ensure `data.json` contains:
   - Enterprise data for ent_002 (Innovate Analytics)
   - User data with at least one user having `category: "decider"` for ent_002

## Running the Test

```bash
npm run test:token
```

## Expected Output

The test will:
1. Initialize Hedera client
2. Load enterprise data (Innovate Analytics)
3. Load all decider users for the enterprise
4. Check if token already exists
5. Create the token with specified configuration
6. Generate and store wipe, fee, and delete keys
7. Configure supply key with KeyList of all deciders
8. Save token data to data.json
9. Create DLT operation record
10. Verify all data is correctly stored

## Success Criteria

- ✓ Token created on Hedera testnet
- ✓ Token ID returned and saved
- ✓ All keys generated and stored
- ✓ Supply key configured with correct threshold
- ✓ Custom fractional fee applied
- ✓ Data saved to data.json
- ✓ DLT operation recorded

## Data Storage

After successful execution, the following data is stored in `data.json`:

### `entreprise_tokens` array
```json
{
  "entrepriseId": "ent_002",
  "tokenId": "0.0.XXXXXXX",
  "symbol": "IVA",
  "name": "Innovate Analytics",
  "totalSupply": "0",
  "decimals": 2,
  "treasuryAccountId": "<operator-id>",
  "adminAccountId": "<operator-id>",
  "feeCollectorAccountId": "<operator-id>",
  "fractionalFee": 0.005,
  "wipeKey": "<generated-private-key>",
  "feeKey": "<generated-private-key>",
  "deleteKey": "<generated-private-key>",
  "supplyKeyList": ["<public-key-1>", "<public-key-2>", ...],
  "supplyKeyThreshold": 3,
  "createdAt": "2025-10-18T...",
  "transactionId": "0.0.XXXXXXX@...",
  "id": "token_..."
}
```

### `dlt_operations` array
```json
{
  "type": "TOKEN_CREATE",
  "status": "SUCCESS",
  "userId": "<operator-id>",
  "entrepriseId": "ent_002",
  "tokenId": "0.0.XXXXXXX",
  "details": { ... },
  "createdAt": "2025-10-18T...",
  "id": "dlt_...",
  "transactionId": "0.0.XXXXXXX@...",
  "completedAt": "2025-10-18T..."
}
```

## Troubleshooting

### Error: "No decider users found"
- Ensure data.json has users with `category: "decider"` for enterprise ent_002

### Error: "Private key not found for user"
- Add the missing private key to .env file (e.g., `user_002_PRIVATE_KEY=...`)

### Error: "Token already exists"
- The test checks for existing tokens and will not create duplicates
- Remove the existing token from data.json if you want to test creation again

### Error: "Hedera client initialization failed"
- Verify HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in .env
- Ensure the operator account has sufficient HBAR balance
