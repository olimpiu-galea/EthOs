export const STALE_THRESHOLD_MS = 120_000;

export function isIntegrationStale(
  connected: boolean,
  lastSync: number | null,
  now = Date.now(),
): boolean {
  if (!connected || !lastSync) return false;
  return now - lastSync > STALE_THRESHOLD_MS;
}
