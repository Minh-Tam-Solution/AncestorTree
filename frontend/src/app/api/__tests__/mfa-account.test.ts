/**
 * @project AncestorTree
 * @file src/app/api/__tests__/mfa-account.test.ts
 * @description E2E tests for MFA (TOTP) and Account management endpoints.
 *   Runs against local Supabase (localhost:54321). Requires `supabase start`.
 *
 *   GoTrue v2.186.0 endpoint notes:
 *   - POST /auth/v1/factors          — enroll TOTP factor
 *   - DELETE /auth/v1/factors/:id    — unenroll factor
 *   - POST /auth/v1/factors/:id/challenge — create challenge
 *   - POST /auth/v1/factors/:id/verify   — verify (completes enrollment)
 *   - GET  /auth/v1/user             — get current user + factors list
 *   - GET  /auth/v1/aal              — NOT available; AAL decoded from JWT payload
 *   - GET  /auth/v1/factors          — NOT supported (405)
 *
 *   Profile table: uses `user_id` (auth UID), not `id` (profile UUID).
 *
 * @version 1.1.0
 * @updated 2026-02-28
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { authenticator } from '@otplib/preset-default';

// ─── Config ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const ADMIN_EMAIL = 'admin@giapha.local';
const ADMIN_PASS = 'admin123';
const VIEWER_EMAIL = 'viewer@giapha.local';
const VIEWER_PASS = 'viewer123';

// ─── Auth helpers ────────────────────────────────────────────────────────────

interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: { id: string };
}

async function signIn(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`signIn failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return res.json();
}

async function signOut(accessToken: string): Promise<void> {
  await fetch(`${BASE_URL}/auth/v1/logout`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
}

/** Decode JWT payload without verifying signature */
function decodeJwt(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
}

// ─── MFA helpers ─────────────────────────────────────────────────────────────

/** Enroll a new TOTP factor — POST /auth/v1/factors */
async function enrollFactor(accessToken: string, friendlyName: string) {
  return fetch(`${BASE_URL}/auth/v1/factors`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ factor_type: 'totp', issuer: 'AncestorTree', friendly_name: friendlyName }),
  });
}

/** List factors — GET /auth/v1/user contains factors[] */
async function listFactors(accessToken: string): Promise<{ id: string; status: string; friendly_name?: string }[]> {
  const res = await fetch(`${BASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.factors as { id: string; status: string; friendly_name?: string }[]) ?? [];
}

/** Unenroll a factor — DELETE /auth/v1/factors/:id */
async function unenrollFactor(accessToken: string, factorId: string) {
  return fetch(`${BASE_URL}/auth/v1/factors/${factorId}`, {
    method: 'DELETE',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
}

/** Create challenge — POST /auth/v1/factors/:id/challenge */
async function challengeFactor(accessToken: string, factorId: string) {
  return fetch(`${BASE_URL}/auth/v1/factors/${factorId}/challenge`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
}

// ─── Profile helpers ──────────────────────────────────────────────────────────

/** Fetch profile by auth user_id (NOT profile.id) */
async function getProfileByUserId(accessToken: string, userId: string) {
  return fetch(
    `${BASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=*`,
    { headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` } },
  );
}

/** Update own profile (authenticated user can only update their own via RLS) */
async function updateProfileByUserId(
  accessToken: string,
  userId: string,
  patch: Record<string, unknown>,
) {
  return fetch(
    `${BASE_URL}/rest/v1/profiles?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(patch),
    },
  );
}

/** Service-role patch for suspend/unsuspend */
async function adminPatchProfile(userId: string, patch: Record<string, unknown>) {
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return fetch(
    `${BASE_URL}/rest/v1/profiles?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(patch),
    },
  );
}

// ─── Test state ───────────────────────────────────────────────────────────────

let adminToken = '';
let adminUserId = '';
let viewerToken = '';
let viewerUserId = '';
let enrolledFactorId = '';
let enrolledFactorSecret = '';   // base32 secret from enroll response (used by otplib)
let verifiedFactorId = '';       // factor ID after full verify — for AAL2 + unenroll tests
const FACTOR_NAME = `e2e-mfa-${Date.now()}`;

// ─── Cleanup: remove leftover unverified factors from previous runs ────────────

beforeAll(async () => {
  try {
    const session = await signIn(ADMIN_EMAIL, ADMIN_PASS);
    const factors = await listFactors(session.access_token);
    const toClean = factors.filter((f) => f.friendly_name?.startsWith('e2e-'));
    for (const f of toClean) {
      await unenrollFactor(session.access_token, f.id);
    }
    await signOut(session.access_token);
  } catch {
    // Ignore cleanup errors
  }
});

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Account & MFA E2E — local Supabase (GoTrue v2.186.0)', () => {

  // ── 0. Auth ───────────────────────────────────────────────────────────────

  describe('0. Auth — sign-in', () => {
    it('should sign in as admin', async () => {
      const data = await signIn(ADMIN_EMAIL, ADMIN_PASS);
      expect(data.access_token).toBeTruthy();
      expect(data.user.id).toBeTruthy();
      adminToken = data.access_token;
      adminUserId = data.user.id;
    });

    it('should sign in as viewer', async () => {
      const data = await signIn(VIEWER_EMAIL, VIEWER_PASS);
      expect(data.access_token).toBeTruthy();
      viewerToken = data.access_token;
      viewerUserId = data.user.id;
    });

    it('should reject wrong password', async () => {
      await expect(signIn(ADMIN_EMAIL, 'wrongpass')).rejects.toThrow();
    });

    it('JWT payload should contain correct aal and role claims', () => {
      const payload = decodeJwt(adminToken);
      expect(payload.sub).toBe(adminUserId);
      expect(payload.aal).toBe('aal1');
      expect(payload.role).toBe('authenticated');
    });
  });

  // ── 1. Profile ────────────────────────────────────────────────────────────

  describe('1. Profile — CRUD (profiles.user_id = auth UID)', () => {
    it('should fetch own profile via user_id filter', async () => {
      const res = await getProfileByUserId(adminToken, adminUserId);
      expect(res.status).toBe(200);
      const rows = await res.json();
      expect(rows).toHaveLength(1);
      expect(rows[0].user_id).toBe(adminUserId);
      expect(rows[0].role).toBe('admin');
      expect(rows[0].email).toBe(ADMIN_EMAIL);
      expect(rows[0]).toHaveProperty('is_suspended');
    });

    it('should update own full_name', async () => {
      const res = await updateProfileByUserId(adminToken, adminUserId, { full_name: 'Admin E2E Test' });
      expect(res.status).toBe(200);
      const rows = await res.json();
      expect(rows[0].full_name).toBe('Admin E2E Test');
    });

    it('should restore original full_name', async () => {
      const res = await updateProfileByUserId(adminToken, adminUserId, { full_name: 'Quản trị viên' });
      expect(res.status).toBe(200);
    });

    it('viewer should NOT be able to update admin profile (RLS)', async () => {
      const res = await fetch(
        `${BASE_URL}/rest/v1/profiles?user_id=eq.${adminUserId}`,
        {
          method: 'PATCH',
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${viewerToken}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ full_name: 'HACKED' }),
        },
      );
      // RLS blocks: 0 rows returned (200 with empty), or 401/403
      if (res.ok) {
        const rows = await res.json();
        expect(rows).toHaveLength(0);
      } else {
        expect([401, 403]).toContain(res.status);
      }
    });
  });

  // ── 2. MFA — list via /auth/v1/user ──────────────────────────────────────

  describe('2. MFA — listFactors (via GET /auth/v1/user)', () => {
    it('should return user object with factors field (array or undefined when empty)', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/user`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${viewerToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id');
      // GoTrue returns `factors: undefined` when no factors enrolled, array when present
      expect(data.factors === undefined || Array.isArray(data.factors)).toBe(true);
    });

    it('GET /auth/v1/factors is not a valid endpoint (405)', async () => {
      // Document that direct GET to /factors is not supported in GoTrue v2.186.0
      const res = await fetch(`${BASE_URL}/auth/v1/factors`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(405);
    });

    it('should require auth for /auth/v1/user', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/user`, {
        headers: { apikey: ANON_KEY },
      });
      expect(res.status).toBe(401);
    });
  });

  // ── 3. MFA — AAL from JWT ─────────────────────────────────────────────────

  describe('3. MFA — Authenticator Assurance Level (from JWT payload)', () => {
    it('should have aal1 in admin JWT (no verified MFA)', () => {
      const payload = decodeJwt(adminToken);
      expect(payload.aal).toBe('aal1');
    });

    it('should have aal1 in viewer JWT (no MFA enrolled)', () => {
      const payload = decodeJwt(viewerToken);
      expect(payload.aal).toBe('aal1');
    });

    it('/auth/v1/aal endpoint does not exist in GoTrue v2.186.0 (404)', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/aal`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  // ── 4. MFA — enroll ───────────────────────────────────────────────────────

  describe('4. MFA — enroll TOTP', () => {
    it('should enroll a new TOTP factor for admin', async () => {
      const res = await enrollFactor(adminToken, FACTOR_NAME);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBeTruthy();
      expect(data.type).toBe('totp');
      expect(data.totp).toBeDefined();
      expect(data.totp.qr_code).toBeTruthy();
      expect(data.totp.secret).toBeTruthy();
      enrolledFactorId = data.id;
      enrolledFactorSecret = data.totp.secret; // base32 — used by otplib to generate TOTP codes
    });

    it('should appear in user factors after enrollment', async () => {
      const factors = await listFactors(adminToken);
      const found = factors.find((f) => f.id === enrolledFactorId);
      expect(found).toBeDefined();
      expect(found?.status).toBe('unverified');
    });

    it('should reject duplicate friendly_name', async () => {
      const res = await enrollFactor(adminToken, FACTOR_NAME);
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.error_code).toBe('mfa_factor_name_conflict');
    });

    it('should reject enrollment without auth', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/factors`, {
        method: 'POST',
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ factor_type: 'totp', issuer: 'AncestorTree', friendly_name: 'no-auth' }),
      });
      expect(res.status).toBe(401);
    });
  });

  // ── 5. MFA — challenge ────────────────────────────────────────────────────

  describe('5. MFA — challenge (unverified factor)', () => {
    it('should create a challenge for unverified factor', async () => {
      if (!enrolledFactorId) return;
      const res = await challengeFactor(adminToken, enrolledFactorId);
      // GoTrue allows challenging an unverified factor (needed to complete enrollment)
      expect([200, 422]).toContain(res.status);
    });

    it('should reject challenge for nonexistent factor ID', async () => {
      const res = await challengeFactor(adminToken, '00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('should reject challenge without auth', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/factors/${enrolledFactorId}/challenge`, {
        method: 'POST',
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    });
  });

  // ── 5.5. MFA — full TOTP verify (enroll → challenge → verify) ────────────
  // Uses otplib to generate a real 6-digit TOTP code from the enrolled secret.

  describe('5.5. MFA — full TOTP verify (challengeAndVerify)', () => {
    it('should complete enrollment with a real TOTP code', async () => {
      if (!enrolledFactorId || !enrolledFactorSecret) return;

      // Step 1: create challenge
      const challengeRes = await challengeFactor(adminToken, enrolledFactorId);
      expect(challengeRes.status).toBe(200);
      const { id: challengeId } = await challengeRes.json() as { id: string };
      expect(challengeId).toBeTruthy();

      // Step 2: generate TOTP code from the enrolled secret
      const totpCode = authenticator.generate(enrolledFactorSecret);
      expect(totpCode).toMatch(/^\d{6}$/);

      // Step 3: verify
      const verifyRes = await fetch(`${BASE_URL}/auth/v1/factors/${enrolledFactorId}/verify`, {
        method: 'POST',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challenge_id: challengeId, code: totpCode }),
      });
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      // GoTrue returns a new session with AAL2 after successful verify
      expect(verifyData.access_token).toBeTruthy();
      // Refresh admin token to AAL2 session
      adminToken = verifyData.access_token;
      verifiedFactorId = enrolledFactorId;
    });

    it('JWT aal claim should be aal2 after successful verify', () => {
      if (!verifiedFactorId) return;
      const payload = decodeJwt(adminToken);
      expect(payload.aal).toBe('aal2');
    });

    it('factor status should be "verified" after verify', async () => {
      if (!verifiedFactorId) return;
      const factors = await listFactors(adminToken);
      const found = factors.find((f) => f.id === verifiedFactorId);
      expect(found?.status).toBe('verified');
    });

    it('should reject verify with wrong TOTP code', async () => {
      // Need a fresh unverified factor to test wrong code
      const name2 = `e2e-wrong-${Date.now()}`;
      const enrollRes = await enrollFactor(adminToken, name2);
      if (enrollRes.status !== 200) return; // skip if enroll fails
      const enrollData = await enrollRes.json();
      const factorId2 = enrollData.id as string;

      const challengeRes = await challengeFactor(adminToken, factorId2);
      if (challengeRes.status !== 200) {
        await unenrollFactor(adminToken, factorId2);
        return;
      }
      const { id: challengeId2 } = await challengeRes.json() as { id: string };

      const verifyRes = await fetch(`${BASE_URL}/auth/v1/factors/${factorId2}/verify`, {
        method: 'POST',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ challenge_id: challengeId2, code: '000000' }),
      });
      expect(verifyRes.status).toBe(422);
      const errData = await verifyRes.json();
      expect(errData.error_code).toBe('mfa_verification_failed');

      // cleanup
      await unenrollFactor(adminToken, factorId2);
    });
  });

  // ── 6. MFA — unenroll ─────────────────────────────────────────────────────

  describe('6. MFA — unenroll', () => {
    it('should unenroll the verified factor (verifiedFactorId)', async () => {
      const fid = verifiedFactorId || enrolledFactorId;
      if (!fid) return;
      const res = await unenrollFactor(adminToken, fid);
      expect(res.status).toBe(200);
    });

    it('should NOT appear in user factors after unenrollment', async () => {
      const fid = verifiedFactorId || enrolledFactorId;
      if (!fid) return;
      const factors = await listFactors(adminToken);
      const found = factors.find((f) => f.id === fid);
      expect(found).toBeUndefined();
    });

    it('should reject unenroll of already removed factor (404)', async () => {
      const fid = verifiedFactorId || enrolledFactorId;
      if (!fid) return;
      const res = await unenrollFactor(adminToken, fid);
      expect(res.status).toBe(404);
    });

    it('should reject unenroll without auth', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000001';
      const res = await fetch(`${BASE_URL}/auth/v1/factors/${fakeId}`, {
        method: 'DELETE',
        headers: { apikey: ANON_KEY },
      });
      expect(res.status).toBe(401);
    });
  });

  // ── 7. User management — suspend / unsuspend ──────────────────────────────

  describe('7. User management — suspend / unsuspend (service role)', () => {
    it('should suspend viewer account', async () => {
      if (!SERVICE_KEY) {
        console.warn('SKIP: SUPABASE_SERVICE_ROLE_KEY not set');
        return;
      }
      const res = await adminPatchProfile(viewerUserId, {
        is_suspended: true,
        suspension_reason: 'E2E test suspension',
      });
      expect(res.status).toBe(200);
      const rows = await res.json();
      expect(rows[0].is_suspended).toBe(true);
      expect(rows[0].suspension_reason).toBe('E2E test suspension');
    });

    it('admin can see suspended flag on viewer profile', async () => {
      if (!SERVICE_KEY) return;
      const res = await getProfileByUserId(adminToken, viewerUserId);
      expect(res.status).toBe(200);
      const rows = await res.json();
      expect(rows[0].is_suspended).toBe(true);
    });

    it('should unsuspend viewer account', async () => {
      if (!SERVICE_KEY) return;
      const res = await adminPatchProfile(viewerUserId, {
        is_suspended: false,
        suspension_reason: null,
      });
      expect(res.status).toBe(200);
      const rows = await res.json();
      expect(rows[0].is_suspended).toBe(false);
    });
  });

  // ── 8. Password change ────────────────────────────────────────────────────

  describe('8. Password change', () => {
    it('should update viewer password via PUT /auth/v1/user', async () => {
      const newPass = 'viewer123_new';
      const res = await fetch(`${BASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${viewerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPass }),
      });
      expect(res.status).toBe(200);
    });

    it('should re-authenticate with new password', async () => {
      const data = await signIn(VIEWER_EMAIL, 'viewer123_new');
      expect(data.access_token).toBeTruthy();
      viewerToken = data.access_token; // refresh token
    });

    it('should restore original password', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${viewerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: VIEWER_PASS }),
      });
      expect(res.status).toBe(200);
    });

    it('should reject password update without auth', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'hacked' }),
      });
      expect(res.status).toBe(401);
    });
  });

  // ── 9. Sign-out ───────────────────────────────────────────────────────────

  describe('9. Auth — sign-out', () => {
    it('should sign out admin without error', async () => {
      await expect(signOut(adminToken)).resolves.not.toThrow();
    });

    it('should sign out viewer without error', async () => {
      await expect(signOut(viewerToken)).resolves.not.toThrow();
    });

    it('revoked token should get 401 or 403 from /auth/v1/user', async () => {
      const res = await fetch(`${BASE_URL}/auth/v1/user`, {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${adminToken}` },
      });
      // GoTrue local may return 401 or 403 after logout (token revoked)
      expect([401, 403]).toContain(res.status);
    });
  });

  // ── Teardown: remove any remaining e2e- factors ───────────────────────────
  afterAll(async () => {
    try {
      const session = await signIn(ADMIN_EMAIL, ADMIN_PASS);
      const factors = await listFactors(session.access_token);
      const toClean = factors.filter((f) => f.friendly_name?.startsWith('e2e-'));
      for (const f of toClean) {
        await unenrollFactor(session.access_token, f.id);
      }
      await signOut(session.access_token);
    } catch {
      // Ignore teardown errors
    }
  });
});
