# v152证据和源码恢复

交付目录`/workspace/wod-delivery/v0.152-independent-mental-defense`。确切提交、远端和main结果以`manifest.json`、`SHA256SUMS`、`restore-check.json`、`push-verified.json`及`main-integration.json`为准。源码文档写完后才提交，不能猜自引用SHA。

本轮152增量依赖149独立完整、150增量、151增量，依次fetch再切本轮分支；另有151-to-v152二进制补丁。离线核对完整正式历史、全部tracked blob、旧heads与六retained引用、fsck、精确补丁树，执行19心理防御+3归档+1留存包装器共23项Node（包装器内21Python安全案例），再验证静态引用。完整功能里程碑可在本地main快进后生成一次独立完整152bundle，再离线恢复/校验全部引用；只有恢复证据和其他门禁通过才推main。其确切成功/失败和SHA必须独立记录，保留此前增量恢复证明及旧链，不每小阶段复制完整源码包。

证据主ZIP为`wod-checkpoint-stage/version1`，索引`v152/.stage-evidence-index.json`；完整保留59个原CP ZIP的原字节，以及首轮失败/API输入、专项首次失败、两组六固定输入/原声明、整档导出、JSON和截图。CRC、SHA、内层数据、真实时间/ID、模式/纳秒时间不裁剪或规范化。旧78基线继续依赖149主ZIP SHA82419463c1437fce3af416ff7c83685f950e3f91e04f881cc195b00af0759835，不重复复制数百MB相同字节。旧151冷提取201原dist逐字核验，默认78全JSON/33HTML原文比较。

正常最终campaign/four-keys保留browser-final直接接续。第三隔离上下文测试的第4方案、退款和再次恢复仅是独立副本，不能覆盖规范末态。最初6实验是草稿资产，追加6实验才是精确公会实装；两组不可混称。正式新86/87报告的收藏压缩/展开在内存清空副本验证，正式五项不变，不扩容、不描述为用户事故。

主ZIP封装完整验证后，先把59CP全部物理恢复逐件比对再清理临时重复CP。当前acceptance由版本化retire工具按准确ZIP SHA生成严格计划，prove逐文件物理恢复，dry-run再apply；必须全部覆盖字节、文件/目录模式/Ns。任何未覆盖、变更、symlink或空间不足整组拒绝。后置计划/证明/收据/原路径指针及main集成日志属于独立checksummed交付文件，不假称进入之前封装的不可变ZIP。最终独立审计将缺失的已退役文件逐项映射回主ZIP和计划，并核对所有交付SHA、恢复链及远端。

不删除旧唯一证据、149基线、134/136当前完整快照、六旧引用、reflog独有提交和保护恢复链；不做GC/prune或部署。历史143导出时间/ID缺口不称追溯修复；补给经济仍待用户。下一阶段先核对双盘峰值，使用已验证留存方案，避免重建相同完整包。
