# 云端交接 v0.137

先读[V137实现/空间审计](V137_PERSONAL_FOCUS.md)、[检查收据](V137_CHECKS.json)、[实玩结果](V137_PLAYCHECK.json)、[冻结方案](V137_PLAN.json)。仓库`/workspace/wod`，本地分支`feature/v137-personal-focus-travel`，基线`00a2eb0ddd9cd5ce9e090e4e89d91065878fdf67`。当前commit/tree见恢复目录manifest。

修复实测的自动路线准备静默重置本人自由倾向/技能专修/防御专修，按当前本人和实际名册携带仅三项。地图、营地准备、攻略目标与任务通路共用；命名完整绑定、文件/历史/明确完整起点保持优先。当前准备配置保存选择，无新存档字段或身份锁。不是原版Meisterrang或永久培养；原数字/全部技能装备与引擎不改。

真实最终6665金币/next62、无pending，仅正常60/61各85金40XP，无装备/购买/训练，仓库、全部原首证/任务/职责/五payload793208精确保持。E选择cha/mindcall/dodge随行，60/61六人；同60默认重置对照也同回合生还/余料，不宣称增强。恢复准备页731与正常自动分配60/61不同，沿原语义；报告和公会同API。

先检查磁盘：主盘起始2.4GiB/32GB，旧20GB证据及8GB恢复包全部保留。只删经blob和恢复ZIP校验的临时v134/v135无Git参考副本及未用npm内容缓存；临时盘释放约138MiB，主盘未见增加，67份带Git元数据的目录保留。本轮新建v136参考副本在复现/回归结束后也经1118个blob/恢复ZIP校验回收，并停止本轮临时8005服务；源码可由Git和v136恢复包重建，8002主服务保留。

大型验收在独立`/tmp/wod-evidence/v137/acceptance`，每组全文件（含图像）ZIP检查点/摘要在主盘`/workspace/wod-evidence/v137/acceptance`；当前源及关键证据在主盘。Python归档工具验证CRC/每文件SHA/源未变，不移除输入，也拒绝覆盖已有检查点。最终恢复包的verification.zip合并两根全部原始文字/JSON/图像，逐组检查点ZIP另外在主盘保留；没有删除原始测试证据。请勿误把/tmp清理回收算主盘回收。

复验：`node --test tests/*.test.mjs`；`node --test tests/route-focus*.test.mjs`；`WOD_EVIDENCE_DIR=/tmp/wod-v137 node scripts/check-v137.mjs`；`node scripts/verify-release.mjs`。统一运行：`WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright WOD_BASE_URL=http://127.0.0.1:8002 WOD_EVIDENCE_DIR=/tmp/wod-evidence/v137-new/acceptance WOD_RECEIPT_DIR=/workspace/wod-evidence/v137-new/acceptance node scripts/run-browser-acceptance.mjs`。使用新目录避免覆盖原证据；dist直接运行，不需npm构建，不修改BrogueJS。

跨页保护仍非原子跨进程锁；仅当前Chromium验证，Firefox/Safari/实体机未验。普通技能自由、后期进阶独立、个人英雄可切换/托管伙伴/小名册方向保持。没有push、main合并、部署或永久补给；本地main357336294d0e5eb9191a8a21ba6c8d1147afe215保持。后续回实际单人探索和成长瓶颈，避免增加自动存档类别或堆更多分析设置。

最终核验：1251/1251完整、17/17新专项、45/45统一Chromium首轮通过；589份JS及1份Python语法、156模块/174引用通过。74旧完整报告原始JSON零排除一致，184既有运行文件/原图、五冻结条目793208及交接历史保持。45份独立复核检查点含887文件/74图像，原始1413835954字节压缩为174993365字节；两根原件仍完整保留。
