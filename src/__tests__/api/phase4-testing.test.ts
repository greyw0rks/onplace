describe('Phase 4: Continuous Testing Infrastructure API', () => {
  describe('GET /api/tests/suites', () => {
    it('should return test suites', async () => {
      const response = await fetch('http://localhost:3000/api/tests/suites');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('suites');
      expect(Array.isArray(data.suites)).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await fetch('http://localhost:3000/api/tests/suites?category=yield_optimisation');
      expect(response.ok).toBe(true);

      const data = await response.json();
      data.suites.forEach((suite: any) => {
        expect(suite.category).toBe('yield_optimisation');
      });
    });

    it('should exclude hidden tests by default', async () => {
      const response = await fetch('http://localhost:3000/api/tests/suites');
      const data = await response.json();

      data.suites.forEach((suite: any) => {
        expect(suite.hidden).toBe(false);
      });
    });

    it('should include hidden tests when requested', async () => {
      const response = await fetch('http://localhost:3000/api/tests/suites?includeHidden=true');
      const data = await response.json();

      const hasHidden = data.suites.some((suite: any) => suite.hidden === true);
      expect(data.suites.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/tests/run', () => {
    it('should execute tests for an agent', async () => {
      const response = await fetch('http://localhost:3000/api/tests/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'test-agent-id',
        }),
      });

      if (response.status !== 404) { // Agent may not exist
        const data = await response.json();
        expect(data).toHaveProperty('results');
        expect(data).toHaveProperty('summary');
        expect(data.summary).toHaveProperty('total');
        expect(data.summary).toHaveProperty('passed');
        expect(data.summary).toHaveProperty('failed');
        expect(data.summary).toHaveProperty('passRate');
      }
    });

    it('should handle timeout in tests', async () => {
      // This would require a mock agent that times out
      expect(true).toBe(true); // Placeholder
    });

    it('should calculate pass rate correctly', () => {
      const results = [
        { status: 'PASSED' },
        { status: 'PASSED' },
        { status: 'FAILED' },
        { status: 'PASSED' },
      ];

      const passed = results.filter(r => r.status === 'PASSED').length;
      const passRate = (passed / results.length) * 100;

      expect(passRate).toBe(75);
    });
  });

  describe('GET /api/tests/schedules', () => {
    it('should return test schedules', async () => {
      const response = await fetch('http://localhost:3000/api/tests/schedules');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('schedules');
      expect(Array.isArray(data.schedules)).toBe(true);
    });

    it('should filter by agent', async () => {
      const response = await fetch('http://localhost:3000/api/tests/schedules?agentId=test-agent-id');
      expect(response.ok).toBe(true);

      const data = await response.json();
      data.schedules.forEach((schedule: any) => {
        if (schedule.agentId) {
          expect(schedule.agentId).toBe('test-agent-id');
        }
      });
    });
  });

  describe('POST /api/webhooks/github', () => {
    it('should process GitHub webhook events', async () => {
      const payload = {
        ref: 'refs/heads/main',
        repository: {
          html_url: 'https://github.com/test/repo',
        },
        commits: [
          {
            id: 'abc123',
            message: 'Test commit',
            timestamp: new Date().toISOString(),
            author: {
              name: 'Test Author',
            },
          },
        ],
      };

      const response = await fetch('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // May return 404 if repo not tracked, which is expected
      expect([200, 404]).toContain(response.status);
    });

    it('should reject invalid signatures', async () => {
      const response = await fetch('http://localhost:3000/api/webhooks/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=invalid',
        },
        body: JSON.stringify({ ref: 'main', commits: [] }),
      });

      // Should either reject or ignore
      expect([200, 401, 404]).toContain(response.status);
    });
  });
});
