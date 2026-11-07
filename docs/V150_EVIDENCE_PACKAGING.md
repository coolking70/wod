# v150完整证据及可验证展开目录退役

游戏验收主ZIP继续wod-checkpoint-stage/version1，索引v150/.stage-evidence-index.json；57个原始checkpoint ZIP逐字节保存，原报告、PNG、导出时间/ID与文件Ns不裁剪。archive-stage-evidence.py的pack/verify/restore及3项测试不改。

新增retire-archived-evidence.py管理已验证的acceptance展开目录：主ZIP完成全CRC/SHA、完整CP集合恢复及raw/evidence样本后，再生成精确计划、实际恢复所有文件并验证模式/纳秒mtime，最后显式apply。额外文件/变更/未知路径或空间不足拒绝整组清理。所有必要失败记录仍在主ZIP或原独立失败目录中，不因通过回归而删除失败证据。

本轮实际计划/证明/收据及原路径指针在交付校验清单中，主包封装后的这些记录作为明确后置收据保存，不能假称已在此前封装的ZIP内。独立复核应对已退役的raw路径，逐条匹配原归档对象、计划SHA/字节/模式/Ns和完整物理证明；不能在文件缺失时跳过校验或误报意外丢失。

v134/v136补建的独立当前acceptance快照是额外交付文件：wod-v134-complete-acceptance-snapshot.zip、wod-v136-complete-acceptance-snapshot.zip，含wod-acceptance-snapshot/version1内置.cache-source-metadata.json。它们解决当前仍可见PNG未被旧ZIP覆盖的问题，原ZIP和其他失败实验目录保持。可仅用各自快照和预期SHA执行restore-snapshot，无需原缓存或旁置计划；两份均已实际完整展开恢复并独立核对。

78份旧完整JSON基线属于v149不可变主归档，本轮重新计算比较并保存引用和校验清单，不在v150重复存放相同历史字节。其依赖SHA为82419463c1437fce3af416ff7c83685f950e3f91e04f881cc195b00af0759835，旧归档始终保留。源代码恢复是v149独立完整+v150增量，不重复生成全量代码包。精确提交、所有交付文件大小/SHA、清理后的容量及恢复结果以manifest.json、SHA256SUMS和实际收据为准。
