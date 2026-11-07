# v150云端接续

先读[V150留存流程与实际发现](V150_VERIFIED_RETENTION.md)、[检查](V150_CHECKS.json)、[证据包](V150_EVIDENCE_PACKAGING.md)。当前目录/workspace/wod，远端https://github.com/coolking70/wod.git；预置BrogueJS不改。新增源工具scripts/retire-archived-evidence.py，测试tests/test_evidence_retention.py经tests/evidence-retention.test.mjs纳入完整Node套件。

本轮没有新正常远征/玩法或存档变化；正式测试末态沿用v149的9110/next84、本人E、活跃beryl/B/C/D/E/F、候补A。三方案/A、五冻结793208字符和全部正式资产不改。下一玩法阶段可从automaticPreparationLoop().final继续，来源runs[1].config重置seed731；B显式拆解→射击且应急仍开启，既有规则不变。

正式游戏整档仍为/workspace/wod-evidence/v149/browser-final/preparation-final-campaign.json；四键为同目录preparation-final-four-raw-keys.json。v150容量核验仅恢复独立副本，第83份45936字符超过余量6792，拒绝后原五份与四键原文不变；不是用户已报告故障，未扩容或删除。

恢复首选保护的v149独立完整bundle fb6525dc90e73dead55c8ed0e494374284439c59046064d459bb27b50315e704，加v150增量。确切文件SHA/HEAD/分支见/workspace/wod-delivery/v0.150-verified-retention/restore-check.json和manifest.json。main本轮保持e776f1197fe4d557b8ef0fb4b92d05008f6ce45e，下一152–154完整里程碑再核最新远端和集成门禁。无部署、强推、GC/prune或旧引用删除。

存储维护在/workspace/wod-maintenance/2026-11-07-retention-v150和本轮evidence/maintenance。v1471258个临时文件按既有主ZIP完整文件恢复验证后退役，释放2019340288字节；原文件模式/Ns由旧索引保留。v148/v149也按嵌套原归档+物理恢复证明退役1305/1336个临时文件，实际结果见各receipt，不假定旧路径仍存在。原主ZIP、直接失败实验、六旧引用、私有/未匹配代码包及保护恢复链保留；未找到额外符合远端完整重建条件的大型冗余代码包。

v134/v136旧主ZIP未覆盖各自66/72个PNG路径，不能直接当完整缓存备份清理。本轮另建含当前完整原件及文件/目录Ns的独立快照，807/859文件、138PNG全备份；完整恢复后才退役旧展开目录，净释放主盘2327023616字节。旧主ZIP不改，其他失败目录不动；新快照是当前可见数据，不追溯恢复此前已覆盖的旧数据。原型和最终fsync增强版本关系在prototype-and-final-source.json，日志与实际SHA均保留。

后续不降低回归覆盖。每组原CP ZIP仍完整保存一次，最终主ZIPCRC/SHA/CP恢复及原件一致通过后，才能退役CP重复件；再用留存工具计划、全文件物理证明、显式apply清理临时acceptance。后置计划/证明/收据和原路径指针应随交付校验保存。若源文件/目录元数据改变、存在未覆盖文件或空间不足，整组拒绝，不删断言、不跳过证据。旧扁平ZIP没有完整Ns时先保留原件并建立独立完整快照。

全部200dist文件和既有687测试输入保持原文，本轮新增3工具/测试文件，总690。78完整JSON原始基线依赖v149主证据归档并保持原路径；本轮重新计算比对，不重复保存大批完全相同的历史基线。下一轮先核容量，若不够安全完成则暂停大量数据任务；永久补给仍待决定，不擅自实施。
