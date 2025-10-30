/**
 * One-time script to fix stuck shop payments
 * Run with: npx ts-node scripts/fix-stuck-payments.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const dataPath = path.join(process.cwd(), 'data.json');

async function fixStuckPayments() {
  console.log('Reading data.json...');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(rawData);

  const stuckPayments = data.dlt_operations.filter(
    (op: any) =>
      op.type === 'SHOP_ACCEPT_TOKEN_PREPARED' &&
      op.status === 'PENDING_SIGNATURE' &&
      op.details?.employeeAccountId === '0.0.7035523'
  );

  console.log(`Found ${stuckPayments.length} stuck payments for employee 0.0.7035523`);

  stuckPayments.forEach((op: any) => {
    console.log(`  - ${op.id}: ${op.details.amount} units (${op.details.amount / 100} IVA)`);
    op.status = 'SUCCESS';
    op.completedAt = new Date().toISOString();
    op.details.message = 'Payment confirmed (manually fixed)';
  });

  console.log('\nWriting updated data.json...');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

  console.log('✅ Done! Stuck payments have been marked as SUCCESS.');
  console.log('The employee wallet will now show the correct balance.');
}

fixStuckPayments().catch(console.error);
