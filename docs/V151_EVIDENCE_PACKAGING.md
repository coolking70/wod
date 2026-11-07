# v151证据和源码恢复

本轮交付目录`/workspace/wod-delivery/v0.151-complete-action-outcomes`。最终manifest、SHA256SUMS、restore-check和push-verified是确切提交/远端/校验结果；源码文档不硬写尚未生成的自引用SHA。

源码恢复使用已保护的v149独立完整bundle、v150增量和本轮v151增量，按顺序fetch，再切换本轮分支。v151增量依赖v150，不能单独使用。本轮另有v150-to-v151二进制补丁。离线验收应比较完整提交历史、全部tracked blob、全部旧heads和六retained引用，执行fsck、精确补丁树及还原源码的专项/归档/留存测试；不依赖GitHub在线认证。完整包和增量的确切文件路径及SHA在restore-check中，不删除先前保护链。

证据主ZIP使用已有`wod-checkpoint-stage/version1`，索引`v151/.stage-evidence-index.json`。保留58个原checkpoint ZIP的完整原字节；原CP的CRC、SHA、全部内层文件和图像、完整JSON、实际导出时间/ID、文件模式和纳秒时间不得裁剪或规范化。失败日志、修改前截图、未复现的合流全灭实验、15项专项初次夹具失败均随本轮证据保存，不能只打包成功结果。

78份原始历史JSON基线沿用v149主证据归档的原字节和SHA引用，归档SHA为82419463c1437fce3af416ff7c83685f950e3f91e04f881cc195b00af0759835。本轮重新计算比较，不重复保存数百MB相同历史字节。修改前runtime来源77ffda1，200个原dist文件精确提取校验；新84/85完整报告/待领/公会与其冷恢复代码比较。正常最终整档/四键另保留在本轮browser-final供直接接续，不能用后续实验配置冒充正式档。

完整主ZIP封装并校验后，先把58个CP全部实际恢复和逐件核对，再清理临时重复CP。随后对`/tmp/wod-evidence/v151/acceptance`运行版本管理的`retire-archived-evidence.py`：plan需准确主归档SHA，prove实际逐文件恢复，dry-run检查，再显式apply；全文件和文件/目录元数据、原路径指针与后置计划/证明/收据必须保留在交付校验清单内。后置收据不声称已经封装进先前不可变的ZIP。

源文件变化、存在任何未覆盖路径、符号链接、失效证明或空间不足时整组拒绝。不得为清空间删除唯一失败证据、v134/136完整当前快照、六旧引用或私有/未匹配代码包，不做GC/prune。历史v143时间/ID缺口不声称追溯修复。final独立审计重新核对主ZIP、全CP原字节/内层数据、缺失的已退役原路径与严格计划一一对应，以及全部交付SHA、恢复链和远端。

本轮不集成main或部署；main保持v149，v152–154功能闭环按用户授权重查最新远端和完整门禁再评估集成。补给经济待用户；后续先预算双盘峰值与打包/恢复所需余量。
