export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';

export interface SolvencyStatus {
  solvent: boolean;
  reserves: string;
  liabilitiesRoot: string;
  lastChecked: number;
  lastCheckedISO: string | null;
  _note?: string;
}

export async function fetchStatus(): Promise<SolvencyStatus> {
  const url = BACKEND_URL ? `${BACKEND_URL}/api/status` : '/api/status';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
}

export interface UserSample {
  userId: string;
  balance: string;
  salt: string;
}

export async function fetchSampleUsers(): Promise<UserSample[]> {
  const url = BACKEND_URL ? `${BACKEND_URL}/api/users` : '/api/users';
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.users || [];
}

export async function proveInclusion(data: {
  userId: string;
  balance: string;
  salt: string;
  secret: string;
}): Promise<{ proof: any; publicSignals: string[]; nullifier: string; root: string }> {
  const url = BACKEND_URL ? `${BACKEND_URL}/api/prove-inclusion` : '/api/prove-inclusion';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Proof generation failed');
  return json;
}
