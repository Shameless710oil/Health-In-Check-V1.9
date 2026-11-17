// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserTier } from '../types';
import { PLANS } from '../constants';
import { canPerformAction, incrementUsage } from '../services/authService';
import { getUserProfile, saveUserProfile } from '../services/storageService';
import {
  isLocalSandboxAllowed,
  initiateTierCheckout,
  activateVerifiedTier
} from '../services/paymentService';

describe('Task 3: 4-Tier Monetization, 30-Day Pass Expiration & Payment Guard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('enforces 3 scans/day in Guest FREE mode and unlocks 50 scans/day when 30-Day PASS is activated', async () => {
    for (let i = 0; i < 3; i++) {
      const check = await canPerformAction('SCAN');
      expect(check.allowed).toBe(true);
      await incrementUsage('SCAN');
    }
    const blocked = await canPerformAction('SCAN');
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(3);

    const updated = await activateVerifiedTier(UserTier.PASS, 'cs_test_123', 1000000);
    expect(updated.tier).toBe(UserTier.PASS);
    expect(updated.tierExpiresAt).toBe(1000000 + 30 * 24 * 60 * 60 * 1000);

    const afterPass = await canPerformAction('SCAN');
    expect(afterPass.allowed).toBe(true);
    expect(afterPass.limit).toBe(50);
  });

  it('allows 3 generations/day in Guest FREE mode before blocking on the 4th', async () => {
    expect(PLANS[UserTier.FREE].generationsPerDay).toBe(3);
    expect(PLANS[UserTier.FREE].features).toContain('3 Meal/Workout Ideas per day');

    for (let i = 0; i < 3; i++) {
      const check = await canPerformAction('GENERATE');
      expect(check.allowed).toBe(true);
      await incrementUsage('GENERATE');
    }

    const blocked = await canPerformAction('GENERATE');
    expect(blocked.allowed).toBe(false);
    expect(blocked.limit).toBe(3);
  });

  it('automatically downgrades an expired 30-Day PASS back to FREE tier', async () => {
    const profile = await getUserProfile();
    await saveUserProfile({
      ...profile,
      tier: UserTier.PASS,
      tierExpiresAt: Date.now() - 1000 // Expired 1s ago
    });

    const check = await canPerformAction('SCAN');
    expect(check.limit).toBe(3);
    const refreshedProfile = await getUserProfile();
    expect(refreshedProfile.tier).toBe(UserTier.FREE);
  });

  it('blocks local sandbox checkout on production hostnames when Stripe is unconfigured', async () => {
    expect(isLocalSandboxAllowed('localhost')).toBe(true);
    expect(isLocalSandboxAllowed('127.0.0.1')).toBe(true);
    expect(isLocalSandboxAllowed('192.168.1.42')).toBe(true);
    expect(isLocalSandboxAllowed('10.0.0.15')).toBe(true);
    expect(isLocalSandboxAllowed('100.64.1.10')).toBe(true);
    expect(isLocalSandboxAllowed('172.16.0.5')).toBe(true);
    expect(isLocalSandboxAllowed('172.31.255.1')).toBe(true);
    expect(isLocalSandboxAllowed('chromebook.local')).toBe(true);
    expect(isLocalSandboxAllowed('demo.trycloudflare.com')).toBe(true);
    expect(isLocalSandboxAllowed('demo.loca.lt')).toBe(true);
    expect(isLocalSandboxAllowed('demo.ngrok-free.app')).toBe(true);
    expect(isLocalSandboxAllowed('172.32.0.1')).toBe(false);
    expect(isLocalSandboxAllowed('192.169.1.1')).toBe(false);
    expect(isLocalSandboxAllowed('app.foodchemintel.com')).toBe(false);

    const profile = await getUserProfile();
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ configured: false }) });
    const prodRes = await initiateTierCheckout(UserTier.PASS, profile, {
      hostname: 'app.foodchemintel.com',
      fetchFn: mockFetch as any
    });
    expect(prodRes.status).toBe('unconfigured');
    expect(prodRes.canUseLocalSandbox).toBe(false);
  });
});
