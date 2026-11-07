# v145 · 单份完整checkpoint证据包

旧阶段所有原证据/恢复链不动。本轮统一验收每组仍由archive-evidence.py生成完整checkpoint ZIP，逐文件SHA和CRC核对；只是将临时输出放到/tmp/wod-evidence/v145/checkpoints，主盘保存进度/日志/摘要。

最终总ZIP以ZIP_STORED逐字节保存每一个checkpoint ZIP，不再次压缩。组内原始JSON、导出、图片、日志和纳秒时间戳索引全部仍在各原ZIP内；其他证据只保存一次。相同逻辑文件在主盘与临时盘的副本必须内容相同，索引记录每个来源的权限/mtimeNs。目录树不是将某份报告裁成摘要。

格式标识wod-checkpoint-stage/version1，索引v145/.stage-evidence-index.json。它与v143/v144的扁平.complete-evidence-files.json不同，不能拿旧清理脚本猜测新结构。包内保存工具副本，仓库工具为scripts/archive-stage-evidence.py，只用Python标准库。

```sh
python scripts/archive-stage-evidence.py verify /path/wod-v145-verification.zip
python scripts/archive-stage-evidence.py restore /path/wod-v145-verification.zip --root raw --sample-check
python scripts/archive-stage-evidence.py restore /path/wod-v145-verification.zip --root evidence --target /tmp/restored-evidence
python scripts/archive-stage-evidence.py restore /path/wod-v145-verification.zip --root checkpoints --target /tmp/restored-checkpoints
python scripts/archive-stage-evidence.py restore /path/wod-v145-verification.zip --root raw --target /tmp/restored-raw
```

完整restore需先确认容量。verify重读所有外层/内层数据并核SHA/CRC、路径集合及内层原索引，不依赖原文件仍在；--check-sources才额外要求所有当时原路径存在。restore先核全包及全部目标冲突，已有不同字节或软链接越界都拒绝，不覆盖；新文件还原原权限和纳秒mtime。已有相同字节复用，不改它已有的元数据。

只有总ZIP封装、全内容验证、完整checkpoint集合恢复及raw/evidence抽样恢复通过，且每个临时checkpoint仍与包内字节一模一样，才能退役这些临时重复ZIP。操作收据留在交付目录，原路径放CHECKPOINT_COPIES_RETIRED.json及工具指针。此后旧运行日志中的临时路径是历史快照；需要该路径时用总包恢复。raw原件、主盘总ZIP和全部旧唯一证据保留。不GC/prune或删除旧Git引用。

正常组/失败组一律完整保存；每次直接浏览器尝试使用新目录，仅读共享只读API夹具（WOD_API_DIR），不为每次尝试再复制所有报告。新API JSON采用无损紧凑序列化，重复的before/claimed完整状态用aliases指向同一已保存对象；原四键、原导出时间、方案ID和完整报告内容不改。准确实测大小、恢复结果与清理状态以交付收据为准，静态文档不预先宣称退役已完成。
