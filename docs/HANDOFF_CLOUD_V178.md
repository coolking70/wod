# 云端v0.178交接

代码：`/workspace/wod`，分支`feature/v178-loot-assignment-rehearsal`，基线177/da2f31074b4317f658e4afb492ed186e0cbe62e0，main保持176/9aedb3000c3d39c05c53d9fe87bc09292bf8e6ad。最终提交/远端SHA和实际恢复结果以`/workspace/wod-delivery/v0.178-loot-assignment-rehearsal/manifest.json`为准。无部署。

实现及所有测试局限见[V178说明](V178_LOOT_ASSIGNMENT_REHEARSAL.md)和[V178_CHECKS.json](V178_CHECKS.json)。正式档`/workspace/wod-evidence/v178/browser-final/loot-final-four-raw-keys.json`及`loot-final-campaign.json`：13770/next130/E5815/贝芮尔2700。原装备129有5人生还；不要自动用面纱成功副本覆盖正式档。五收藏793208、三方案/C/A与旧攻略保持，正常奖励仅新增1邮铃/1courier通关。

证据`/workspace/wod-evidence/v178`，临时原始`/tmp/wod-evidence/v178/acceptance`，主盘检查点`/workspace/wod-checkpoints/v178`；打包后临时重复物理副本可退役，具体指针见交付。11检查点含早期失败，不当成11全部通过。源输入874冻结；最终1715Node，8相关GUI范围（最初8全过，新房名修复后完整重跑178），全85未运行，179–181完整节点才评估main。

必须新增保护整个`/workspace/wod-maintenance/2026-11-08-native-cli-retention-v178`、18原master和18退役指针。此轮清理377可恢复native-first重复JSON，882163712字节，已有两独立整树恢复和18安全例；兼容复查还再次物理恢复18树。原早期字节只能按绑定归档恢复，不能用新代码重算替代。维护中的RESTORE.txt给出新空父目录恢复命令，不覆盖现有路径；元数据完整副本位于本轮证据space-maintenance。所有此前维护目录、v156六快照与清单、v147/148/167及其他绑定master、实验80战报、六个私有旧引用和源码恢复链保持；旧时间戳/ID缺口不称已修复。

下一阶段优先真实单人闭环和美术收敛，从129已领取终档接续130，不用试演替代正式出征。若179做完整节点，先重算双盘空间和最新GUI注册数，使用完整runner，完整回归/冷恢复/资料安全/最新远端祖先检查通过后安全合并main，禁止强推。不要每小版重复完整源码包或大份重复证据。永久补给经济待用户决定；旧172Library上传结果未确认，不重试/绕路上传。
