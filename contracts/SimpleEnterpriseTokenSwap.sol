// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./IHederaTokenService.sol";

/**
 * @title SimpleEnterpriseTokenSwap
 * @dev Simple contract to swap enterprise tokens for platform stablecoins 1:1
 * @notice Deployed on Hedera Smart Contract Service
 */
contract SimpleEnterpriseTokenSwap is HederaResponseCodes {
    // Hedera Token Service precompiled contract
    IHederaTokenService internal constant HederaTokenService =
        IHederaTokenService(0x0000000000000000000000000000000000000167);

    // State variables
    address public admin;
    address public platformToken; // Platform stablecoin address
    address public enterpriseToken; // Enterprise token address

    // Events
    event TokensSwapped(
        address indexed account,
        uint256 amount,
        uint256 timestamp
    );
    event EnterpriseTokenSet(address indexed token);
    event TokenAssociated(address indexed token);

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    /**
     * @notice Constructor
     * @param _platformToken Address of the platform stablecoin
     */
    constructor(address _platformToken) {
        require(_platformToken != address(0), "Invalid platform token address");
        admin = msg.sender;
        platformToken = _platformToken;

        // Associate contract with platform token
        int responseCode = HederaTokenService.associateToken(
            address(this),
            _platformToken
        );
        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "Failed to associate with platform token"
        );

        emit TokenAssociated(_platformToken);
    }

    /**
     * @notice Set the enterprise token address (admin only)
     * @param _enterpriseToken Address of the enterprise token
     */
    function setEnterpriseToken(address _enterpriseToken) external onlyAdmin {
        require(
            _enterpriseToken != address(0),
            "Invalid enterprise token address"
        );

        // Associate contract with enterprise token
        int responseCode = HederaTokenService.associateToken(
            address(this),
            _enterpriseToken
        );
        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "Failed to associate with enterprise token"
        );

        enterpriseToken = _enterpriseToken;
        emit EnterpriseTokenSet(_enterpriseToken);
        emit TokenAssociated(_enterpriseToken);
    }

    /**
     * @notice Swap enterprise tokens for platform stablecoins
     * @dev 1:1 backed swap - burns enterprise tokens and transfers stablecoins
     * @param _amount Amount of tokens to swap
     */
    function swap(uint256 _amount) external returns (bool) {
        require(
            enterpriseToken != address(0),
            "Enterprise token not configured"
        );
        require(_amount > 0, "Amount must be greater than zero");

        // Check if contract has sufficient platform stablecoin balance
        uint256 contractBalance = getContractStablecoinBalance();
        require(
            contractBalance >= _amount,
            "Insufficient platform stablecoin in contract"
        );

        // Step 1: Wipe (burn) enterprise tokens from caller's account
        int responseCode = HederaTokenService.wipeTokenAccount(
            enterpriseToken,
            msg.sender,
            uint32(_amount)
        );
        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "Failed to wipe enterprise tokens"
        );

        // Step 2: Transfer platform stablecoins to caller
        responseCode = HederaTokenService.transferToken(
            platformToken,
            address(this),
            msg.sender,
            int64(uint64(_amount))
        );
        require(
            responseCode == HederaResponseCodes.SUCCESS,
            "Failed to transfer platform stablecoins"
        );

        emit TokensSwapped(msg.sender, _amount, block.timestamp);

        return true;
    }

    /**
     * @notice Get the contract's platform stablecoin balance
     * @return balance The balance of platform stablecoins held by this contract
     */
    function getContractStablecoinBalance() public view returns (uint256) {
        // Query the balance using ERC20 balanceOf function
        // HTS tokens automatically implement this interface
        (bool success, bytes memory data) = platformToken.staticcall(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }

        return 0;
    }

    /**
     * @notice Get the admin address
     * @return The address of the contract admin
     */
    function getAdmin() external view returns (address) {
        return admin;
    }

    /**
     * @notice Get the platform token address
     * @return The address of the platform stablecoin
     */
    function getPlatformToken() external view returns (address) {
        return platformToken;
    }

    /**
     * @notice Get the enterprise token address
     * @return The address of the enterprise token
     */
    function getEnterpriseToken() external view returns (address) {
        return enterpriseToken;
    }
}
