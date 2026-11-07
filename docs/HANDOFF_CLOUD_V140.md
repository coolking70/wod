# 云端交接 v0.140

仓库`/workspace/wod`，分支`feature/v140-personal-mana-reserve`，起点v139`c7022a82e3d1d3bcdb803de5f34c61ea1db535cb`。先读[V140实现与实玩](V140_MANA_RESERVE.md)、[冻结方案](V140_PLAN.json)、[验证](V140_CHECKS.json)、[云端约定](CLOUD_STORAGE_AND_GIT_POLICY.md)。本阶段主干集成/推送的实际SHA与最终恢复包以仓库外交付收据为准，不把待执行计划当成功。

新增`expedition-mana-floor.mjs`，可选逐条`keepMana`1..200；UI0移除，仅有费用的预备/普通技能可用。用真实进阶/媒介费用检查用后余量，低于底线免费查后备，等于可付款；自动救护和独立防御等不被锁住，仍可能低于底线。旧无字段报告与旧引擎一致，无新技能/装备/敌人/奖励/持久补给字段。

Native终档7070/next66在`/workspace/wod-evidence/v140/mana-floor-final.json`，准备来自65，浏览器持久种子731，正式种子65。64护库6人3/6、8草6符6箭、A9MP；无条件对照同样通关/回合/材料而A3MP；65誓骨6人2/5、6草4符4箭、A30MP、无留蓝阻止。保留未触发及不变的结果，不宣称升级。21旧首证、五冻结793208字符、仓库及成员除正常XP之外的完整字段保持，55失败可重演。

复验：`node --test tests/*.test.mjs`，`node --test tests/mana-floor.test.mjs`，`node scripts/verify-release.mjs`。新空目录运行`WOD_EVIDENCE_DIR=... node scripts/check-v140.mjs`及`browser-v140.cjs`；Playwright依赖只读使用BrogueJS，loopback8002静态dist。统一48组设置/tmp独立目录和主盘WOD_RECEIPT_DIR，检查每组原始文件SHA/CRC/图像；不覆盖旧摘要。所有失败日志、第一轮浏览器图与后来成功图均保留。

`audit-state.mjs`引用临时v139参考目录`/tmp/wod-v139-reference-for-v140`；如已安全回收，按确定c7022…用Git archive重建，勿用worktree prune。旧六提交仍在refs/retained/reflog-20261106，任何main/分支清理不等于可删除旧证据或这些提交。

用户授权后续完成阶段正常推送和周期main评估；仅安全门禁通过时正常快进/合并，禁止强推/保护绕过/部署。补给经济和当前服数值仍待用户，保留普通技能自由培养、独立后期进阶、可切换个人英雄和小名册。下一步重看实际探索与队伍分工，避免不断扩更多资源条件。
