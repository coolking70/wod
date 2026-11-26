import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = readFileSync(new URL('../dist/expedition-ui.mjs', import.meta.url), 'utf8');
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const nav = html.match(/<nav aria-label="主导航">([\s\S]*?)<\/nav>/)[1];
const entries = [...nav.matchAll(/<button data-view="([^"]+)"([^>]*)>/g)];
const views = ['guild', 'adventure', 'planning', 'replay', 'compare'];

test('main navigation identifies only the visible initial view before scripts run', () => {
  assert.deepEqual(entries.map(m => m[1]), views);
  assert.deepEqual(entries.filter(m => /\saria-current=/.test(m[2])).map(m => m[1]), ['planning']);
  assert.match(entries.find(m => m[1] === 'planning')[2], /\saria-current="true"/);
  assert.deepEqual(entries.filter(m => /\sclass="active"/.test(m[2])).map(m => m[1]), ['planning']);
  const panes = [...html.matchAll(/<section id="([^"]+)" class="view"([^>]*)>/g)];
  assert.deepEqual(panes.filter(m => !/\bhidden\b/.test(m[2])).map(m => m[1]), ['planning']);
});

test('shared view handler keeps one programmatic, visual and visible current view', () => {
  const buttons = views.map(view => {
    const button = {dataset: {view}, attributes: new Map(), active: false};
    button.classList = {toggle: (name, active) => { assert.equal(name, 'active'); button.active = active; }};
    button.setAttribute = (name, value) => button.attributes.set(name, value);
    button.removeAttribute = name => button.attributes.delete(name);
    return button;
  });
  const panes = views.map(id => ({id, hidden: true}));
  const body = {dataset: {}, classList: {remove() {}}};
  const document = {body, querySelectorAll(selector) {
    if (selector === '.view') return panes;
    assert.equal(selector, '[data-view]');
    return buttons;
  }};
  const handlerSource = source.slice(source.indexOf('function view(v)'), source.indexOf('function selectedBase()'));
  const calls = [];
  const view = new Function('document', '$', 'stop', 'renderAdventure', 'refreshReportHandoff',
    handlerSource + '\nreturn view;')(document, () => ({}),
    () => {}, () => calls.push('adventure'), () => calls.push('replay'));
  for (const target of ['adventure', 'guild', 'planning', 'replay', 'compare', 'planning']) {
    view(target);
    assert.equal(body.dataset.view, target);
    assert.deepEqual(panes.filter(p => !p.hidden).map(p => p.id), [target]);
    assert.deepEqual(buttons.filter(b => b.active).map(b => b.dataset.view), [target]);
    assert.deepEqual(buttons.filter(b => b.attributes.has('aria-current'))
      .map(b => [b.dataset.view, b.attributes.get('aria-current')]), [[target, 'true']]);
  }
  assert.deepEqual(calls, ['adventure', 'replay']);
  // Imported and generated reports use the same shared transition, not a nav click.
  const reportLoader = source.slice(source.indexOf('function loadReport('), source.indexOf('function roomEvents('));
  assert.match(reportLoader, /view\('replay'\)/);
});
