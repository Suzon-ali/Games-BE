// src/modules/fairness/seed.controller.ts
import crypto from 'crypto';
import { Request, Response } from 'express'; 

const nextServerSeed = crypto.randomBytes(32).toString('hex');
const nextServerSeedHash = crypto.createHash('sha256').update(nextServerSeed).digest('hex');

export const getNextSeedHash = async (req: Request, res: Response) => {
  res.json({ serverSeedHash: nextServerSeedHash });
};

