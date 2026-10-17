/** Only MongoDB driver's two supported URI schemes are valid.
 * Never log the URI itself, because it can contain private credentials.
 */
export function isMongoUri(uri: string): boolean {
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
}

/**
 * Identify DNS SRV resolution failures only; do not mistake Atlas
 * authentication/network/firewall errors for a DNS resolver problem.
 */
export function isSrvDnsLookupFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: unknown; syscall?: unknown; message?: unknown };
  const hasNetworkDnsCode = e.code === 'ECONNREFUSED' || e.code === 'ETIMEOUT' || e.code === 'EAI_AGAIN';
  const isSrvQuery = e.syscall === 'querySrv' ||
    (typeof e.message === 'string' && /querySrv\b/i.test(e.message));
  return hasNetworkDnsCode && isSrvQuery;
}
