# 云端交接 v0.135

先读[V135实现与边界](V135_WEAPON_COATING.md)、[检查收据](V135_CHECKS.json)、[实玩结果](V135_PLAYCHECK.json)、[结果前固定方案](V135_PLAN.json)。云端仓库 `/workspace/wod`，本地分支 `feature/v135-weapon-coating`，上游基线v134 `3f0d98962ffe7203a4afda96dcaef672cb003296`。本轮commit和tree见恢复目录manifest，文档不自指提交哈希。

新增药师普通淬药和一次命中的两种伤害；一次攻防、逐段护甲/抗性与生命截断、最后统一倒下/转态，原未附药事件不改。具体技能与数值为暂定改编，原版多伤害结构有官方正文证据。初始non-www地址502，www地址后来正文读取成功；仍未核实现行服参数。

真实最终6265金币/next58，无pending；F淬药永久+1付20XP，其他人每人+110XP，原装备/课程/独立进阶/角色职责/任务/五份冻结payload保持，只增加两个正常邮铃。56/57各六人，附加段49/43且药草耗尽；相同56无药也六人，不推算净增伤或全局升级。原55全灭不改。恢复从 `coating-final.json` 或浏览器整档 `coating-final-campaign.json`；所有事实以检查收据为准。

复验：`node --test tests/*.test.mjs`；`node --test tests/weapon-coating*.test.mjs`；`WOD_EVIDENCE_DIR=/tmp/wod-v135 node scripts/check-v135.mjs`；`node scripts/verify-release.mjs`。浏览器使用已有Playwright模块，`WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright WOD_BASE_URL=http://127.0.0.1:8002 WOD_EVIDENCE_DIR=/tmp/wod-browser-acceptance node scripts/run-browser-acceptance.mjs`，只读借用BrogueJS依赖，不修改该仓库。

跨页已见快照比较不是原子操作或跨进程锁；先等待真实storage通知再读不等于消除了并发缓存窗口。不要以此次单浏览器通过承诺严格多人事务。

不推送、不合并、不部署、不实施永久补给；main保持357336294d0e5eb9191a8a21ba6c8d1147afe215。普通技能自由搭配、后期进阶独立、个人英雄可切换与托管伙伴/小名册约束不改。没有新增权限或重大设计阻塞。后续持续整体实玩和协作瓶颈，避免堆叠附魔变体。

最终验证：1213/1213完整、24/24新专项、43/43统一Chromium验收首轮通过；574脚本语法、153模块/171引用通过。70旧完整报告仅核实并排除药师新可用名册imbue6，事件/快照/统计/结果完全相同；原五份冻结字节、176既有运行文件和交接历史保持。
