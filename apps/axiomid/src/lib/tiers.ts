export type Tier = 'Registered' | 'Verified' | 'Trusted' | 'Sovereign';

export const TIERS = {
  Registered: 0,
  Verified: 100,
  Trusted: 500,
  Sovereign: 1000,
};

export function calculateTier(xp: number): Tier {
  if (xp >= TIERS.Sovereign) return 'Sovereign';
  if (xp >= TIERS.Trusted) return 'Trusted';
  if (xp >= TIERS.Verified) return 'Verified';
  return 'Registered';
}

export function getLevelProgress(xp: number, tier: Tier): number {
    let nextXP = 0;
    let currentThreshold = 0;

    switch (tier) {
      case 'Registered':
        currentThreshold = TIERS.Registered;
        nextXP = TIERS.Verified;
        break;
      case 'Verified':
        currentThreshold = TIERS.Verified;
        nextXP = TIERS.Trusted;
        break;
      case 'Trusted':
        currentThreshold = TIERS.Trusted;
        nextXP = TIERS.Sovereign;
        break;
      case 'Sovereign':
        return 100; // Max level
    }

    const range = nextXP - currentThreshold;
    const progress = xp - currentThreshold;
    return Math.min(100, Math.max(0, (progress / range) * 100));
}

export function getNextLevelXP(tier: Tier): number | null {
    switch (tier) {
      case 'Registered': return TIERS.Verified;
      case 'Verified': return TIERS.Trusted;
      case 'Trusted': return TIERS.Sovereign;
      default: return null;
    }
}
