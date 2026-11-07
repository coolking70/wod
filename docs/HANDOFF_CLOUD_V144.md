# 云端交接 v0.144

仓库/workspace/wod，分支feature/v144-channeled-casting，基线v143 4d5435bfd494d323ef420ea75e45d3efe9759a10。当前准确提交、推送和恢复状态以交付目录manifest/push-verified/restore-check为准，避免静态自引用SHA。先读[V144](V144_CHANNELED_CASTING.md)、[冻结方案](V144_PLAN.json)、[检查](V144_CHECKS.json)、[存储约定](CLOUD_STORAGE_AND_GIT_POLICY.md)。main保持143，下一评估窗口146–148。

开发前完整核验并仅退役140/141的1997个/tmp重复原件：逐路径/大小/SHA/ZIP CRC一致，代码为远端main祖先，原ZIP/全部旧ref/恢复链保留，实测释放3286044672字节约3.06GiB。维护/workspace/wod-maintenance/2026-11-07-tmp-retention-v144含逐文件索引、收据和精确restore.py；两版最大JSON/图片恢复抽检成功。CACHE_RETIRED.json指向主盘ZIP。旧审计原路径是历史快照，重跑前需先恢复并核容量；不要将/tmp当独立持久备份。

本轮只有固定敌方模板允许windup。起始付款占普通行动，待起始回合+rounds后的首普通行动释放原技能，维持占各行动；死亡/房末取消，不退已付费用。释放重新选活目标，用当前属性/技能，成本0，来源记录关联原支付。敌方预备/自然回蓝/防御仍照常，不把蓄能当buff或让削蓝撤销已付款。release与真实cast/hit一组；start/hold各自独立，不能误并上一位英雄的行动。伤害、援护、免疫等沿原引擎。不增加玩家技能/配表项，英雄注入被拒绝。

Native正式终档8090/next74，72默认4回合承接释放/73后排抢攻3回合来源倒下；两次六人，普通收益170金币70XP，仅新增pressurevault/survive72。候补A、资产及原五冻结全保留，计划册原三方案和A原文未改。正式源文件/workspace/wod-evidence/v144/api-final/channel-final.json；下一轮准备源channelLoop().runs[1].config后seed731。最终整档与四键在成功浏览器目录，详见manifest，禁止误用失败轮备份。小夹具scripts/fixtures/v143-preparation-state.json包含三个既有方案，新阶段最终配置需从实际四键生成，不能退回v142两方案夹具。

专项node --test tests/channel.test.mjs；API用WOD_EVIDENCE_DIR指定新目录运行check-v144，随后browser-v144。每次浏览器尝试使用全新输出目录，先复制只读API数据；失败时保留全四键、整档、DOM、截图与日志，不覆盖前轮的导出时间/随机ID。统一验收52组（76/77/94…144）包含原51组。先冻结最终运行代码再启动，任何后续运行代码变更都要核查哪些在途/已运行检查需要重做；脚本修正不冒称应用缺陷。

证据/workspace/wod-evidence/v144，大验收原件/tmp/wod-evidence/v144/acceptance；交付/workspace/wod-delivery/v0.144-channeled-casting。增量包依赖143完整包即可，无需140–142旧链；旧链仍保留。所有旧功能分支与六retained引用本轮保留，不GC/prune、不公开私有旧ref。不要创建巨型临时代码副本，参考快照优先git archive。下一完整验收前再核双盘预算，必要时只按索引核验退役可重建重复缓存，保留唯一失败证据。
