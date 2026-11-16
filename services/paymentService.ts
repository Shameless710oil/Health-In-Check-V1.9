import { UserProfile, UserTier } from '../types';
import { getUserProfile, saveUserProfile } from './storageService';
import { updateUserTier } from './authService';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getClientPaymentLink(tier: UserTier): string | undefined {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const procEnv = (typeof process !== 'undefined' && process.env) || {};
  if (tier === UserTier.PASS) {
    return metaEnv.VITE_STRIPE_PASS_URL || procEnv.VITE_STRIPE_PASS_URL;
  }
  if (tier === UserTier.STANDARD) {
    return metaEnv.VITE_STRIPE_STANDARD_URL || procEnv.VITE_STRIPE_STANDARD_URL;
  }
  if (tier === UserTier.ULTRA) {
    return metaEnv.VITE_STRIPE_ULTRA_URL || procEnv.VITE_STRIPE_ULTRA_URL;
  }
  return undefined;
}

export function isLocalSandboxAllowed(hostname?: string): boolean {
  const host =
    hostname !== undefined
      ? hostname
      : typeof window !== 'undefined'
        ? window.location.hostname
        : '';
  return host === 'localhost' || host === '127.0.0.1';
}

export async function initiateTierCheckout(
  tier: UserTier,
  profile: UserProfile,
  opts?: { hostname?: string; fetchFn?: typeof fetch }
): Promise<{ status: 'redirect' | 'unconfigured'; url?: string; canUseLocalSandbox: boolean }> {
  const fetchImpl = opts?.fetchFn || (typeof fetch !== 'undefined' ? fetch : undefined);
  const hostname = opts?.hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  if (fetchImpl) {
    try {
      const res = await fetchImpl('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          email: profile.email || undefined,
          origin
        })
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data && data.url) {
          return {
            status: 'redirect',
            url: data.url,
            canUseLocalSandbox: isLocalSandboxAllowed(hostname)
          };
        }
      }
    } catch (_) {
      // Fall through to client payment link or sandbox check
    }
  }

  const directLink = getClientPaymentLink(tier);
  if (directLink) {
    const sep = directLink.includes('?') ? '&' : '?';
    const url = profile.email
      ? `${directLink}${sep}prefilled_email=${encodeURIComponent(profile.email)}`
      : directLink;
    return {
      status: 'redirect',
      url,
      canUseLocalSandbox: isLocalSandboxAllowed(hostname)
    };
  }

  return {
    status: 'unconfigured',
    canUseLocalSandbox: isLocalSandboxAllowed(hostname)
  };
}

export async function activateVerifiedTier(
  tier: UserTier,
  sessionId?: string,
  nowMs: number = Date.now()
): Promise<UserProfile> {
  const current = await getUserProfile();
  const updated: UserProfile = {
    ...current,
    tier,
    stripeSessionId: sessionId || current.stripeSessionId
  };

  if (tier === UserTier.PASS) {
    updated.tierExpiresAt = nowMs + THIRTY_DAYS_MS;
  } else {
    delete updated.tierExpiresAt;
  }

  await saveUserProfile(updated);
  await updateUserTier(tier);
  return updated;
}

export async function verifyCheckoutReturnFromUrl(
  search: string,
  fetchFn?: typeof fetch
): Promise<{ activated: boolean; tier?: UserTier }> {
  if (!search || !search.includes('checkout=success')) {
    return { activated: false };
  }
  const params = new URLSearchParams(search);
  if (params.get('checkout') !== 'success') {
    return { activated: false };
  }
  const rawTier = String(params.get('tier') || '').toUpperCase() as UserTier;
  const sessionId = params.get('session_id') || undefined;
  if (![UserTier.PASS, UserTier.STANDARD, UserTier.ULTRA].includes(rawTier)) {
    return { activated: false };
  }

  const fetchImpl = fetchFn || (typeof fetch !== 'undefined' ? fetch : undefined);
  if (sessionId && fetchImpl) {
    try {
      const res = await fetchImpl(`/api/checkout?session_id=${encodeURIComponent(sessionId)}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.verified) {
          await activateVerifiedTier(rawTier, sessionId);
          return { activated: true, tier: rawTier };
        }
      }
    } catch (_) {}
  }

  // If redirected back from a Stripe Payment Link (or local sandbox with ?checkout=success&tier=...)
  if (!sessionId || isLocalSandboxAllowed()) {
    await activateVerifiedTier(rawTier, sessionId);
    return { activated: true, tier: rawTier };
  }

  return { activated: false };
}
