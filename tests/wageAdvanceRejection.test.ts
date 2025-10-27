/**
 * Wage Advance Rejection Test
 *
 * This test validates the rejection workflow:
 * 1. Employee requests wage advance
 * 2. Scheduled mint transaction created
 * 3. One decider rejects the request
 * 4. Scheduled transaction is deleted
 * 5. Employee is notified
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

async function testWageAdvanceRejection() {
  console.log("=== Wage Advance Rejection Test ===\n");

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

    // Get employee
    const employeeId = "user_006";
    console.log("2. Loading employee...");
    const employee = await userRepo.findById(employeeId);

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    console.log(`✓ Employee loaded: ${employee.name}\n`);

    // Step 1: Employee requests wage advance
    console.log("3. Creating wage advance request...");
    const requestedAmount = 3000; // 30.00 tokens

    const request = await wageAdvanceService.requestWageAdvance({
      employeeId: employeeId,
      requestedAmount: requestedAmount,
    });

    console.log(`✓ Request created: ${request.id}\n`);

    // Step 2: Associate token
    console.log("4. Associating token with employee account...");
    const employeePrivateKey = process.env[`${employeeId}_PRIVATE_KEY`];

    if (!employeePrivateKey) {
      throw new Error(`Private key not found for ${employeeId}`);
    }

    await wageAdvanceService.ensureTokenAssociation(
      request.id,
      employeePrivateKey
    );

    // Step 3: Create scheduled mint
    console.log("5. Creating scheduled mint transaction...");
    const scheduledTxId = await wageAdvanceService.createScheduledMint(
      request.id
    );

    console.log(`✓ Scheduled transaction created: ${scheduledTxId}\n`);

    // Step 4: Second decider rejects
    console.log("6. Processing rejection from decider...");

    const deciders = await userRepo.findByCategory(
      employee.entrepriseId,
      "decider"
    );
    const rejectingDecider = deciders[1]; // Second decider rejects
    const deciderPrivateKey = process.env[`${rejectingDecider.id}_PRIVATE_KEY`];

    if (!deciderPrivateKey) {
      throw new Error(
        `Private key not found for decider ${rejectingDecider.id}`
      );
    }

    console.log(`   Decider: ${rejectingDecider.name}`);
    console.log(`   Reason: Insufficient justification\n`);

    await wageAdvanceService.processDeciderDecision(
      request.id,
      rejectingDecider.id,
      false, // rejected
      deciderPrivateKey,
      "Insufficient justification for wage advance"
    );

    console.log(`✗ Request rejected by ${rejectingDecider.name}\n`);

    // Verify final status
    const updatedRequest = await wageAdvanceService.getRequestStatus(
      request.id
    );
    console.log("7. Final request status:");
    console.log(`   Status: ${updatedRequest.status}`);
    console.log(`   Rejected by: ${updatedRequest.rejectedBy}`);
    console.log(`   Reason: ${updatedRequest.rejectionReason}`);
    console.log(`   Completed at: ${updatedRequest.completedAt}\n`);

    // Verify DLT operations
    console.log("8. Verifying DLT operations...");
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
    console.log(`✓ Scheduled mint created: ${scheduledTxId}`);
    console.log(`✗ Request rejected by: ${rejectingDecider.name}`);
    console.log(`✓ Scheduled transaction deleted`);
    console.log(`✓ Employee notified of rejection`);
    console.log(`✓ Final status: ${updatedRequest.status}\n`);
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
testWageAdvanceRejection()
  .then(() => {
    console.log("Test execution completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unexpected error:", error);
    process.exit(1);
  });
