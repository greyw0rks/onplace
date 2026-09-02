describe('Phase 2: Live Marketplace API', () => {
  describe('GET /api/activity/feed', () => {
    it('should return marketplace activity feed', async () => {
      const response = await fetch('http://localhost:3000/api/activity/feed');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('activities');
      expect(Array.isArray(data.activities)).toBe(true);
    });

    it('should include activity metadata', async () => {
      const response = await fetch('http://localhost:3000/api/activity/feed');
      const data = await response.json();

      if (data.activities.length > 0) {
        const activity = data.activities[0];
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('title');
        expect(activity).toHaveProperty('createdAt');
      }
    });
  });

  describe('GET /api/stats/marketplace', () => {
    it('should return marketplace statistics', async () => {
      const response = await fetch('http://localhost:3000/api/stats/marketplace');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('totalAgents');
      expect(data.stats).toHaveProperty('totalTxs');
      expect(data.stats).toHaveProperty('totalCategories');
      expect(data.stats).toHaveProperty('recentHires');
    });

    it('should return growth data', async () => {
      const response = await fetch('http://localhost:3000/api/stats/marketplace');
      const data = await response.json();

      expect(data).toHaveProperty('growth');
      expect(data.growth).toHaveProperty('agents');
      expect(data.growth).toHaveProperty('transactions');
      expect(data.growth).toHaveProperty('hires');
    });
  });

  describe('GET /api/battles', () => {
    it('should return agent battles', async () => {
      const response = await fetch('http://localhost:3000/api/battles');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('battles');
      expect(Array.isArray(data.battles)).toBe(true);
    });

    it('should include battle participants', async () => {
      const response = await fetch('http://localhost:3000/api/battles');
      const data = await response.json();

      if (data.battles.length > 0) {
        const battle = data.battles[0];
        expect(battle).toHaveProperty('participants');
        expect(Array.isArray(battle.participants)).toBe(true);
      }
    });
  });
});
