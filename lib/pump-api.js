import { CONFIG, poolUrl } from './config.js';

const LAMPORTS_PER_SOL = 1_000_000_000;
const GRADUATION_LAMPORTS = CONFIG.graduationSol * LAMPORTS_PER_SOL;

export function formatUsd(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  if (v >= 1) return `$${v.toFixed(0)}`;
  return '$0';
}

function inferPair(coin, pairOverrides = {}) {
  const mint = coin.mint;
  if (pairOverrides[mint]) return pairOverrides[mint];

  const quoteMint = coin.quote_mint;
  if (quoteMint === CONFIG.stableMints.USDC) return 'USDC';
  if (quoteMint === CONFIG.stableMints.USD1) return 'USD1';

  const haystack = `${coin.name || ''} ${coin.symbol || ''} ${coin.description || ''}`.toUpperCase();
  if (haystack.includes('USD1')) return 'USD1';
  if (haystack.includes('USDC')) return 'USDC';
  return 'USDC';
}

function curveProgress(coin) {
  const reserves = Number(coin.real_sol_reserves || coin.real_quote_reserves || 0);
  if (!reserves) {
    const mcap = Number(coin.usd_market_cap || 0);
    return Math.min(99, Math.round((mcap / CONFIG.graduationMcapUsd) * 100));
  }
  return Math.min(99, Math.round((reserves / GRADUATION_LAMPORTS) * 100));
}

function mapCoin(coin, pairOverrides = {}) {
  const mint = coin.mint;
  const pair = inferPair(coin, pairOverrides);
  const graduated = Boolean(coin.complete || coin.raydium_pool || coin.pump_swap_pool);
  const mcapUsd = Number(coin.usd_market_cap || 0);
  const progress = graduated ? 100 : curveProgress(coin);
  const solLocked = Number(coin.real_sol_reserves || coin.real_quote_reserves || 0) / LAMPORTS_PER_SOL;

  return {
    name: coin.name,
    symbol: coin.symbol,
    pair,
    progress,
    mcap: formatUsd(mcapUsd),
    mcapUsd,
    vol: formatUsd(0),
    solLocked,
    graduated,
    mint,
    image: coin.image_uri,
    description: coin.description,
    poolUrl: poolUrl(mint),
    raw: coin,
  };
}

export function computeStats(tokens, solPrice = 0) {
  const live = tokens.filter((t) => !String(t.mint).startsWith('local-'));
  const onCurve = live.filter((t) => !t.graduated);
  const graduated = live.filter((t) => t.graduated);
  const curveTvlUsd = onCurve.reduce(
    (sum, t) => sum + (t.solLocked || 0) * (solPrice || 0),
    0
  );

  return {
    launches: onCurve.length,
    volume: formatUsd(curveTvlUsd),
    graduated: graduated.length,
  };
}

async function pumpFetch(endpoint, params = {}) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${CONFIG.pumpApiUrl}/${endpoint}?${qs}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Pump API ${res.status}`);
  return res.json();
}

export async function fetchCoins({ limit = 24, offset = 0 } = {}) {
  const coins = await pumpFetch('coins', {
    offset: String(offset),
    limit: String(limit),
    sort: 'last_trade_timestamp',
    order: 'DESC',
    includeNsfw: 'false',
  });
  const pairOverrides = getPairOverrides();
  return coins.map((c) => mapCoin(c, pairOverrides));
}

export async function fetchSolPrice() {
  try {
    const data = await pumpFetch('sol-price');
    return Number(data.solPrice) || 0;
  } catch {
    return 0;
  }
}

export function getPairOverrides() {
  try {
    return JSON.parse(localStorage.getItem('stablepad_pairs') || '{}');
  } catch {
    return {};
  }
}

export function setPairOverride(mint, pair) {
  const overrides = getPairOverrides();
  overrides[mint] = pair;
  localStorage.setItem('stablepad_pairs', JSON.stringify(overrides));
}

export function saveLocalLaunch(token) {
  const launches = JSON.parse(localStorage.getItem('stablepad_launches') || '[]');
  launches.unshift({ ...token, launchedAt: Date.now() });
  localStorage.setItem('stablepad_launches', JSON.stringify(launches.slice(0, 50)));
}

export function getLocalLaunches() {
  try {
    return JSON.parse(localStorage.getItem('stablepad_launches') || '[]');
  } catch {
    return [];
  }
}