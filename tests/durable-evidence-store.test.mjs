import test from'node:test';import assert from'node:assert/strict';import{spawnSync}from'node:child_process';
test('持久目录与独立解码器20条原字节恢复及身份/摘要/元数据/路径/目标/空间故障边界',()=>{const r=spawnSync('python3',['scripts/durable-evidence-store-tests.py'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stderr,/Ran 20 tests/);assert.match(r.stderr,/\nOK\n/);assert.equal(r.stdout,'');});
