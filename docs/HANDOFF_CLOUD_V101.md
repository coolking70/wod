# 云端接续：main v0.100，本地v0.101

仓库在`/workspace/wod`，借用云环境的执行能力，未修改预置BrogueJS仓库。当前分支`feature/v101-schedule-evidence`；main和远端main均为`357336294d0e5eb9191a8a21ba6c8d1147afe215`。v0.94独立备份远端仍为`1f9df35d49d29d99b087d79b81382214a2f682e3`。

本轮连续完成：v95远征选择目标与持久首证，v96个人持有装备的四套配装册，v97跨职业指令时序，v98整档校验/预览/失败回退，v99三场潮刻钟楼与固定怀表，v100完整集成验证与授权main快进推送，之后继续v101窗口证据的默认可见与真实后备来回跳转。保留自由普通技能、独立后期进阶、可切换本人及伙伴托管，没有固定主角变更。

v100验证724项测试、六套桌面/390px、40份v94完整报告零排除相同、358脚本语法及103运行模块/120引用通过。v101为728项测试及桌面/390px正常领奖和重演，40旧报告保持相同；见各阶段文档与云端`/workspace/wod-evidence/v95`至`v101`。失败初始日志均保留，最终日志才用于通过结论。仍无npm构建需求；直接运行dist。

```bash
cd /workspace/wod
node --test tests/*.test.mjs
node scripts/verify-release.mjs /tmp/wod-runtime.json
python3 -m http.server 8002 --directory dist --bind 127.0.0.1
# 使用已有Playwright时：
WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright WOD_BASE_URL=http://127.0.0.1:8002 WOD_EVIDENCE_DIR=/tmp/wod-acceptance node scripts/run-browser-acceptance.mjs
WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright WOD_BASE_URL=http://127.0.0.1:8002 WOD_EVIDENCE_DIR=/tmp/wod-v101 node scripts/browser-v101.cjs
```

没有新增硬阻塞。可继续单人玩法与真实试玩反馈的改进；不把版本号、待核实的原版参数或暂缓身份提案当作停工条件。后续只本地提交，不自动推送、再合并main或部署。需要账号/多人、公开发布范围、长期经济归属或固定主角等重大范围改变时才提出具体决策。

原版训练/精通现行数值仍待核实，当前参数仍为隔离的项目原型，不虚构服务器规则。localStorage失败补偿不是跨设备服务器事务，备份校验和不是防本地修改的认证。
