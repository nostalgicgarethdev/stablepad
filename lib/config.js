function resolvePumpApiUrl() {
  if (typeof window === 'undefined') return '/api';
  const { hostname } = window.location;
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.vercel.app') ||
    hostname === 'stablepad.fun'
  ) {
    return '/api';
  }
  // GitHub Pages and other static hosts use the Vercel API proxy
  return 'https://stablepad.vercel.app/api';
}

export const CONFIG = {
  name: 'Stablepad',
  domain: 'stablepad.fun',
  tokenSymbol: 'STABLEPAD',
  pumpProgramId: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P',
  pumpApiUrl: resolvePumpApiUrl(),
  graduationSol: 85,
  graduationMcapUsd: 69000,
  referenceRepo: 'https://github.com/staccDOTsol/pumprecovery',
  stableMints: {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USD1: 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB',
  },
  rpcUrl: 'https://api.mainnet-beta.solana.com',
};

export function poolUrl(mint) {
  return `https://pump.fun/coin/${mint}`;
}

export function solscanUrl(address) {
  return `https://solscan.io/token/${address}`;
}