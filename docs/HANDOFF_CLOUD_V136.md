# 云端交接 v0.136

先读[V136实现与边界](V136_LINKED_WARDS.md)、[检查收据](V136_CHECKS.json)、[实玩结果](V136_PLAYCHECK.json)、[结果前固定方案](V136_PLAN.json)。仓库`/workspace/wod`，分支`feature/v136-linked-wards`，基线v135 `dc25dcc281d8d356961d035f6ea3aa2aadee8a9d`。本轮commit/tree见本地恢复manifest，避免文档自指哈希。

完成原创两房潮锁护库和环境来源护壁：机关存活+12或双8护甲，拆除后只解除本来源，普通技能增益不连带移除，不回滚HP/MP/旧伤/队列。战前全公开；战报建立/解除/真实致死攻击/来源id可追溯，支援导航和手机完整。沿原心理/拆解/施法护甲/支付规则，不声称新机制来自原版；v135已核阅官方2014伤害文章是结构参考，本轮重读502限制保留。

真实最终6495金币/next60，无pending；本轮无新训练/购买/课程/退款/换装/职责。普通两次+230金、每人100XP，无掉落，仓库不变，五原冻结payload793208及原19首证保持；新增存活首证58，实际总20/87，不把59重复记证。正常58先拆、59先追医/心理，均六人但资源不同，同seed58也只给有限整队取舍证据。

复验：`node --test tests/*.test.mjs`；`node --test tests/linked-wards.test.mjs tests/linked-ward-play.test.mjs`；`WOD_EVIDENCE_DIR=/tmp/wod-v136 node scripts/check-v136.mjs`；`node scripts/verify-release.mjs`。已有Playwright可只读借用`/workspace/BrogueJS/node_modules/playwright`，环境静态服务`http://127.0.0.1:8002`，统一脚本`scripts/run-browser-acceptance.mjs`现含44组。dist即源码，无npm安装/构建。不要修改BrogueJS仓库。

恢复从`ward-final.json`或浏览器`ward-final-campaign.json`；实验原始配置59可能与公会实装培养不同，实际出征继续guildConfig核对资产。旧55失败及56/57报告保留，不重建旧收藏冒充历史；新路线扩大地图/目标总数，现有故事/首证字段无迁移。

普通技能自由、独立后期进阶、小名册、可切换个人英雄及托管伙伴方向不改。跨页快照检查仍非原子跨进程锁，传播前不同缓存有限制。无推送、main合并、部署或永久补给；本地main保持357336294d0e5eb9191a8a21ba6c8d1147afe215。后续继续整体实玩瓶颈，避免扩护壁变体；没有新增硬阻塞或必须用户选择的方向。

最终核验：1234/1234完整、21/21新专项、44/44统一Chromium首轮通过；582脚本语法、155模块/173引用通过。72旧完整报告原始JSON零排除一致，原全部技能/装备、五冻结条目/压缩字节、174既有运行文件/原图与交接历史保持；新路线29/目标87精确计数已核对。

执行盘：本轮打包前共享32GB盘可用约2.6GB，目前足够完成本轮；后续请核对空间，未清理任何旧交付或验证证据。
