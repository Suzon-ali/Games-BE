import crypto from 'crypto';

export const calculateHash = (
  clientSeed: string,
  serverSeed: string,
  nonce: number
): string => {
  const message = `${clientSeed}:${nonce}`;
  return crypto
    .createHmac("sha256", serverSeed) // HMAC with serverSeed as key
    .update(message)
    .digest("hex");
};

export const getRollFromHash = (hash: string): number => {
  const hex = hash.slice(0, 8); // First 4 bytes = 32 bits
  const intValue = parseInt(hex, 16); // Convert hex to int
  const roll = (intValue % 10000) / 100; // 0.00 – 99.99
  return parseFloat(roll.toFixed(2));
};

//get rollfromseed


export const getRollFromSeed = (
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number => {
  const hash = calculateHash(clientSeed, serverSeed, nonce);
  return getRollFromHash(hash);
};
