import test from 'node:test';
import assert from 'node:assert/strict';
import helpers from '../scripts/save-owner-test-helpers.cjs';

function pageWithSaveTools(initial, status = 'writer') {
  let disclosure = initial;
  let released = false;
  const steps = [];
  const page = {
    locator(selector) {
      if (selector === '#save-ownership') {
        return { async getAttribute(attribute) {
          assert.equal(attribute, 'data-save-ownership');
          return status;
        }};
      }
      if (selector === '#save-ownership details.save-tools:not([open]) > summary') {
        return {
          async count() { return disclosure === 'closed' ? 1 : 0; },
          async click() {
            assert.equal(disclosure, 'closed');
            steps.push('expand');
            disclosure = 'open';
          }
        };
      }
      assert.equal(selector, '[data-save-release]');
      return { async click() {
        assert.notEqual(disclosure, 'closed', 'release action is hidden before disclosure opens');
        steps.push('release');
        released = true;
      }};
    },
    async waitForFunction(predicate) {
      assert.equal(typeof predicate, 'function');
      assert.equal(released, true);
      steps.push('wait for Web Lock');
    }
  };
  return { page, steps };
}

test('writer handoff opens a closed disclosure before clicking release', async () => {
  const {page, steps} = pageWithSaveTools('closed');
  await helpers.releaseWriter234(page);
  assert.deepEqual(steps, ['expand', 'release', 'wait for Web Lock']);
});

for (const initial of ['open', 'legacy']) {
  test('writer handoff clicks release without toggling ' + initial + ' controls', async () => {
    const {page, steps} = pageWithSaveTools(initial);
    await helpers.releaseWriter234(page);
    assert.deepEqual(steps, ['release', 'wait for Web Lock']);
  });
}

test('writer handoff rejects a non-writer without clicking or waiting', async () => {
  const {page, steps} = pageWithSaveTools('open', 'readonly');
  await assert.rejects(helpers.releaseWriter234(page), { code: 'ERR_ASSERTION' });
  assert.deepEqual(steps, []);
});
