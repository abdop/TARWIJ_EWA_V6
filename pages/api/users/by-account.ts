import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accountId } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: 'Account ID is required' });
  }

  try {
    // Read data.json
    const dataPath = path.join(process.cwd(), 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Find user by hedera_id
    const user = data.users.find((u: any) => u.hedera_id === accountId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error reading user data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
