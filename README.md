# TARWIJ EWA V5

Enterprise Wage Advance system built with Next.js and Hedera Hashgraph.

## Features

- **Enterprise Token Management**: Create and manage enterprise fungible tokens on Hedera
- **Multi-Signature Supply Keys**: KeyList implementation with threshold-based signing
- **Custom Fractional Fees**: Configurable transaction fees
- **Data-Driven Architecture**: JSON-based data source for enterprise and user management
- **Key Management**: Automated key generation and secure storage

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file with your Hedera credentials:

```env
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.XXXXXXX
HEDERA_OPERATOR_KEY=302e020100300506032b6570042204...

# User private keys (for deciders)
user_002_PRIVATE_KEY=302e020100300506032b6570042204...
user_003_PRIVATE_KEY=302e020100300506032b6570042204...
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Test Enterprise Token Creation

```bash
npm run test:token
```

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick start guide for token creation
- **[ENTERPRISE_TOKEN_GUIDE.md](ENTERPRISE_TOKEN_GUIDE.md)** - Complete implementation guide
- **[TOKEN_MANAGEMENT_GUIDE.md](TOKEN_MANAGEMENT_GUIDE.md)** - Token management operations
- **[WAGE_ADVANCE_GUIDE.md](WAGE_ADVANCE_GUIDE.md)** - Wage advance workflow guide
- **[REPOSITORY_ABSTRACTION_GUIDE.md](REPOSITORY_ABSTRACTION_GUIDE.md)** - Repository abstraction layer
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical summary
- **[tests/README.md](tests/README.md)** - Test documentation

## Project Structure

```
src/
├── repositories/                   # Data access abstraction layer
│   ├── IEnterpriseRepository.ts
│   ├── IUserRepository.ts
│   ├── IEnterpriseTokenRepository.ts
│   ├── IDltOperationRepository.ts
│   ├── RepositoryFactory.ts        # Factory for repository instances
│   └── implementations/
│       ├── JsonEnterpriseRepository.ts
│       ├── JsonUserRepository.ts
│       ├── JsonEnterpriseTokenRepository.ts
│       └── JsonDltOperationRepository.ts
├── services/
│   ├── data/
│   │   └── dataService.ts          # Data management with data.json
│   └── hedera/
│       ├── client.ts               # Hedera client configuration
│       ├── keyManagement.ts        # Key generation and management
│       └── enterpriseToken.ts      # Enterprise token operations
├── examples/
│   └── createTokenExample.ts       # Usage examples
└── app/
    └── page.tsx                    # Next.js home page
tests/
└── createEnterpriseToken.test.ts   # Token creation test
```

## Key Features

### Enterprise Token Creation

- **Admin Key**: Provider private key for full control
- **Supply Key**: Multi-signature KeyList requiring all deciders
- **Auto-Generated Keys**: Wipe, Fee, and Delete keys
- **Custom Fees**: 0.5% fractional fee per transfer
- **Data Persistence**: All data stored in data.json

### Multi-Signature Supply Key

- Uses Hedera KeyList structure
- Includes all enterprise users with `category: "decider"`
- Threshold equals total number of deciders
- Requires unanimous approval for minting operations

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Blockchain**: Hedera Hashgraph SDK
- **Data**: JSON-based data source
- **TypeScript**: Full type safety

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run test:token       # Test enterprise token creation
npm run test:pause       # Test token pause operation
npm run test:unpause     # Test token unpause operation
npm run test:wage-advance # Test wage advance approval workflow
npm run test:wage-reject  # Test wage advance rejection workflow
```

## Learn More

- [Hedera Documentation](https://docs.hedera.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Enterprise Token Guide](ENTERPRISE_TOKEN_GUIDE.md)

## License

Private project - TARWIJ EWA V5
