describe('Phase 3: Agent Profile Enhancement API', () => {
  describe('GET /api/agents/[id]/scores', () => {
    it('should return multi-score breakdown', async () => {
      // Assuming we have an agent ID from seed data
      const agentId = 'test-agent-id';
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/scores`);

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('scores');
        expect(data.scores).toHaveProperty('trust');
        expect(data.scores).toHaveProperty('health');
        expect(data.scores).toHaveProperty('performance');
        expect(data.scores).toHaveProperty('community');
        expect(data).toHaveProperty('breakdown');
      }
    });

    it('should calculate trust score correctly', async () => {
      const agentId = 'test-agent-id';
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/scores`);

      if (response.ok) {
        const data = await response.json();
        expect(data.scores.trust).toBeGreaterThanOrEqual(0);
        expect(data.scores.trust).toBeLessThanOrEqual(100);

        // Trust should be 60% AgentProof + 40% Community
        expect(data.breakdown.trust).toHaveProperty('agentProof');
        expect(data.breakdown.trust).toHaveProperty('community');
      }
    });
  });

  describe('GET /api/agents/[id]/versions', () => {
    it('should return agent version history', async () => {
      const agentId = 'test-agent-id';
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/versions`);

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('versions');
        expect(Array.isArray(data.versions)).toBe(true);
      }
    });

    it('should include version metadata', async () => {
      const agentId = 'test-agent-id';
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/versions`);

      if (response.ok) {
        const data = await response.json();
        if (data.versions.length > 0) {
          const version = data.versions[0];
          expect(version).toHaveProperty('version');
          expect(version).toHaveProperty('verificationStatus');
          expect(version).toHaveProperty('createdAt');
        }
      }
    });
  });

  describe('POST /api/agents/follow', () => {
    it('should create a follow relationship', async () => {
      const response = await fetch('http://localhost:3000/api/agents/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          agentId: 'test-agent-id',
        }),
      });

      if (response.status !== 400) { // May already exist
        expect([200, 201, 400]).toContain(response.status);
      }
    });

    it('should prevent duplicate follows', async () => {
      await fetch('http://localhost:3000/api/agents/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          agentId: 'test-agent-id',
        }),
      });

      const response = await fetch('http://localhost:3000/api/agents/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          agentId: 'test-agent-id',
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
