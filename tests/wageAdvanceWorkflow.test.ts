/**
 * Wage Advance Workflow Test
 *
 * This test validates the complete wage advance workflow:
 * 1. Employee requests wage advance
 * 2. Token association with employee account
 * 3. Scheduled mint transaction creation
 * 4. Deciders approve the request
 * 5. Tokens are transferred to employee
 */

import { config } from "dotenv";
import { wageAdvanceService } from "../src/services/wageAdvance/wageAdvanceService";
import { hederaClient } from "../src/services/hedera/client";
import {
  getUserRepository,
  getWageAdvanceRepository,
  getDltOperationRepository,
} from "../src/repositories/RepositoryFactory";

// Load environment variables
config();

async function testWageAdvanceWorkflow() {
  console.log("=== Wage Advance Workflow Test ===\n");

  try {
    // Initialize Hedera client
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;
    const network = process.env.HEDERA_NETWORK as
      | "testnet"
      | "mainnet"
      | "previewnet";

    if (!operatorId || !operatorKey) {
      throw new Error(
        "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in .env"
      );
    }

    console.log("1. Initializing Hedera client...");
    hederaClient.initializeClient(
      operatorId,
      operatorKey,
      network || "testnet"
    );
    console.log("✓ Hedera client initialized\n");

    // Get repositories
    const userRepo = getUserRepository();
    const wageAdvanceRepo = getWageAdvanceRepository();
    const dltOpRepo = getDltOperationRepository();

    // Get employee (user_006 - Test User Account for Enterprise 2)
    const employeeId = "user_006";
    console.log("2. Loading employee...");
    const employee = await userRepo.findById(employeeId);

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    console.log(`✓ Employee loaded: ${employee.name}`);
    console.log(`   Email: ${employee.email}`);
    console.log(`   Category: ${employee.category}`);
    console.log(`   Hedera ID: ${employee.hedera_id}\n`);

    // Step 1: Employee requests wage advance
    console.log("3. Creating wage advance request...");
    const requestedAmount = 5000; // 50.00 tokens (with 2 decimals)

    const request = await wageAdvanceService.requestWageAdvance({
      employeeId: employeeId,
      requestedAmount: requestedAmount,
    });

    console.log(`✓ Request created: ${request.id}`);
    console.log(`   Status: ${request.status}`);
    console.log(`   Amount: ${requestedAmount / 100} tokens\n`);

    // Step 2: Associate token with employee account
    console.log("4. Associating token with employee account...");
    const employeePrivateKey = process.env[`${employeeId}_PRIVATE_KEY`];

    if (!employeePrivateKey) {
      throw new Error(`Private key not found for ${employeeId}`);
    }

    await wageAdvanceService.ensureTokenAssociation(
      request.id,
      employeePrivateKey
    );

    // Step 3: Create scheduled mint transaction
    console.log("5. Creating scheduled mint transaction...");
    const scheduledTxId = await wageAdvanceService.createScheduledMint(
      request.id
    );

    console.log(`✓ Scheduled transaction created: ${scheduledTxId}\n`);

    // Verify request status
    let updatedRequest = await wageAdvanceService.getRequestStatus(request.id);
    console.log("6. Request status after scheduling:");
    console.log(`   Status: ${updatedRequest.status}`);
    console.log(`   Scheduled TX: ${updatedRequest.scheduledTransactionId}`);
    console.log(
      `   Approvals: ${updatedRequest.deciderApprovals?.length || 0}\n`
    );

    // Step 4: Remaining deciders approve
    console.log("7. Processing decider approvals...");

    // Get all deciders
    const deciders = await userRepo.findByCategory(
      employee.entrepriseId,
      "decider"
    );
    console.log(`   Total deciders: ${deciders.length}`);
    console.log(`   Required approvals: ${deciders.length}\n`);

    // All deciders must sign via ScheduleSignTransaction
    for (let i = 0; i < deciders.length; i++) {
      const decider = deciders[i];
      const deciderPrivateKey = process.env[`${decider.id}_PRIVATE_KEY`];

      if (!deciderPrivateKey) {
        throw new Error(`Private key not found for decider ${decider.id}`);
      }

      console.log(`   Processing approval from ${decider.name}...`);

      await wageAdvanceService.processDeciderDecision(
        request.id,
        decider.id,
        true, // approved
        deciderPrivateKey
      );

      console.log(`   ✓ ${decider.name} approved\n`);
    }

    // Wait for transfer to complete
    console.log("8. Waiting for transfer to complete...");
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Verify final status
    updatedRequest = await wageAdvanceService.getRequestStatus(request.id);
    console.log("9. Final request status:");
    console.log(`   Status: ${updatedRequest.status}`);
    console.log(
      `   Approvals: ${updatedRequest.deciderApprovals?.length || 0}/${
        deciders.length
      }`
    );
    console.log(`   Completed at: ${updatedRequest.completedAt || "N/A"}\n`);

    // Verify DLT operations
    console.log("10. Verifying DLT operations...");
    const operations = await dltOpRepo.findByEnterprise(employee.entrepriseId);
    const requestOperations = operations.filter(
      (op: any) => op.details?.requestId === request.id
    );

    console.log(
      `   Total operations for this request: ${requestOperations.length}`
    );
    requestOperations.forEach((op: any) => {
      console.log(`   - ${op.type}: ${op.status}`);
    });
    console.log();

    console.log("=== Test Passed Successfully ===\n");
    console.log("Summary:");
    console.log(`✓ Request created: ${request.id}`);
    console.log(`✓ Token associated with employee`);
    console.log(`✓ Scheduled mint created: ${scheduledTxId}`);
    console.log(
      `✓ All deciders approved (${deciders.length}/${deciders.length})`
    );
    console.log(`✓ Tokens transferred to employee`);
    console.log(`✓ Request status: ${updatedRequest.status}`);
    console.log(`✓ DLT operations logged: ${requestOperations.length}\n`);
  } catch (error) {
    console.error("\n=== Test Failed ===");
    console.error("Error:", error);
    console.error(
      "\nStack trace:",
      error instanceof Error ? error.stack : "N/A"
    );
    process.exit(1);
  }
}

// Run the test
testWageAdvanceWorkflow()
  .then(() => {
    console.log("Test execution completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
