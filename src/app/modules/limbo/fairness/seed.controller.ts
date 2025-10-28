// src/modules/fairness/seed.controller.ts
import crypto from 'crypto';

// export const nextServerSeed = crypto.randomBytes(32).toString('hex');
// export const nextServerSeedHash = crypto
//   .createHash('sha256')
//   .update(nextServerSeed)
//   .digest('hex');



export const generateNewSeed = () => {
  const nextServerSeed = crypto.randomBytes(32).toString('hex');
  const nextServerSeedHash = crypto.createHash('sha256').update(nextServerSeed).digest('hex');
  return { nextServerSeed, nextServerSeedHash };
};



