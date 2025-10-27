/**
 * Email Notification Service
 * Placeholder for email functionality - will be implemented later
 */

export interface EmailNotification {
  to: string[];
  subject: string;
  body: string;
  type: "wage_advance_request" | "wage_advance_approved" | "wage_advance_rejected" | "wage_advance_completed";
}

export class EmailService {
  /**
   * Send email to deciders for wage advance approval
   */
  async notifyDecidersForApproval(
    deciderEmails: string[],
    employeeName: string,
    requestedAmount: number,
    requestId: string,
    scheduledTransactionId: string
  ): Promise<void> {
    console.log("=== EMAIL NOTIFICATION ===");
    console.log("To:", deciderEmails.join(", "));
    console.log("Subject: Wage Advance Request Requires Your Approval");
    console.log("Body:");
    console.log(`
      Dear Decider,

      A new wage advance request has been submitted and requires your approval.

      Employee: ${employeeName}
      Requested Amount: ${requestedAmount} tokens
      Request ID: ${requestId}
      Scheduled Transaction ID: ${scheduledTransactionId}

      Please review and approve or reject this request within 72 hours.

      Best regards,
      Wage Advance System
    `);
    console.log("=========================\n");

    // TODO: Implement actual email sending
    // await emailProvider.send({
    //   to: deciderEmails,
    //   subject: "Wage Advance Request Requires Your Approval",
    //   body: emailBody,
    // });
  }

  /**
   * Notify employee that request was approved
   */
  async notifyEmployeeApproved(
    employeeEmail: string,
    employeeName: string,
    amount: number,
    requestId: string
  ): Promise<void> {
    console.log("=== EMAIL NOTIFICATION ===");
    console.log("To:", employeeEmail);
    console.log("Subject: Your Wage Advance Request Has Been Approved");
    console.log("Body:");
    console.log(`
      Dear ${employeeName},

      Great news! Your wage advance request has been approved.

      Amount: ${amount} tokens
      Request ID: ${requestId}

      The tokens have been transferred to your account.

      Best regards,
      Wage Advance System
    `);
    console.log("=========================\n");

    // TODO: Implement actual email sending
  }

  /**
   * Notify employee that request was rejected
   */
  async notifyEmployeeRejected(
    employeeEmail: string,
    employeeName: string,
    amount: number,
    requestId: string,
    rejectedBy: string,
    reason?: string
  ): Promise<void> {
    console.log("=== EMAIL NOTIFICATION ===");
    console.log("To:", employeeEmail);
    console.log("Subject: Your Wage Advance Request Has Been Rejected");
    console.log("Body:");
    console.log(`
      Dear ${employeeName},

      Unfortunately, your wage advance request has been rejected.

      Amount: ${amount} tokens
      Request ID: ${requestId}
      Rejected by: ${rejectedBy}
      ${reason ? `Reason: ${reason}` : ""}

      Please contact your manager for more information.

      Best regards,
      Wage Advance System
    `);
    console.log("=========================\n");

    // TODO: Implement actual email sending
  }

  /**
   * Notify employee that tokens have been transferred
   */
  async notifyEmployeeTransferCompleted(
    employeeEmail: string,
    employeeName: string,
    amount: number,
    transactionId: string
  ): Promise<void> {
    console.log("=== EMAIL NOTIFICATION ===");
    console.log("To:", employeeEmail);
    console.log("Subject: Wage Advance Tokens Transferred");
    console.log("Body:");
    console.log(`
      Dear ${employeeName},

      Your wage advance tokens have been successfully transferred to your account.

      Amount: ${amount} tokens
      Transaction ID: ${transactionId}

      You can now use these tokens.

      Best regards,
      Wage Advance System
    `);
    console.log("=========================\n");

    // TODO: Implement actual email sending
  }
}

export const emailService = new EmailService();
