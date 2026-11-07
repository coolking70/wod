# 云端交接 v0.141

仓库`/workspace/wod`，分支`feature/v141-mana-regeneration`，基线/main v140`f04c10b435694876aed9a8940fce80a9f21276e2`。先读[V141实现](V141_MANA_REGENERATION.md)、[冻结方案](V141_PLAN.json)、[验证](V141_CHECKS.json)、[空间/Git约定](CLOUD_STORAGE_AND_GIT_POLICY.md)。阶段提交与远端SHA以交付manifest/推送收据为准；本阶段不归并main，窗口v143–145。

自然MP在预备后、先攻前按基础+1和有效manaRegen相加、0..maxMP截断；无修正保留旧事件路径。新吟游普通技能chorus（合拍疾歌）4MP/无材料/乐器/阵位最多3名，当前及下一回合行动+1和回复-2；是固定组件，不因普通等级/属性提高，本轮不进行新培养。0MP不撤销增益；不是续付门槛。伴随代价不能单独净化，破印整组删除，旧已排队行动/损失不撤销。原节拍和独立进阶不互斥。

Native终档7485/next68：66章节六人3/5/4/3/5/9、9草0符17箭，首通280金120XP+法器；67邮路六人4/4/8、0草3符2箭，135金55XP+邮铃。没有新购买/培养/课程/职责/换装。保留21旧首证，新增章节survive66；五冻结条目793208字符不变。历史67..48，55失败保持，47正常滚出但冻结仍能全量导出。

证据`/workspace/wod-evidence/v141`，新原始统一验收`/tmp/wod-evidence/v141/acceptance`。终档`regeneration-final.json`，完整玩家备份`regeneration-final-campaign.json`，四原始键`regeneration-final-four-raw-keys.json`。准备种子章节默认1/邮路731，正式66/67；scripts/check-v141分别保存`*-preparation.json`与`*-config.json`，不要将准备种子硬改来匹配正式编号。

复验`node --test tests/*.test.mjs`、`node --test tests/mana-regeneration.test.mjs tests/report-pool.test.mjs`、`node scripts/verify-release.mjs`。新空目录运行check-v141和browser-v141；只读使用BrogueJS中的Playwright，loopback8002静态dist。统一49组用独立/tmp目录和主盘WOD_RECEIPT_DIR，逐文件SHA/CRC核验全部原件/图像并封存主盘ZIP；不覆盖失败摘要。

六份旧报告只允许新增E技能表chorus6，其余JSON字节严格相同。真实冻结原件不加字段；新鲜47压缩度量变化与两个已声明目录项由独立旧原件比较证明，不能扩大字段排除、改容量或删原五条来过测。来源索引Map值是`{index,source,targets}`对象，新增链接读取真实index，测试不要伪造数字Map。首次种子夹具错误、第二次链接缺陷日志/截图/脚本全部留存。

原版依据仅官方Mana公开索引，正文403未绕过；结构与具体新技能/参数分清，不选择当前服务器。永久补给经济仍待用户。基础自然+1、同位受益者成本和零MP保留增益均为项目改编。

最近完整恢复基线：`/workspace/wod-delivery/v0.140-personal-mana-reserve/wod-v0.140-complete.bundle`，SHA256 `84d7c048546df8192902ab3161aa28bfa9a8d86a06b60870e059d0c0931f0a9d`，内含完整正式历史和六retained旧引用。v141使用增量，不再重复完整源码ZIP/bundle。旧链也保留。临时v140参考dist如已清理，可由确定f04c10b…的Git archive dist重建；不做worktree prune。

后续可正常推送验收后的阶段分支，v143–145完整里程碑重新检查远端、完整回归、关键浏览器闭环、资产及恢复门禁再评估main。只删确认已合并且可恢复的冗余分支，不强制改写保留分支，不运行GC/prune/部署，不删除唯一证据。开始下一阶段检查双盘预算；避免不断扩更多同型法力技能。
