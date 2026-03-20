/**
 * TaskClaw MCP HTTP Client
 *
 * Authenticates with the TaskClaw REST API using email/password (JWT)
 * and provides typed request methods for all MCP tools.
 */

const API_URL = process.env.TASKCLAW_API_URL || 'http://localhost:3003';
const EMAIL = process.env.TASKCLAW_EMAIL;
const PASSWORD = process.env.TASKCLAW_PASSWORD;
const ACCOUNT_ID = process.env.TASKCLAW_ACCOUNT_ID;

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

let session: Session | null = null;
let resolvedAccountId: string | null = ACCOUNT_ID || null;

async function login(): Promise<Session> {
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      'TASKCLAW_EMAIL and TASKCLAW_PASSWORD environment variables are required',
    );
  }

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as Session;
  session = data;
  return data;
}

async function getToken(): Promise<string> {
  if (!session) {
    await login();
  }
  return session!.access_token;
}

export async function getAccountId(): Promise<string> {
  if (resolvedAccountId) return resolvedAccountId;

  const token = await getToken();
  const res = await fetch(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch accounts: ${res.status}`);
  }

  const accounts = (await res.json()) as Array<{ id: string; name: string }>;
  if (!accounts.length) {
    throw new Error('No accounts found for this user');
  }

  resolvedAccountId = accounts[0].id;
  return resolvedAccountId;
}

export async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await getToken();
  const accountId = await getAccountId();
  const url = `${API_URL}${path.replace(':accountId', accountId)}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // Token may have expired, re-login once
    await login();
    const retryToken = session!.access_token;
    const retryRes = await fetch(url, {
      method,
      headers: { ...headers, Authorization: `Bearer ${retryToken}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!retryRes.ok) {
      const errBody = await retryRes.text();
      throw new Error(`API error ${retryRes.status}: ${errBody}`);
    }
    return retryRes.json();
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`API error ${res.status}: ${errBody}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : { success: true };
}

export async function get(path: string): Promise<unknown> {
  return apiRequest('GET', path);
}

export async function post(path: string, body?: unknown): Promise<unknown> {
  return apiRequest('POST', path, body);
}

export async function patch(path: string, body?: unknown): Promise<unknown> {
  return apiRequest('PATCH', path, body);
}

export async function del(path: string): Promise<unknown> {
  return apiRequest('DELETE', path);
}

export async function initialize(): Promise<void> {
  await login();
  await getAccountId();
}
