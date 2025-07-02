export interface IBet {
  userAddress: string;
  betAmount: number;
  rollTarget: number;
  clientSeed: string;
  nonce: number;
  userName: string;
  gameName: string;
  serverSeed: string;
  serverSeedHash: string;
  condition: 'over' | 'under';

  result: {
    resultNumber: number;
    isWin: boolean;
    payout: number;
    profit: number;
    multiplier?: string;
    payoutToThePlayer?: string;
  };
}
