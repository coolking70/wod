import test from 'node:test';
import assert from 'node:assert/strict';
import {editorNavigationView,editorBackView,captureEditorField,restoreEditorField,jumpEditor} from '../dist/expedition-editor-navigation.mjs';
test('tactics navigation preserves literal hero and room names and distinguishes draft assets',()=>{
 const html=editorNavigationView({name:'<阿瑟&"伙伴">',roomName:'第一房<script>'});
 assert.ok(html.includes('&lt;阿瑟&amp;&quot;伙伴&quot;&gt;'));assert.ok(html.includes('第一房&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.match(html,/公会出征仍采用实际持有的装备与培养/);assert.match(html,/站位与装备草稿/);assert.match(html,/实验培养/);assert.doesNotMatch(html,/data-editor-jump="healing"/);assert.match(html,/data-editor-review/);
});
test('healer and default room navigation expose the same existing action groups',()=>{
 const html=editorNavigationView({name:'药师',healing:true});
 assert.match(html,/默认方案/);assert.deepEqual([...html.matchAll(/data-editor-jump="([^"]+)"/g)].map(m=>m[1]),['main','prep','defense','healing','items','build','training']);assert.match(editorBackView(),/data-editor-jump="overview"/);
});
test('field restoration requires exact hero, room, phase, row and field, and never writes values',()=>{
 const call=[],old={tagName:'SELECT',dataset:{field:'target',phase:'main',row:'1'}},same={tagName:'SELECT',dataset:{field:'target',phase:'main',row:'1'},focus:o=>call.push(o)},other={tagName:'SELECT',dataset:{field:'target',phase:'prep',row:'1'},focus:()=>assert.fail('wrong phase')};
 const root={dataset:{editorHero:'e',editorRoom:'cistern'},ownerDocument:{activeElement:old},contains:n=>n===old,closest:()=>null,querySelectorAll:()=>[other,same]};
 const at=captureEditorField(root);assert.ok(restoreEditorField(root,at));assert.deepEqual(call,[{preventScroll:true}]);root.dataset.editorHero='d';assert.equal(restoreEditorField(root,at),false);root.dataset.editorHero='e';root.dataset.editorRoom='';assert.equal(restoreEditorField(root,at),false);assert.equal(same.value,undefined);
});
test('navigation ignores unsupported keys and hidden editors without moving focus',()=>{
 const root={closest:()=>null,querySelector:()=>assert.fail('invalid key must not query')};assert.equal(jumpEditor(root,'__proto__'),false);assert.equal(jumpEditor(root,'main" onclick='),false);
 assert.equal(jumpEditor({closest:()=>({})},'main'),false);assert.equal(captureEditorField({ownerDocument:{activeElement:null}}),null);
});
