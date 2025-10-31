import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserRepository, getDltOperationRepository } from '../../../src/repositories/RepositoryFactory';
import { dataService } from '../../../src/services/data/dataService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userRepo = getUserRepository();
  const dltOpRepo = getDltOperationRepository();

  if (req.method === 'POST') {
    const { shopAccountId, amount, memo } = req.body as {
      shopAccountId?: string;
      amount?: number;
      memo?: string;
    };

    if (!shopAccountId || !amount || amount <= 0) {
      return res.status(400).json({
        error: 'Missing required fields: shopAccountId, amount (>0)',
      });
    }

    try {
      const shopUser = await userRepo.findByHederaId(shopAccountId);
      if (!shopUser) {
        return res.status(404).json({ error: 'Shop user not found' });
      }
      if (shopUser.category !== 'shop_admin' && shopUser.category !== 'cashier') {
        return res.status(403).json({ error: 'Account is not authorized as a shop' });
      }

      const requestId = dataService.generateId('payment_req');
      const paymentRequest = {
        id: requestId,
        shopAccountId,
        shopName: shopUser.name,
        shopId: shopUser.id,
        amount,
        memo: memo || 'Shop purchase',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      };

      // Store in DLT operations for tracking
      await dltOpRepo.create({
        type: 'SHOP_PAYMENT_REQUEST_CREATED',
        status: 'PENDING',
        userId: shopUser.id,
        details: paymentRequest,
        createdAt: paymentRequest.createdAt,
        id: requestId,
      });

      const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/${requestId}`;

      return res.status(200).json({
        success: true,
        paymentRequest,
        paymentUrl,
      });
    } catch (error: any) {
      console.error('Error creating payment request:', error);
      return res.status(500).json({
        error: error.message || 'Failed to create payment request',
      });
    }
  }

  if (req.method === 'GET') {
    const { requestId } = req.query;

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'requestId is required' });
    }

    try {
      const operation = await dltOpRepo.findById(requestId);
      if (!operation || operation.type !== 'SHOP_PAYMENT_REQUEST_CREATED') {
        return res.status(404).json({ error: 'Payment request not found' });
      }

      return res.status(200).json({
        success: true,
        paymentRequest: operation.details,
      });
    } catch (error: any) {
      console.error('Error fetching payment request:', error);
      return res.status(500).json({
        error: error.message || 'Failed to fetch payment request',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
