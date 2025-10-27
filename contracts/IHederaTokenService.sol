// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

/**
 * @title HederaResponseCodes
 * @notice Response codes for Hedera Token Service operations
 */
contract HederaResponseCodes {
    int32 internal constant SUCCESS = 22;
    int32 internal constant INVALID_TOKEN_ID = 23;
    int32 internal constant INVALID_ACCOUNT_ID = 24;
    int32 internal constant INSUFFICIENT_TOKEN_BALANCE = 25;
    int32 internal constant TOKEN_NOT_ASSOCIATED_TO_ACCOUNT = 26;
    int32 internal constant INVALID_SIGNATURE = 27;
}

/**
 * @title IHederaTokenService
 * @notice Interface for Hedera Token Service (HTS) system contract
 * @dev Precompiled contract at address 0x167
 */
interface IHederaTokenService {
    
    /**
     * @notice Mints tokens to the treasury account
     * @param token The token address
     * @param amount Amount to mint (with decimals)
     * @param metadata Optional metadata
     * @return responseCode The response code
     * @return newTotalSupply The new total supply
     * @return serialNumbers Array of serial numbers (for NFTs)
     */
    function mintToken(
        address token,
        uint64 amount,
        bytes[] memory metadata
    ) external returns (int32 responseCode, uint64 newTotalSupply, int64[] memory serialNumbers);
    
    /**
     * @notice Burns tokens from the treasury account
     * @param token The token address
     * @param amount Amount to burn (with decimals)
     * @param serialNumbers Serial numbers to burn (for NFTs)
     * @return responseCode The response code
     * @return newTotalSupply The new total supply
     */
    function burnToken(
        address token,
        uint64 amount,
        int64[] memory serialNumbers
    ) external returns (int32 responseCode, uint64 newTotalSupply);
    
    /**
     * @notice Associates a token with an account
     * @param account The account address
     * @param token The token address
     * @return responseCode The response code
     */
    function associateToken(
        address account,
        address token
    ) external returns (int32 responseCode);
    
    /**
     * @notice Transfers tokens between accounts
     * @param token The token address
     * @param from Sender address
     * @param to Receiver address
     * @param amount Amount to transfer
     * @return responseCode The response code
     */
    function transferToken(
        address token,
        address from,
        address to,
        int64 amount
    ) external returns (int32 responseCode);
    
    /**
     * @notice Transfers multiple tokens
     * @param tokenTransfers Array of token transfer structs
     * @return responseCode The response code
     */
    function cryptoTransfer(
        TokenTransferList[] memory tokenTransfers
    ) external returns (int32 responseCode);
    
    /**
     * @notice Grants KYC to an account for a token
     * @param token The token address
     * @param account The account address
     * @return responseCode The response code
     */
    function grantTokenKyc(
        address token,
        address account
    ) external returns (int32 responseCode);
    
    /**
     * @notice Revokes KYC from an account for a token
     * @param token The token address
     * @param account The account address
     * @return responseCode The response code
     */
    function revokeTokenKyc(
        address token,
        address account
    ) external returns (int32 responseCode);
    
    /**
     * @notice Freezes an account for a token
     * @param token The token address
     * @param account The account address
     * @return responseCode The response code
     */
    function freezeToken(
        address token,
        address account
    ) external returns (int32 responseCode);
    
    /**
     * @notice Unfreezes an account for a token
     * @param token The token address
     * @param account The account address
     * @return responseCode The response code
     */
    function unfreezeToken(
        address token,
        address account
    ) external returns (int32 responseCode);
    
    /**
     * @notice Wipes tokens from an account
     * @param token The token address
     * @param account The account address
     * @param amount Amount to wipe
     * @return responseCode The response code
     */
    function wipeTokenAccount(
        address token,
        address account,
        uint32 amount
    ) external returns (int32 responseCode);
    
    /**
     * @notice Gets token info
     * @param token The token address
     * @return responseCode The response code
     * @return tokenInfo The token information
     */
    function getTokenInfo(
        address token
    ) external returns (int32 responseCode, TokenInfo memory tokenInfo);
    
    /**
     * @notice Pauses a token
     * @param token The token address
     * @return responseCode The response code
     */
    function pauseToken(
        address token
    ) external returns (int32 responseCode);
    
    /**
     * @notice Unpauses a token
     * @param token The token address
     * @return responseCode The response code
     */
    function unpauseToken(
        address token
    ) external returns (int32 responseCode);
    
    // Structs
    
    struct TokenTransferList {
        address token;
        AccountAmount[] transfers;
        NftTransfer[] nftTransfers;
    }
    
    struct AccountAmount {
        address accountID;
        int64 amount;
    }
    
    struct NftTransfer {
        address senderAccountID;
        address receiverAccountID;
        int64 serialNumber;
    }
    
    struct TokenInfo {
        HederaToken token;
        uint64 totalSupply;
        bool deleted;
        bool defaultKycStatus;
        bool pauseStatus;
        FixedFee[] fixedFees;
        FractionalFee[] fractionalFees;
        RoyaltyFee[] royaltyFees;
        string ledgerId;
    }
    
    struct HederaToken {
        string name;
        string symbol;
        address treasury;
        string memo;
        bool tokenSupplyType;
        uint32 maxSupply;
        bool freezeDefault;
        TokenKey[] tokenKeys;
        Expiry expiry;
    }
    
    struct TokenKey {
        uint256 keyType;
        KeyValue key;
    }
    
    struct KeyValue {
        bool inheritAccountKey;
        address contractId;
        bytes ed25519;
        bytes ECDSA_secp256k1;
        address delegatableContractId;
    }
    
    struct Expiry {
        uint32 second;
        address autoRenewAccount;
        uint32 autoRenewPeriod;
    }
    
    struct FixedFee {
        uint32 amount;
        address tokenId;
        bool useHbarsForPayment;
        bool useCurrentTokenForPayment;
        address feeCollector;
    }
    
    struct FractionalFee {
        uint32 numerator;
        uint32 denominator;
        uint32 minimumAmount;
        uint32 maximumAmount;
        bool netOfTransfers;
        address feeCollector;
    }
    
    struct RoyaltyFee {
        uint32 numerator;
        uint32 denominator;
        uint32 amount;
        address tokenId;
        bool useHbarsForPayment;
        address feeCollector;
    }
}
