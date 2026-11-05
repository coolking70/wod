# 云端接续：本地v0.103

仓库`/workspace/wod`，分支`feature/v103-equipped-comparison`。本轮基线v101为78631e73b663a4710f42b35b593d2da04af94113；v102提交ba0fcc052d0e8a1218f54f3363de82a3f5ff0aa3；v103最终提交由`git rev-parse HEAD`及恢复包manifest记录。main保持357336294d0e5eb9191a8a21ba6c8d1147afe215。本轮没有推送、合并main或部署，也未修改预置BrogueJS仓库。

v102：群攻可选至少2/3名可攻击单位，不跨阵位凑数；免费计数不推进战斗RNG，候选变动后每新回合重查，保留once/round、窗口、资源/装备资格。真实三次出征445金币，法师/射手、多个房间覆盖与实际后备追溯贯通；疗所数量满足时照样耗尽符纸，不称全局省料升级。

v103：实验台可选择当前公会实装，对双方按同一时刻的真实装备/培养/后期进阶/课程/名册/伙伴职责校验。显示被实装替换的差异，结果和来源冻结；只有重新运行才读新资产。未学习课程拒绝。试演即使配置/种子碰巧与pending相同也不能领奖。正常seed2领取后实际买装60、培养40XP，200金币和本人40XP与API完整相同。

两阶段完整测试738/746通过；42份v101原始完整报告无排除相同。各有桌面/390px真实成长/备份/重演；失败的最初夹具日志保留，最终通过日志另存。统一浏览器入口包含九套；详细实测和运行检查位于`/workspace/wod-evidence/v102`及`v103`。

```bash
cd /workspace/wod
node --test tests/*.test.mjs
node scripts/verify-release.mjs /tmp/wod-runtime.json
python3 -m http.server 8002 --directory dist --bind 127.0.0.1
# 另一终端，复用已有Playwright，不自动安装依赖：
WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright WOD_BASE_URL=http://127.0.0.1:8002 WOD_EVIDENCE_DIR=/tmp/wod-acceptance node scripts/run-browser-acceptance.mjs
```

当前没有新的开发硬阻塞或必须重复询问的产品选择。保持现有可切换本人/小规模名册/托管伙伴、自由普通技能和独立后期进阶；继续单人完整游玩和真实反馈，不把暂缓身份提案、待核实参考服参数、版本号或例行备份当作停工理由。后续不自动推送或部署。
