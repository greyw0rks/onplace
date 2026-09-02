describe('Phase 1: Enhanced Discovery & Search API', () => {
  describe('GET /api/agents/search', () => {
    it('should return agents matching search query', async () => {
      const response = await fetch('http://localhost:3000/api/agents/search?q=yield');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('agents');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await fetch('http://localhost:3000/api/agents/search?category=yield_optimisation');
      expect(response.ok).toBe(true);

      const data = await response.json();
      data.agents.forEach((agent: any) => {
        expect(agent.categorySlug).toBe('yield_optimisation');
      });
    });

    it('should filter by verified status', async () => {
      const response = await fetch('http://localhost:3000/api/agents/search?verified=true');
      expect(response.ok).toBe(true);

      const data = await response.json();
      data.agents.forEach((agent: any) => {
        expect(agent.verified).toBe(true);
      });
    });

    it('should filter by minimum trust score', async () => {
      const response = await fetch('http://localhost:3000/api/agents/search?minTrust=80');
      expect(response.ok).toBe(true);

      const data = await response.json();
      data.agents.forEach((agent: any) => {
        expect(agent.reputationScore).toBeGreaterThanOrEqual(80);
      });
    });
  });

  describe('GET /api/agents/top', () => {
    it('should return top performing agents', async () => {
      const response = await fetch('http://localhost:3000/api/agents/top');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('agents');
      expect(Array.isArray(data.agents)).toBe(true);
    });
  });

  describe('GET /api/agents/rising', () => {
    it('should return rising agents', async () => {
      const response = await fetch('http://localhost:3000/api/agents/rising');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('agents');
    });
  });

  describe('GET /api/agents/trending', () => {
    it('should return trending agents', async () => {
      const response = await fetch('http://localhost:3000/api/agents/trending');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('agents');
    });
  });

  describe('GET /api/agents/verified', () => {
    it('should return only verified agents', async () => {
      const response = await fetch('http://localhost:3000/api/agents/verified');
      expect(response.ok).toBe(true);

      const data = await response.json();
      data.agents.forEach((agent: any) => {
        expect(agent.verified).toBe(true);
        expect(agent.verifiedAt).toBeTruthy();
      });
    });
  });
});
