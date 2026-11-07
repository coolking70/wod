# v156 · 可持续证据留存

主盘初余约1.50GiB，主因是旧主盘验收缓存。旧128/129/130/131/133/135验证ZIP均没有对应当前PNG，不得仅因源码已推送就删这些文件。本轮一次性把六个当前acceptance根保存为包含全部JSON/截图/日志及文件与目录模式/Ns的持久独立快照，保留旧验证ZIP，未通过重新跑测试来替换旧内容。

维护目录/workspace/wod-maintenance/2026-11-07-sustainable-evidence-v156，MANIFEST.json/SHA256SUMS包含74份维护文件与快照的确切校验。先在/tmp生成快照并完整CRC/SHA验证原缓存未变，按实测大小且主盘保留1GiB才复制到新持久文件并fsync。之后只从持久ZIP逐文件物理恢复、模式/mtimeNs核对，再独立逐条比原件、dry-run和严格apply。仅退役已完整证明可恢复的原缓存及/tmp相同ZIP临时副本。

4621个文件、364PNG全部保留；退役7113994081逻辑原始字节，新持久快照873053152字节，实测主盘净释放6249181184字节，约5.82GiB，结束余约7.32GiB。18770份其他旧证据/交付文件元数据、8项源码链文件与155规范档/149及155主验证包SHA、全部722源输入与heads/六旧引用核验不变。未删旧验证ZIP、任何源码容器、历史引用，不做GC/prune或远端写入。

每个vNN目录有snapshot、retention-plan、physical-proof、independent-before-retirement、retirement与日志；原版本目录增加ACCEPTANCE_RETIRED_<计划SHA前12位>.json，指向持久恢复链。旧报告关于原路径存在的记录是当时快照，不再当作当前文件清单。

需要旧缓存时先读对应计划的logicalBytes并预算原始大小+至少1GiB余量，不要一次恢复所有六份。可用当前仓库scripts/retire-archived-evidence.py（维护目录另存相同工具）执行：

    python3 /workspace/wod/scripts/retire-archived-evidence.py restore /workspace/wod-maintenance/2026-11-07-sustainable-evidence-v156/v128/retention-plan.json --target /workspace/wod-evidence/v128/acceptance

将128换成其他已封存版本。亦可恢复到新的/tmp目录做分析，需同样检查容量。原文件字节、模式与Ns精确还原，不需重跑当年的测试或修改真实时间/编号；已有不同文件时拒绝覆盖。新持久快照和原验证ZIP都保留，不能据分支已推送就删仓库外证据。

后续小版本采用受影响完整GUI套件+完整Node，保留首次失败原CP；完整功能里程碑才跑全套GUI。新运行器在发现非空输出目录或已有CP时先拒绝，须用新attempt标记重试，防止同名结果被覆盖。源码主链152完整+153/154/155/156增量，备用149完整+150至156增量；两独立完整基线及六旧引用保持。阶段封存使用既有原CP主ZIP、完整物理恢复后才退役临时重复，不再每小版复制完整历史证据。
