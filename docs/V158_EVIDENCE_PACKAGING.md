# v158完整里程碑证据

交付/workspace/wod-delivery/v0.158-expedition-milestone。保留全部本轮当前65GUI的原始CP字节及任何失败重跑。CP完成时就在主盘；raw在/tmp，逐文件内容/模式/mtimeNs校验后封存到单一不可变master。全部CP物理恢复、完整SHA/CRC和raw严格plan/prove/dry-run/apply通过后才回收重复件；后置指针和收据单列SHA，不能修改master或排除失败证据。

v156维护根/workspace/wod-maintenance/2026-11-07-sustainable-evidence-v156内六快照与清单继续独立保留，并引用实际SHA；不再复制873MB进本轮包。旧149/155/156/157主包、源码完整149/152和全部小增量、六retained仍保留。旧时间戳/ID字节缺口不会因新验收重写而被宣称修复。

源码两个离线恢复链先在main155状态比所有文件/正式历史/heads/私有六引用，完整门禁后再独立证明预计快进main到同一候选树。阶段分支正常推送、最新远端无冲突且安全后才尝试main；所有结果以独立收据为准。若生成新完整里程碑基线，须对新容器再冷恢复并更新当前可用恢复说明，不删除旧链。
