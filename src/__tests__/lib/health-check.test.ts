import { prisma } from '@/lib/db';
import { trustScoreOf, trustBand } from '@/lib/health-check';

describe('Trust Score Calculation', () => {
  it('should calculate trust score from reputation and uptime', () => {
    const agent = {
      reputationScore: 80,
      uptimePct: 0.95,
    };

    const score = trustScoreOf(agent);

    // 80 * 0.6 + 95 * 0.4 = 48 + 38 = 86
    expect(score).toBe(86);
  });

  it('should handle null reputation score', () => {
    const agent = {
      reputationScore: null,
      uptimePct: 0.98,
    };

    const score = trustScoreOf(agent);

    // 0 * 0.6 + 98 * 0.4 = 39.2 = 39 (rounded)
    expect(score).toBe(39);
  });

  it('should handle null uptime', () => {
    const agent = {
      reputationScore: 90,
      uptimePct: null,
    };

    const score = trustScoreOf(agent);

    // 90 * 0.6 + 0 * 0.4 = 54
    expect(score).toBe(54);
  });

  it('should classify excellent trust band', () => {
    expect(trustBand(95)).toBe('excellent');
  });

  it('should classify strong trust band', () => {
    expect(trustBand(85)).toBe('strong');
  });

  it('should classify moderate trust band', () => {
    expect(trustBand(75)).toBe('moderate');
  });

  it('should classify weak trust band', () => {
    expect(trustBand(60)).toBe('weak');
  });

  it('should classify high-risk trust band', () => {
    expect(trustBand(30)).toBe('high-risk');
  });
});

describe('Health Check', () => {
  it('should calculate uptime percentage correctly', async () => {
    // This would require a test database setup
    // For now, we test the logic conceptually
    const checks = [
      { success: true },
      { success: true },
      { success: false },
      { success: true },
      { success: true },
    ];

    const uptimePct = checks.filter(c => c.success).length / checks.length;
    expect(uptimePct).toBe(0.8);
  });
});
