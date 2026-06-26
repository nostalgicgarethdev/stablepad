let walletState = { connected: false, publicKey: null, provider: null };

export function getWalletState() {
  return walletState;
}

export function shortAddress(key, chars = 4) {
  if (!key) return '';
  const s = typeof key === 'string' ? key : key.toString();
  return `${s.slice(0, chars)}...${s.slice(-chars)}`;
}

export async function connectWallet() {
  const provider = window.solana || window.phantom?.solana;
  if (!provider?.isPhantom) {
    throw new Error('Phantom wallet not found');
  }
  const res = await provider.connect();
  walletState = {
    connected: true,
    publicKey: res.publicKey.toString(),
    provider,
  };
  return walletState;
}

export async function disconnectWallet() {
  const provider = walletState.provider;
  if (provider?.disconnect) {
    try { await provider.disconnect(); } catch (_) { /* noop */ }
  }
  walletState = { connected: false, publicKey: null, provider: null };
  return walletState;
}

export async function toggleWallet() {
  if (walletState.connected) return disconnectWallet();
  return connectWallet();
}