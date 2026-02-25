import { execSync } from 'child_process';

module.exports = async function globalTeardown() {
  console.log('\n[E2E Teardown] Dropping test database...');
  try {
    execSync(
      'docker exec ortho-postgres psql -U ortho -d postgres -c "DROP DATABASE IF EXISTS orthomonitor_test;"',
      { stdio: 'pipe' },
    );
    console.log('[E2E Teardown] Test database dropped');
  } catch (e) {
    console.warn('[E2E Teardown] Could not drop test database:', (e as Error).message);
  }
};
