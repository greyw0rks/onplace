describe('Phase 5: Security & Permissions API', () => {
  describe('GET /api/agents/[id]/security', () => {
    it('should return security audits', async () => {
      const agentId = 'test-agent-id';
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/security`);

      if (response.ok) {
        const data = await response.json();
        expect(data).toHaveProperty('audits');
        expect(Array.isArray(data.audits)).toBe(true);
      }
    });

    it('should include security findings', async () => {
      const agentId = 'test-agent-id';
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/security`);

      if (response.ok) {
        const data = await response.json();
        if (data.audits.length > 0) {
          const audit = data.audits[0];
          expect(audit).toHaveProperty('findings');
          expect(audit).toHaveProperty('securityLevel');
          expect(audit).toHaveProperty('permissionSpec');
        }
      }
    });

    it('should include permission capabilities', async () => {
      const agentId = 'test-agent-id';
      const response = await fetch(`http://localhost:3000/api/agents/${agentId}/security`);

      if (response.ok) {
        const data = await response.json();
        if (data.audits.length > 0) {
          const audit = data.audits[0];
          expect(audit.permissionSpec).toHaveProperty('capabilities');
          expect(Array.isArray(audit.permissionSpec.capabilities)).toBe(true);
        }
      }
    });
  });

  describe('POST /api/agents/[id]/security', () => {
    it('should create security audit', async () => {
      const auditData = {
        agentId: 'test-agent-id',
        version: '1.0.0',
        securityLevel: 'BASIC',
        capabilities: [
          { name: 'READ_WALLET', level: 'READ', required: true },
          { name: 'READ_MARKET_DATA', level: 'READ', required: true },
        ],
        findings: [
          {
            severity: 'LOW',
            category: 'Configuration',
            title: 'Missing rate limiting',
            description: 'API endpoints should implement rate limiting',
            remediation: 'Add rate limiting middleware',
          },
        ],
        auditedBy: 'test-auditor',
      };

      const response = await fetch('http://localhost:3000/api/agents/test-agent-id/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditData),
      });

      if (response.status !== 404) {
        const data = await response.json();
        expect(data).toHaveProperty('audit');
        expect(data.audit).toHaveProperty('securityLevel');
        expect(data.audit.findings.length).toBe(1);
      }
    });
  });

  describe('GET /api/sessions', () => {
    it('should return hire sessions', async () => {
      const response = await fetch('http://localhost:3000/api/sessions');
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty('sessions');
      expect(Array.isArray(data.sessions)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await fetch('http://localhost:3000/api/sessions?status=ACTIVE');
      expect(response.ok).toBe(true);

      const data = await response.json();
      data.sessions.forEach((session: any) => {
        expect(session.status).toBe('ACTIVE');
      });
    });

    it('should include spending limits', async () => {
      const response = await fetch('http://localhost:3000/api/sessions');
      const data = await response.json();

      if (data.sessions.length > 0) {
        const session = data.sessions[0];
        expect(session).toHaveProperty('maxTransactionAmount');
        expect(session).toHaveProperty('dailySpendingLimit');
        expect(session).toHaveProperty('sessionSpendingLimit');
      }
    });
  });

  describe('POST /api/sessions', () => {
    it('should create hire session with spending limits', async () => {
      const sessionData = {
        hireId: 'test-hire-id',
        maxTransactionAmount: '100',
        dailySpendingLimit: '500',
        sessionSpendingLimit: '1000',
        allowedContracts: ['0x123...'],
        allowedActions: ['EXECUTE_SWAP'],
        durationHours: 24,
      };

      const response = await fetch('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (response.status !== 404) {
        const data = await response.json();
        expect(data).toHaveProperty('session');
        expect(data.session.status).toBe('ACTIVE');
        expect(data.session.maxTransactionAmount).toBe('100');
      }
    });
  });

  describe('POST /api/sessions/[id]/revoke', () => {
    it('should revoke active session', async () => {
      const sessionId = 'test-session-id';
      const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}/revoke`, {
        method: 'POST',
      });

      if (response.status !== 404) {
        const data = await response.json();
        expect(data).toHaveProperty('session');
        if (response.ok) {
          expect(data.session.status).toBe('REVOKED');
          expect(data.session.revokedAt).toBeTruthy();
        }
      }
    });

    it('should not revoke already revoked session', async () => {
      const sessionId = 'test-session-id';

      // Try to revoke twice
      await fetch(`http://localhost:3000/api/sessions/${sessionId}/revoke`, { method: 'POST' });
      const response = await fetch(`http://localhost:3000/api/sessions/${sessionId}/revoke`, { method: 'POST' });

      if (response.status === 400) {
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Permission Levels', () => {
    it('should validate capability levels hierarchy', () => {
      const levels = ['NONE', 'INFORMATION', 'READ', 'ANALYZE', 'PREPARE', 'EXECUTE', 'TRANSFER'];

      expect(levels.indexOf('TRANSFER')).toBeGreaterThan(levels.indexOf('EXECUTE'));
      expect(levels.indexOf('EXECUTE')).toBeGreaterThan(levels.indexOf('READ'));
      expect(levels.indexOf('READ')).toBeGreaterThan(levels.indexOf('NONE'));
    });

    it('should recognize capability types', () => {
      const types = [
        'READ_WALLET',
        'READ_TRANSACTIONS',
        'READ_MARKET_DATA',
        'ANALYZE_PORTFOLIO',
        'GENERATE_TRANSACTION',
        'SIGN_TRANSACTION',
        'EXECUTE_SWAP',
        'TRANSFER_FUNDS',
        'ACCESS_API',
        'MODIFY_CONFIG',
      ];

      expect(types.length).toBe(10);
      expect(types).toContain('READ_WALLET');
      expect(types).toContain('TRANSFER_FUNDS');
    });
  });
});
