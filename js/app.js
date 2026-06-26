import { CONFIG, poolUrl } from '../lib/config.js';
import { toggleWallet, getWalletState, shortAddress } from '../lib/wallet.js';
import {
  fetchCoins,
  fetchSolPrice,
  computeStats,
  getLocalLaunches,
  saveLocalLaunch,
  setPairOverride,
} from '../lib/pump-api.js';

let selectedPair = 'USD1';
let activeFilter = 'all';
let activeToken = null;
let tradeSide = 'buy';
let tokens = [];
let loading = true;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

function avatarColor(symbol) {
  const colors = ['#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#22c55e', '#38bdf8'];
  return colors[(symbol?.charCodeAt(0) || 0) % colors.length];
}

function setStatLoading() {
  $('#stat-launches').textContent = '…';
  $('#stat-volume').textContent = '…';
  $('#stat-graduated').textContent = '…';
}

function updateStats(liveTokens, solPrice) {
  const stats = computeStats(liveTokens, solPrice);
  $('#stat-launches').textContent = String(stats.launches);
  $('#stat-volume').textContent = stats.volume;
  $('#stat-graduated').textContent = String(stats.graduated);
}

async function loadTokens() {
  loading = true;
  setStatLoading();
  renderTokens();

  try {
    const [live, solPrice] = await Promise.all([
      fetchCoins({ limit: 48 }),
      fetchSolPrice(),
    ]);

    const local = getLocalLaunches().map((t) => ({
      ...t,
      color: avatarColor(t.symbol),
      poolUrl: t.mint ? poolUrl(t.mint) : undefined,
      mcapUsd: 0,
      solLocked: 0,
    }));

    tokens = [...local, ...live];
    updateStats(tokens, solPrice);
  } catch (err) {
    console.warn('Pump API unavailable', err);
    tokens = getLocalLaunches().map((t) => ({
      ...t,
      color: avatarColor(t.symbol),
      poolUrl: t.mint ? poolUrl(t.mint) : undefined,
      mcapUsd: 0,
      solLocked: 0,
    }));
    $('#stat-launches').textContent = tokens.length ? String(tokens.length) : '—';
    $('#stat-volume').textContent = '—';
    $('#stat-graduated').textContent = '—';
    showToast('Live feed unavailable — try again shortly');
  } finally {
    loading = false;
    renderTokens();
  }
}

function renderTokens() {
  const grid = $('#token-grid');

  if (loading) {
    grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center">Loading live tokens…</p>';
    return;
  }

  const filtered = tokens.filter((t) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'graduated') return t.graduated;
    if (activeFilter === 'curve') return !t.graduated;
    return t.pair === activeFilter;
  });

  if (!filtered.length) {
    grid.innerHTML = '<p style="color:var(--muted);grid-column:1/-1;text-align:center">No tokens match this filter.</p>';
    return;
  }

  grid.innerHTML = filtered.map((t) => `
    <div class="token-card ${t.graduated ? 'graduated' : ''}" data-mint="${t.mint}">
      <div class="token-top">
        <div class="token-avatar" style="background:${(t.color || avatarColor(t.symbol))}22;color:${t.color || avatarColor(t.symbol)}">
          ${t.image ? `<img src="${t.image}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : t.symbol[0]}
        </div>
        <div class="token-info">
          <h4>${t.name}</h4>
          <span>$${t.symbol}</span>
        </div>
        <span class="pair-tag ${t.pair.toLowerCase()}">${t.pair}</span>
      </div>
      <div class="progress-wrap">
        <div class="progress-label">
          <span>${t.graduated ? 'Graduated · DLMM' : 'Bonding curve'}</span>
          <span>${t.progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${t.progress}%"></div>
        </div>
      </div>
      <div class="token-meta">
        <span>MCap ${t.mcap}</span>
        <span>${t.graduated ? 'Graduated' : `SOL ${(t.solLocked || 0).toFixed(2)}`}</span>
      </div>
      ${t.graduated ? '<div style="margin-top:0.6rem;font-size:0.75rem;color:#a78bfa">Live on DLMM →</div>' : ''}
    </div>
  `).join('');

  grid.querySelectorAll('.token-card').forEach((card) => {
    card.addEventListener('click', () => {
      const token = tokens.find((t) => t.mint === card.dataset.mint);
      if (token) openTradeModal(token);
    });
  });
}

function openTradeModal(token) {
  activeToken = token;
  $('#modal-token-name').textContent = `${token.name} ($${token.symbol})`;
  $('#modal-pair').textContent = token.graduated
    ? `Graduated · DLMM ${token.pair} pool`
    : `Bonding curve · ${token.pair} pair · MCap ${token.mcap}`;
  $('#trade-unit').textContent = token.pair;
  $('#trade-amount').value = '';
  $('#modal-graduated-note').style.display = token.graduated ? 'block' : 'none';
  updateTradeBtn();
  $('#trade-modal').classList.add('open');
}

function updateTradeBtn() {
  if (!activeToken) return;
  $('#trade-btn').textContent = activeToken.graduated
    ? 'Trade on DLMM'
    : `${tradeSide === 'buy' ? 'Buy' : 'Sell'} with ${activeToken.pair}`;
}

function closeTradeModal() {
  $('#trade-modal').classList.remove('open');
  activeToken = null;
}

function updateWalletBtn() {
  const { connected, publicKey } = getWalletState();
  const btn = $('#connect-wallet');
  if (connected && publicKey) {
    btn.textContent = shortAddress(publicKey);
    btn.classList.add('connected');
  } else {
    btn.textContent = 'Connect Wallet';
    btn.classList.remove('connected');
  }
}

$$('.pair-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.pair-option').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPair = btn.dataset.pair;
  });
});

$$('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTokens();
  });
});

$('#connect-wallet').addEventListener('click', async () => {
  try {
    await toggleWallet();
    updateWalletBtn();
    showToast(getWalletState().connected ? 'Wallet connected' : 'Wallet disconnected');
  } catch (e) {
    showToast(e.message || 'Wallet connection failed');
  }
});

$('#launch-btn').addEventListener('click', async () => {
  const { connected } = getWalletState();
  if (!connected) {
    showToast('Connect Phantom to launch');
    return;
  }
  const name = $('#token-name').value.trim();
  const symbol = $('#token-symbol').value.trim().toUpperCase();
  if (!name || !symbol) {
    showToast('Enter token name and symbol');
    return;
  }

  const token = {
    name,
    symbol,
    pair: selectedPair,
    progress: 0,
    mcap: '$0',
    mcapUsd: 0,
    vol: '$0',
    solLocked: 0,
    graduated: false,
    mint: `local-${Date.now()}`,
    color: avatarColor(symbol),
    description: $('#token-desc').value.trim(),
  };

  saveLocalLaunch(token);
  setPairOverride(token.mint, selectedPair);
  tokens.unshift(token);

  const launches = parseInt($('#stat-launches').textContent, 10);
  if (!Number.isNaN(launches)) {
    $('#stat-launches').textContent = String(launches + 1);
  }

  $('#token-name').value = '';
  $('#token-symbol').value = '';
  $('#token-desc').value = '';
  renderTokens();
  showToast(`${name} queued on Stablepad — on-chain deploy via pump program`);
  document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
});

$('#modal-close').addEventListener('click', closeTradeModal);
$('#trade-modal').addEventListener('click', (e) => {
  if (e.target === $('#trade-modal')) closeTradeModal();
});

$$('.trade-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    if (activeToken?.graduated) return;
    $$('.trade-tab').forEach((t) => t.classList.remove('active', 'buy', 'sell'));
    tab.classList.add('active', tab.dataset.side);
    tradeSide = tab.dataset.side;
    updateTradeBtn();
  });
});

$('#trade-btn').addEventListener('click', () => {
  const { connected } = getWalletState();
  if (!connected) {
    showToast('Connect wallet to trade');
    return;
  }
  if (!activeToken) return;

  const url = activeToken.poolUrl || poolUrl(activeToken.mint);
  window.open(url, '_blank');
  showToast(`Opening ${activeToken.symbol} on pump.fun`);
});

$('#upload-zone').addEventListener('click', () => showToast('IPFS upload — see pump-v2-frontend create flow'));

loadTokens();