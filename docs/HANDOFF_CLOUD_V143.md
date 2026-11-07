# 云端交接 v0.143

仓库`/workspace/wod`，阶段分支`feature/v143-escort-objective`，基线v142`37c14cfe3eb8edcc4feb1820867b3274c87f910c`。先读[V143实现](V143_ESCORT_OBJECTIVE.md)、[冻结方案](V143_PLAN.json)、[验证](V143_CHECKS.json)、[存储/Git约定](CLOUD_STORAGE_AND_GIT_POLICY.md)。main集成最终状态、准确SHA和删除引用以交付目录的收据为准，不用静态文档猜测。若143成功集成，下一评估窗口146–148；若遇阻，保留阶段分支，不强推。

先处理临时盘：没有遗留Git参考工作树；只有旧大型验收原件缓存。v138/v139的1863文件逐项与主盘完整ZIP的路径/大小/SHA/CRC相同，代码为已验证远端main祖先，云工作树干净。仅退役这两份/tmp重复缓存，实测释放2975588352字节约2.77GiB；原ZIP、完整恢复链、旧ref和失败资料不删。维护记录`/workspace/wod-maintenance/2026-11-07-tmp-retention-v143`及本轮证据maintenance副本，包含完整索引、退役收据和精确restore.py。旧审计“原件仍在”是当时快照；现在若需重跑依赖原/tmp路径的历史审计，先用restore.py恢复对应缓存并检查容量。临时parent中的CACHE_RETIRED.json也有指针，不声称旧原路径仍存在。

退潮护送evacuation两房/30携带预算，新增一个独立非战斗NPC，仅在这条路线进入场上。正式队员仍6人，NPC不做任何预备/普通/先攻或获得资产/XP，受击可防御；它的90HP跨房，效果依原期限；死后本次止步，当前完整施放仍结算所有目标，普通部分奖励保持。不能只剩NPC继续打。治疗/援护/位置人数上限沿用原规则，全体max6不会自动覆盖第七位。场上/HUD与伤员救护时序读真实快照，不添加预测数值。报告额外escorts只用于新路线，旧完整报告零字段排除不变；NPC新档需143程序。

Native正式终档7920/next72：70默认3/3、伤员90、六人生还、余9草4符2箭，普通140金55XP；71明确后排护印/80%后排救护2/3、伤员90、六人、余10草4符4箭，100金45XP。70治疗60且一次援护NPC，71治疗33无NPC援护尝试，不作单项归因。无新购买/培养/装备/职责或本人变化，六位活跃成员各100XP，候补A全字段不变，仓库/五冻结793208字符/旧首证保持；只新增evacuation/survive70。

证据`/workspace/wod-evidence/v143`，大验收原件`/tmp/wod-evidence/v143/acceptance`。正式公会`escort-final.json`、整档`browser-final/escort-final-campaign.json`、四原文`browser-final/escort-final-four-raw-keys.json`；三方案（原两份＋71后排方案）和旧A完整保留。四个浏览器上下文：正式70/71、第三恢复/重演、第四独立无奖励实验（默认731跨房46HP、失败seed1六人尚存/NPC倒下）；后者不当作正式终档。8确认全部配置/全报告在confirmation，组包不同不能称独立因果，未改正式编号。

复验`node --test tests/*.test.mjs`、`node --test tests/escort.test.mjs`、`node scripts/verify-release.mjs`，新空目录先check-v143再browser-v143；统一51组用独立/tmp目录+主盘完整逐组ZIP，SHA/CRC逐文件核查。首轮专项两个测试夹具错误（初始金币实际0、收藏条目需完整元数据），完整首轮一项目录.unique.size仍29，均修正精确期望，没有放宽容量、资产或战报断言。前三轮浏览器分别误用隐藏战场/证据页及实验后未回准备页，完整失败资料保留；按实际入口操作，不强制点击隐藏控件。

本轮达到143里程碑，先检查最新远端main/差异/祖先关系、同最终代码完整回归/51浏览器/数据与离线恢复，再安全快进main；冲突、新远端工作、门禁失败则停止集成。正常推送阶段分支，不做部署。本轮最新委派要求保留旧引用，因此141/142即使已合并也保留，不执行分支删除。后续周期清理须再核对当时授权、合并与恢复状态，不把元数据分支删除当释放大块磁盘的方法。6份retained旧引用须保留且不擅自公开，不GC/prune。

恢复交付路径`/workspace/wod-delivery/v0.143-escort-objective`。合并前先用140完整+141/142增量+本轮增量证明可离线恢复；合并后生成独立143完整包，包含全部正式历史及6旧ref，主盘完整证据ZIP和校验清单另存。准确文件/SHA/状态看manifest及restore-check，不把临时盘当持久备份。永久补给待用户决定；下轮开发先检查双盘预算，优先真正核心体验，不继续堆护送小变体。

证据限制：第三失败与第四成功的原导出时间/随机第三方案ID未按轮次保留，后续覆盖，无法补回原字节；evidence-gap.json明确范围。日志/脚本/截图/API状态保留，第五轮已有整套快照，最终成功以browser-final独立目录为准。文件导入须等完整配置原文入库后再断言，不能凭setInputFiles返回认定异步处理完成。顶部旧手写路线选项遗漏多条路线，现由EXPEDITIONS生成30项；修前已执行及在途前缀按selector-recheck-plan在独立目录重跑，保留原统一失败/原件，最终51组由最终代码成功记录选取。
