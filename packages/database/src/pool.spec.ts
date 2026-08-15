import { describe, it, expect, vi } from 'vitest';
import { PostgresPoolWrapper } from './pool.js';

describe('PostgresPoolWrapper', () => {
  it('instantiates pool wrapper with config', () => {
    const wrapper = new PostgresPoolWrapper({
      connectionString: 'postgres://user:pass@localhost:5432/platform',
    });
    expect(wrapper.rawPool).toBeDefined();
  });
});
