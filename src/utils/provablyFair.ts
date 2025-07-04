import crypto from 'crypto';

/**
 * HMAC_SHA256-based roll generator
 * @returns number between 0.00 and 99.99
 */
export const getRollFromSeed = (
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number => {
  const hmac = crypto
    .createHmac('sha256', serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest('hex');

  // Use first 4 bytes (8 hex chars) to generate roll
  const intValue = parseInt(hmac.slice(0, 8), 16);
  const maxInt = 0xffffffff; // 2^32 - 1

  return parseFloat(((intValue / maxInt) * 100).toFixed(2));
};
