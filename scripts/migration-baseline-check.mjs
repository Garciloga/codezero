// Read-only reproducibility check. Never implies a production data backup exists.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const file='supabase/baselines/20261008-production-manifest.json';
const baseline=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(baseline.status,'schema-history-inventory-only');
assert.equal(baseline.source_hash_algorithm,'sha256-utf8-lf-trim-end-single-newline');
assert.equal(baseline.cloud_data_backup_confirmed,false);
assert.equal(baseline.cloud_restore_verified,false);
assert.equal(baseline.migrations.length,65);
assert.equal(new Set(baseline.migrations.map(m=>m.version)).size,65);
assert.ok(baseline.migrations.every(m=>/^\d{14}$/.test(m.version)&&/^[a-f0-9]{32}$/.test(m.statement_md5)));
for(const migration of baseline.local_files){
 const data=fs.readFileSync(migration.path,'utf8').replaceAll('\r\n','\n').trimEnd()+'\n';
 assert.equal(crypto.createHash('sha256').update(data).digest('hex'),migration.sha256,migration.path);
}
assert.ok(baseline.local_files.some(m=>m.path.endsWith('mixed_role_routes.sql')));
assert.ok(baseline.local_files.some(m=>m.path.endsWith('mixed_route_predecessor_consistency.sql')));
console.log('PASS baseline history, table RLS inventory and '+baseline.local_files.length+' migration/source hashes; cloud backup remains unconfirmed');
