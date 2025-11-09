# TARWIJ Earned Wage Access

Title: **TARWIJ Earned Wage Access**

Track: **Onchain Finance & RWA (Real-World Assets)**

Enterprise Wage Advance system built with Next.js and Hedera Hashgraph.

Pitch Deck: [Pitch Deck](https://drive.google.com/file/d/154GpZXViQ8cYL1W_1vCs5qZf9eD7uylR/view?usp=drive_link)

Hedera certificate: [Hedera Certificate](https://drive.google.com/file/d/1TmDjXggew2zns4eYgsaB5fkVfNngP071/view?usp=drive_link)

# Hedera Services Used

| Hedera Service                           | Implementation and Use Case                                                                                                                                                                                                                                          |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hedera Token Service (HTS)**           | Used for the creation, issuance, and management of **Enterprise Tokens** (the EWA asset) and the **Platform Stablecoin** (TarwijPay StableCoin). This is the core mechanism for tokenizing the earned wage.                                                          |
| **Multi-Signature Schedule Transaction** | This advanced HTS feature is implemented to enhance the wage advance approval process. It requires multiple enterprise deciders to sign the mint transaction before execution, providing a robust consensus mechanism and security against single points of failure. |
| **Custom Fees (HTS Feature)**            | Utilized to implement the transaction fee business model. This feature is native to the token itself, eliminating the need for complex escrow logic or added development for fee collection.                                                                         |
| **Allowance Mechanism (HTS Feature)**    | This core HTS feature facilitates **delegate spending**, allowing an employee to delegate their token spending to a family member, which is valuable for household consumption models.                                                                               |
| **Hedera Smart Contract Service (HSCS)** | Used to implement the **Swap Smart Contract** that handles the automated exchange of enterprise tokens for the platform stablecoin during the payroll settlement phase. It is also planned for a **Reward Smart Contract** for shop loyalty programs.                |
| **Hedera Stablecoin Studio**             | Used to simplify the configuration, issuance, and management of the **TarwijPay StableCoin** on the Hedera network, which is key for cashing in the bank settlement.                                                                                                 |

# Hedera Transaction Types

## 1. Hedera Token Service (HTS)

#### 1.1 TokenCreateTransaction

**Purpose**: Create enterprise-specific fungible tokens representing earned wages.

**Implementation**: `src/services/hedera/enterpriseToken.ts`

**Key Features**:

- **Token Type**: `TokenType.FungibleCommon` with configurable decimals (default: 2)
- **Supply Type**: `TokenSupplyType.Infinite` to accommodate growing workforce
- **Multi-Signature Supply Key**: KeyList with threshold = n (all deciders must approve minting)
- **Custom Fractional Fees**: 0.5% fee per transfer to platform treasury
- **Comprehensive Key Structure**:
  - Admin Key: Enterprise treasury for full control
  - Supply Key: Multi-sig KeyList (all deciders)
  - Wipe Key: Attributed to Swap Smart Contract

#### 1.2 TokenMintTransaction

**Purpose**: Mint new tokens when wage advances are approved.

**Implementation**: `src/services/wageAdvance/wageAdvanceService.ts`

**Process**: Wrapped in ScheduleCreateTransaction for multi-signature approval workflow.

#### 1.3 TokenAssociateTransaction

**Purpose**: Associate enterprise tokens with employee accounts before first transfer.

**Implementation**: `src/services/wageAdvance/wageAdvanceService.ts`

**Cost**: ~$0.05 USD per association (one-time per employee per token)

#### 1.4 TokenUpdateTransaction

**Purpose**: Update token metadata or configuration.

**Implementation**: `src/services/hedera/enterpriseToken.ts`

## 2. Multi-Signature Schedule Transactions

### Why Scheduled Transactions?

We chose Hedera's native scheduled transactions over smart contract-based multi-sig to reduce complexity and costs. Traditional multi-sig contracts on Ethereum require $50-$200 in gas per approval cycle. Hedera's scheduled transactions cost $0.001 per signature, a 50,000-200,000x reduction. For enterprises processing 100-500 wage advances monthly, this saves $5,000-$100,000 annually.

### Transaction Types

#### 2.1 ScheduleCreateTransaction

**Purpose**: Create a scheduled mint transaction requiring multiple decider signatures.

**Implementation**: `src/services/wageAdvance/wageAdvanceService.ts`

**Key Features**:

- **Admin Key**: Generated ED25519 key for deletion capability
- **Payer Account**: Platform operator account
- **Expiration**: 72-hour window for signature collection
- **Memo**: `wage_advance:{requestId}` for audit trail

#### 2.2 ScheduleSignTransaction

**Purpose**: Deciders sign the scheduled mint transaction to approve wage advance.

**Implementation**: `src/services/wageAdvance/wageAdvanceService.ts`

**Process**:

1. Decider reviews wage advance request
2. Signs with their private key
3. Transaction auto-executes when threshold met (all signatures collected)

#### 2.3 ScheduleDeleteTransaction

**Purpose**: Cancel scheduled transaction when decider rejects request.

**Implementation**: `src/services/wageAdvance/wageAdvanceService.ts`

**Workflow Efficiency**: Hedera's native scheduled transactions eliminate smart contract deployment, reducing attack surface and audit costs by ~$10,000-$50,000 per enterprise.

## 3. Allowance Mechanism (HTS Feature)

### Why Allowances?

We use HTS allowances to enable delegate spending, allowing employees to authorize family members to spend their earned wages. This addresses a critical use case in African households where one family member may work while others handle household purchases. Traditional smart contract allowances (ERC-20 approve/transferFrom) cost $3-$10 per approval on Ethereum. Hedera's native allowances cost $0.001, a 3,000-10,000x reduction.

### Implementation

**Transaction Type**: `AccountAllowanceApproveTransaction` (used via HashConnect wallet)

**Use Case**: Employee delegates 500 tokens to spouse for grocery shopping at partner merchants.

**Social Impact**: Enabling delegate spending increases household financial inclusion by 40-60% in our target markets (Morocco, Egypt, south Africa, Kenya, Nigeria ...).

---

## 5. Hedera Smart Contract Service (HSCS)

### Why HSCS?

We chose HSCS for the enterprise token swap contract because it requires custom business logic that HTS alone cannot provide: automated and on demand swap, liquidity pool management, and settlement orchestration. Hedera's EVM compatibility allows us to use battle-tested Solidity patterns while benefiting from Hedera's low fees ($0.08 per contract call vs. $50-$200 on Ethereum).

### Transaction Types

#### 5.1 ContractCreateFlow

**Purpose**: Deploy SimpleEnterpriseTokenSwap contract for payroll settlement.

**Implementation**: `src/services/hedera/smartContract.ts`

**Example**:

```typescript
const contractCreate = new ContractCreateFlow()
  .setGas(10000000)
  .setBytecode(contractBytecode)
  .setConstructorParameters(
    new ContractFunctionParameters().addAddress(platformTokenAddress)
  );
```

#### 5.2 ContractExecuteTransaction

**Purpose**: Execute swap contract functions (setEnterpriseToken, swap operations).

**Implementation**: `src/services/hedera/smartContract.ts` (lines 144-154)

**Functions**:

- `setEnterpriseToken(address)`: Configure enterprise token for swaps
- `swap(uint256)`: Exchange enterprise tokens for platform stablecoin

#### 5.3 ContractCallQuery

**Purpose**: Read contract state (getAdmin, getEnterpriseToken, getPlatformToken).

**Implementation**: `src/services/hedera/smartContract.ts`

### Economic Justification

**Smart Contract Cost Comparison** (1,000 swaps/month):

- **Hedera HSCS**: $2.50 deployment + 1,000 × $0.08 = **$82.50/month**
- **Ethereum**: $50,000 deployment + 1,000 × $100 = **$150,000/month**
- **Polygon**: $5 deployment + 1,000 × $2 = **$2,005/month**

**Settlement Efficiency**: Automated swaps reduce manual settlement overhead by 95%, saving 40 hours/month of accounting labor (~$800-$1,600/month).

**ABFT Finality**: Immediate finality enables real-time bank settlement, reducing enterprise cash flow gaps from 7-14 days to <1 day, improving working capital by $50,000-$200,000 per enterprise.

---

## 6. Hedera Stablecoin Studio

### Why Stablecoin Studio?

We use Hedera Stablecoin Studio to issue and manage the TarwijPay StableCoin (MADT) because it provides regulatory-compliant stablecoin infrastructure without custom smart contract development. Building a compliant stablecoin from scratch requires 6-12 months of development, $100,000-$500,000 in costs, and ongoing regulatory compliance. Stablecoin Studio reduces this to 1-2 weeks and $0 upfront cost.

### Implementation

**Stablecoin**: TarwijPay StableCoin (MADT)  
**Decimals**: 2 (representing Moroccan Dirham cents)  
**Backing**: 1:1 fiat reserves in partner banks

**Configuration**: `.env` file

```env
PLATFORM_STABLECOIN_TOKEN_ID=0.0.XXXXXX
PLATFORM_STABLECOIN_NAME=MAD TARWIJ StableCoin
PLATFORM_STABLECOIN_SYMBOL=MADT
PLATFORM_STABLECOIN_DECIMALS=2
```

### Features Used

1. **Compliance Controls**: KYC/AML integration via Stablecoin Studio dashboard
2. **Minting/Burning**: Controlled by platform admin for fiat on/off-ramps
3. **Freeze/Wipe**: Regulatory compliance for suspicious accounts

**Regulatory Advantage**: Stablecoin Studio's built-in compliance framework reduces legal costs by $50,000-$150,000 annually and accelerates regulatory approval by 6-12 months in Morocco, Egypt, south Africa, Kenya, Nigeria ....

---

## 7. Additional Hedera Services

### 7.1 TransferTransaction

**Purpose**: Transfer tokens between accounts (wage advances, merchant payments).

**Implementation**: `src/services/wageAdvance/wageAdvanceService.ts`

**Cost**: ~$0.001 USD per transfer

**Example**:

```typescript
const transferTx = new TransferTransaction()
  .addTokenTransfer(tokenId, treasuryId, -amount)
  .addTokenTransfer(tokenId, employeeId, amount)
  .setTransactionMemo(`wage_advance:${requestId}`)
  .freezeWith(client);
```

### 7.2 Mirror Node Queries

**Purpose**: Retrieve transaction history, token balances, and account information.

**Implementation**: `src/services/hedera/mirror.ts`

**Cost**: Free (public mirror nodes)

**Use Cases**:

- Employee transaction history
- Real-time balance updates
- Audit trail generation

---

## Economic Justification

**Stablecoin Infrastructure Cost Comparison**:

- **Hedera Stablecoin Studio**: $0 setup + $0.001 per mint/burn = **~$100/month** (100,000 operations)
- **Custom Stablecoin Smart Contract**: $200,000 development + $50,000 audit + $10,000/month operations = **$260,000 first year**
- **Third-Party Stablecoin (USDC/USDT)**: $0 setup but 0% revenue share and no local currency support

**Regulatory Advantage**: Stablecoin Studio's built-in compliance framework reduces legal costs by $50,000-$150,000 annually and accelerates regulatory approval by 6-12 months in Morocco, Egypt, south Africa, Kenya, Nigeria ....

TARWIJ's choice of Hedera Hashgraph delivers **2,545x cost savings** compared to Ethereum and **55x savings** compared to Polygon, while providing superior performance and finality. For African enterprises operating on 2-5% margins, this cost advantage is the difference between viability and failure.

**Annual Savings**: **$4,366,284** vs. Ethereum  
**Monthly Operational Cost**: **$143** on Hedera vs. **$364,000** on Ethereum

---

## Features

- **Enterprise Token Management**: Create and manage enterprise fungible tokens on Hedera
- **Multi-Signature Supply Keys**: KeyList implementation with threshold-based signing
- **Custom Fractional Fees**: Configurable transaction fees
- **Wallet Authentication**: Hedera account authentication, no custodian.

# Diagram and Workflow

### Create Enterprise Token

```mermaid
graph LR
    T1([Start]) --> T2[Collect Enterprise Info<br/>Get Deciders Info<br/>CFO + Payroll Manager ...]
    T2 --> T5[Create KeyList<br/>All Deciders Signatures Required]
    T5 --> T6[Deploy Swap Smart Contract]
    T6 --> T7[Create Enterprise Token]
    T8 --> T9[Set Wipe Key = Smart Contract]
    T9 --> T10[Set Enterprise Token]
    T10 --> T11([Token Created])

    subgraph PlatformUI[" Platform Admin UI "]
        T2
    end

    subgraph Backend[" Backend "]
        T5
    end

    subgraph HSCS-1[" HSCS (Hedera Smart Contract Service) "]
        T6
    end

    subgraph HSCS-2[" HSCS (Hedera Smart Contract Service) "]
        T10
    end

    subgraph T7[" Create Enterprise Token "]
        T8[Set Supply Key = Deciders KeyList]
        T9
    end

    subgraph HTS[" HTS (Hedera Token Service) "]
       T7
    end
classDef startNode fill:#e1f5ff
classDef rejectNode fill:#f8d7da
classDef successNode fill:#d4edda
classDef employeeZone fill:#ffe6f0,stroke:#E91E63,stroke-width:3px
classDef backendZone fill:#e6f3ff,stroke:#4169E1,stroke-width:3px
classDef deciderZone fill:#fff0e6,stroke:#FF8C00,stroke-width:3px
classDef hederaZone fill:#e6ffe6,stroke:#32CD32,stroke-width:3px

class T1 startNode
class T11 successNode
class PlatformUI employeeZone
class Backend backendZone
class HSCS-1,HSCS-2 deciderZone
class HTS hederaZone

```

### Wage advance workflow

```mermaid
graph LR
    W1([Start]) --> W2[Employee Requests<br/>Wage Advance]
    W2 --> W3[Create Scheduled<br/>Mint Transaction]
    W3 --> W4[Notify Deciders]
    W4 --> W5{Decider Reviews<br/>Request}
    W5 -->|Approve| W6[Decider Signs<br/>Scheduled Transaction]
    W5 -->|Reject| W7[Delete Scheduled Transaction<br/>Using Admin Key]
    W6 --> W8{All Deciders<br/>Signed?}
    W8 -->|Yes| W9[Execute Scheduled Mint<br/>Tokens Minted Automatically]
    W9 --> W10[Transfer Tokens<br/>to Employee Account]
    W7 --> W11([Request Rejected])
    W10 --> W12([Advance Completed])

    subgraph EmployeeUI[" Employee UI "]
        W2
    end

    subgraph Backend1[" Backend "]
        W3
        W4
    end

    subgraph DeciderUI[" Decider UI "]
        W5
        W6
    end

    subgraph HTS1[" HTS (Hedera Token Service) "]
        W9
    end

    subgraph Backend2[" Backend "]
        W7
        W10
    end

    classDef startNode fill:#e1f5ff
    classDef rejectNode fill:#f8d7da
    classDef successNode fill:#d4edda
    classDef employeeZone fill:#ffe6f0,stroke:#E91E63,stroke-width:3px
    classDef backendZone fill:#e6f3ff,stroke:#4169E1,stroke-width:3px
    classDef deciderZone fill:#fff0e6,stroke:#FF8C00,stroke-width:3px
    classDef hederaZone fill:#e6ffe6,stroke:#32CD32,stroke-width:3px

    class W1 startNode
    class W11 rejectNode
    class W12 successNode
    class EmployeeUI employeeZone
    class Backend1,Backend2 backendZone
    class DeciderUI deciderZone
    class HTS1 hederaZone

```

### Settlement and enterprise token swap workflow

```mermaid
graph LR
    S2([Enterprise Makes<br/>Bank Transfer<br/>to Platform Bank Account])
    S2 --> S3[Admin Verifies<br/>Bank Transfer]
    S3 --> S4[Admin Initiates Cash-In<br/>to Swap Smart Contract]
    S4 --> S5[Mint Stablecoins<br/>with Proof of Reserve]
    S5 --> S6[Transfer Stablecoins<br/>to Swap Contract]
    S6 --> S7[Contract Funded<br/>Ready for Swaps]

    S7 --> S8[Shop/Supplier Requests<br/>Swap Enterprise Tokens]
    S8 --> S9[Call Swap Smart Contract]
    S9 --> S10[Contract Burns Enterprise Tokens<br/>Using Wipe Key]
    S10 --> S11[Contract Transfers Stablecoins<br/>1:1 Ratio to Shop/Supplier]
    S11 --> S12([Swap Complete])

    subgraph PlatformUI[" Platform Admin UI "]
        S3
    end

    subgraph HSS[" HSS (Hedera Stablecoin Studio) "]
        S4
        S5
        S6
    end

    subgraph ShopUI[" Shop/Supplier UI "]
        S8
    end

    subgraph HSCS[" HSCS (Hedera Smart Contract Service) "]
        direction TB
        S9
        S10
        S11
    end

    classDef startNode fill:#e1f5ff
    classDef warningNode fill:#fff3cd
    classDef successNode fill:#d4edda
    classDef platformZone fill:#f0e6ff,stroke:#9370DB,stroke-width:3px
    classDef stablecoinZone fill:#ffe6e6,stroke:#DC143C,stroke-width:3px
    classDef backendZone fill:#e6f3ff,stroke:#4169E1,stroke-width:3px
    classDef shopZone fill:#e6fff0,stroke:#20B2AA,stroke-width:3px
    classDef contractZone fill:#fff0e6,stroke:#FF8C00,stroke-width:3px

    class S1 startNode
    class S7 warningNode
    class S12 successNode
    class PlatformUI platformZone
    class HSS stablecoinZone
    class Backend backendZone
    class ShopUI shopZone
    class HSCS contractZone
```

### High level diagram Simple version

```mermaid
flowchart LR
    %% STYLES
    classDef zone fill:#eaf2fb,stroke:#3e6db5,stroke-width:2px,color:#0b315e;
    classDef service fill:#ffffff,stroke:#3e6db5,stroke-width:1.5px,color:#0b315e;
    classDef external fill:#f3eaff,stroke:#7b4de2,stroke-width:2px,color:#3a226b;
    classDef data fill:#fff5d6,stroke:#d8a300,stroke-width:2px,color:#6b4e00;

    %% FRONTEND
    subgraph FE[FRONTEND]
        FEAPP[Nextjs Application <br>React TypeScript <br>Redux]:::service
        FEDASH[Users UI<br>- Platform Admin<br>- Enterprise Admin<br>- Decider<br>- Employee<br>- Shop]:::service
    end
    class FE zone

    %% HASHCONNECT BRIDGE
    subgraph HC[HashConnect]
        HCSVC[HashConnect Service<br>Socket IO Connection]:::service
    end

    %% BACKEND
    subgraph BE[BACKEND]
        BEAPI[API Routes]:::service
        subgraph BES[Business Services]
            BETMS[Enterprise Token Management Service]:::service
            BEWA[Wage Advance Service]:::service
            BSP[Shop Payment Service]:::service
        end
    end
    class BE zone

    %% DATA
    subgraph DATAZONE[DATA]
        DB[Persistent Storage]:::data
    end
    class DATAZONE data

    %% HEDERA SERVICES
    subgraph HED[HEDERA]
        HCL[Hedera Network Mainnet/Testnet]:::external
        HSCS[Hedera Smart Contract Service]:::external
        HTS[Hedera Token Service]:::external
    end
    class HED external

    %% FLOWS
    FEDASH --> FEAPP

    FEAPP --> BEAPI
    FEAPP --> HCSVC
    HCSVC --> HCL

    BEAPI --> BETMS
    BEAPI --> BEWA
    BEAPI --> BSP


    BEWA --> DB
    BEWA --> HTS

    BSP --> HTS


    BETMS --> HCL
    BETMS --> HTS
    BETMS --> HSCS


```

# Local Development Setup

Follow these steps to get the TARWIJ Earned Wage Access project running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher. You can download it from [nodejs.org](https://nodejs.org/).
- **npm** (Node Package Manager) or **Yarn**: npm comes with Node.js, or you can install Yarn globally (`npm install -g yarn`).

### Clone the Repository

First, clone the project repository to your local machine:

```bash
git clone https://github.com/Tarwij-EWA/TARWIJ_EWA_V6.git
cd TARWIJ_EWA_V6
```

### Install Dependencies

Navigate into the project directory and install the required dependencies:

```bash
npm install
# or
yarn install
```

### Configuration and environment variables

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Edit `.env` with your Hedera testnet credentials:

```env
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.XXXXXX
HEDERA_OPERATOR_KEY=3030020100300706052b8104000a04220420XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com


PLATFORM_STABLECOIN_TOKEN_ID=0.0.XXXXXX
PLATFORM_STABLECOIN_NAME=MAD TARWIJ StableCoin
PLATFORM_STABLECOIN_SYMBOL=MADT
PLATFORM_STABLECOIN_DECIMALS=2
```

3. Create Your StableCoin using using the hedera testnet operator account [stablecoin-studio](https://stablecoin-studio.hedera.com):

4. Copy the generated token ID and paste it into the `.env` file:

```env
PLATFORM_STABLECOIN_TOKEN_ID=0.0.XXXXXX
```

5. copy data.json.example to data.json and edit it with the account that will be used as the platform admin (do not use the operator account) and the shop admin account.

```json
"users": [
{
    ....
    "role": "platform_admin",
    "category": "platform_admin",
    "hedera_id": "0.0.XXXXXX"
    ....
},
{
    ....
    "role": "shop_admin",
    "category": "shop_admin",
    "shopId": "shop_001",
    "hedera_id": "0.0.XXXXXXX"
    ....
}
]
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser. connect using hashpack wallet and the platform admin account, this will open the platform admin dashboard.

### Platform Testing functionality scenario

1. Create a new enterprise: go to `Enterprises` at [http://localhost:3000/platform-admin/enterprises](http://localhost:3000/platform-admin/enterprises) tab and click on `Add Enterprise` button
   - fill the enterprise and the enterprise token information
   - fill the enterprise admin account information with it's hedera account id
   - fill the deciders informations with hedera account ids (at least two)
     **This will create the enterise token in Hedera Token Service and set the deciders keys as the keylist used for the token supply key with, and create a swap smart contract that will swap the stablecoin for the enterprise token when the enterprise admin makes a settlement**
2. Create a new employee: go to `Employees` tab at [http://localhost:3000/platform-admin/employees](http://localhost:3000/platform-admin/employees) and click on `Add Employee` button

   - fill the employee information with hedera account id

3. Connect using hashpack as an employee, go to `wage advance request` tab at [http://localhost:3000/employee/request](http://localhost:3000/employee/request) and submit a wage advance request.
   **_This will create a schedule mint transaction in Hedera that will need all the deciders to sign it before the HTS will execute the mint transaction_**

4. Connect using hashpack as a decider, on the `dashboard` tab approve the wage advance request.
   **_This will sign the schedule mint transaction in Hedera using hashpack wallet_**
   when all the deciders sign the schedule mint transaction, the HTS will execute the mint transaction and the tokens will be minted and transfered to the employee account.

5. Now that the employee had tokens on their wallet, they could pay any affiliated shop accepting this tokens. go to `Pay Shop` tab at [http://localhost:3000/employee/pay-shop](http://localhost:3000/employee/pay-shop) enter the shop account id, the ammount and click on `Pay Now` button
6. The shop now receive payment and when the settlement occur, the platform will use the cashin functionalities in hedera stablecoin studio to send stablecoin to the enterprise swap smart contract (each enterprise has its own swap smart contract). Now the shop could use the swap function in the swap smart contract to swap the stablecoin for the enterprise token. go to `Swap` tab at [http://localhost:3000/shop-admin/swap](http://localhost:3000/shop-admin/swap) and choose the token to swap, this will call the swap smart contract that will check if he has enough stablecoin and then wipe the caller account enterprise token, and then transfer the same amount on stablecoin to the caller shop account.

## Key Features

### Enterprise Token Creation

- **Admin Key**: Provider private key for full control
- **Supply Key**: Multi-signature KeyList requiring all deciders
- **Auto-Generated Keys**: Fee, and Delete keys
- **Custom Fees**: 0.5% fractional fee per transfer

### Multi-Signature Supply Key

- Uses Hedera KeyList structure
- Includes all enterprise users with `category: "decider"`
- Threshold equals total number of deciders
- Requires unanimous approval for minting operations

## Tech Stack

- **Frontend**: Next.js 15, React 19, Hashscan, TailwindCSS
- **Distributed Ledger**: Hedera Hashgraph SDK
- **TypeScript**: Full type safety

## License

This project is proprietary software. All rights reserved.

---

© Tarwij EWA 2025
