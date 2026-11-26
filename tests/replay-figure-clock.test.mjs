import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as liveTidecaller from '../dist/studies/tidecaller-rig-v187-live.mjs';
import * as liveHerbalist from '../dist/studies/herbalist-rig-v189-live.mjs';
import * as frozenTidecaller from '../dist/studies/tidecaller-rig-v187.mjs';
import * as frozenHerbalist from '../dist/studies/herbalist-rig-v189.mjs';
import {animateTidecallerFigures} from '../dist/expedition-tidecaller-motion.mjs';
import {animateHerbalistFigures} from '../dist/expedition-herbalist-motion.mjs';

for (const [surface, hero, render, poses] of [
  ['replay', 'tidecaller', animateTidecallerFigures, ['prepare', 'release']],
  ['replay', 'herbalist', animateHerbalistFigures, ['prepare', 'aid']],
  ['study', 'tidecaller', liveTidecaller.animateTidecallerFigures, ['prepare', 'release']],
  ['study', 'herbalist', liveHerbalist.animateHerbalistFigures, ['prepare', 'aid']],
]) {
  test(`a negative initial SVG clock does not break ${hero} ${surface} or reveal results early`, context => {
    const queue = new Map();
    let serial = 0;
    const originalRAF = Object.getOwnPropertyDescriptor(globalThis, 'requestAnimationFrame');
    const originalCancel = Object.getOwnPropertyDescriptor(globalThis, 'cancelAnimationFrame');
    Object.defineProperty(globalThis, 'requestAnimationFrame', {
      configurable:true, value:fn => { queue.set(++serial, fn); return serial; },
    });
    Object.defineProperty(globalThis, 'cancelAnimationFrame', {
      configurable:true, value:id => queue.delete(id),
    });
    context.after(() => {
      for (const [name, original] of [
        ['requestAnimationFrame',originalRAF], ['cancelAnimationFrame',originalCancel],
      ]) {
        if (original) Object.defineProperty(globalThis,name,original);
        else delete globalThis[name];
      }
    });
    const frame = () => {
      assert.equal(queue.size, 1);
      const [id, next] = queue.entries().next().value;
      queue.delete(id);
      next();
    };
    const plan = {
      id:'actor', settled:'idle', settledLabel:'settled',
      beats:[
        {eventIds:[50], label:'cast', pose:poses[0]},
        {eventIds:[52,54], label:'result', pose:poses[1]},
      ],
    };
    const label = {};
    const animations = [];
    const svg = {
      dataset:{[`${hero}Id`]:plan.id}, isConnected:true,
      parentElement:{querySelector:() => label},
      querySelector:() => ({
        style:{},
        animate() {
          const animation = {currentTime:null, playState:'running', cancel(){this.playState = 'idle';}};
          animations.push(animation);
          return animation;
        },
      }),
    };
    const group = render({querySelectorAll:() => [svg]}, [plan]);
    assert.equal(group.count, 10);
    const events = () => svg.dataset[`${hero}Events`];
    const clock = animations[0];
    clock.currentTime = -0.001;
    frame();
    assert.equal(events(), '');
    clock.currentTime = 225;
    frame();
    assert.equal(events(), '50');
    clock.currentTime = 449.9;
    frame();
    assert.equal(events(), '50');
    clock.currentTime = 450;
    frame();
    assert.equal(events(), '52,54');
    group.cancel();
    assert.equal(events(), '');
    assert.equal(svg.dataset[`${hero}Frame`], 'settled');
    assert.equal(queue.size, 0);
    assert.ok(animations.every(a => a.playState==='idle'));
  });
}


for (const [stem, hero, version, frozen, live] of [
  ['v187-tidecaller-wave', 'tidecaller', 187, frozenTidecaller, liveTidecaller],
  ['v189-herbalist-aid', 'herbalist', 189, frozenHerbalist, liveHerbalist],
]) {
  test(`live ${hero} study preserves frozen art, poses and all eight sample cues`, () => {
    const read = file => readFileSync(new URL('../dist/studies/' + file, import.meta.url));
    const hash = value => createHash('sha256').update(value).digest('hex');
    const manifest = JSON.parse(read(stem + '.json'));
    const rig = hero + '-rig-v' + version;
    const original = read(rig + '.mjs');
    const loader = read(rig + '-live.mjs').toString();
    assert.equal(hash(original), manifest.modelSHA256);
    assert.equal(hash(read(rig + '.css')), manifest.frozenStyleSHA256);
    for (const file of manifest.files) {
      const data = read(file.url);
      assert.equal(data.length, file.bytes);
      assert.equal(hash(data), file.sha256);
    }
    const oldClock = 'cue(Number(clock.currentTime)||0);';
    const newClock = 'const elapsed=Number(clock.currentTime);cue(Number.isFinite(elapsed)?Math.max(0,elapsed):0);';
    assert.ok(loader.includes(newClock));
    assert.equal(loader.slice(loader.indexOf('\n') + 1).replace(newClock, oldClock), original.toString());
    assert.deepEqual(live[hero + 'Keyframes'](manifest.plan), manifest.keyframes);
    assert.equal(live[hero + 'Figure'](manifest.plan), frozen[hero + 'Figure'](manifest.plan));
    assert.equal(manifest.frames.length, 8);
    for (const frame of manifest.frames) {
      assert.deepEqual(
        live[hero + 'CueAt'](manifest.plan, frame.nativeSampleMs, manifest.nativeDurationMs),
        frozen[hero + 'CueAt'](manifest.plan, frame.nativeSampleMs, manifest.nativeDurationMs),
      );
    }
  });
}
