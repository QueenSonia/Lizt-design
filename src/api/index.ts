// This is the main API file.
// You can add your own API endpoints here.

import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Hello from the API!' });
}
