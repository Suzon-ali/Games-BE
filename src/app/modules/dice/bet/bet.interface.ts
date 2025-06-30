export interface IBet {
  userAddress: string;
  betAmount: number;
  rollOver: number;
  clientSeed: string;
  nonce: number;

  serverSeed: string;
  serverSeedHash: string;

  result: {
    resultNumber: number;
    isWin: boolean;
    payout: number;
    profit: number;
    multiplier?: string;
    payoutToThePlayer?: string;
  };
}
