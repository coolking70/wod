# v153源码和证据恢复

交付目录/workspace/wod-delivery/v0.153-nondamaging-control；确切commit、tree、推送SHA和校验见manifest、SHA256SUMS、restore-check、push-verified。

源码使用已核验v152独立完整bundle加本轮153增量，先fetch152所有heads/retained，再验增量依赖并fetch本轮分支。另有152-to-v153二进制补丁，须产生相同Git tree。实际冷恢复验证每个tracked blob、完整正式历史、全部本地heads/六retained、fsck和25Node专项/归档/留存测试（一个包装器内21Python）；不重复生成完整包或源码ZIP。保护旧备用完整包、增量依赖、两个未匹配源码ZIP和唯一证据，未发现可直接删除的无独有内容大包。

证据格式wod-checkpoint-stage/version1，索引v153/.stage-evidence-index.json；保留60份原CP ZIP全部原字节、内层文件/截图/JSON/实际导出时间ID/模式/Ns。所有初次夹具失败、首轮浏览器超时、原始正常与六有限输入完整报告都保存。78历史原始基线继续依赖v149主ZIP SHA82419463c1437fce3af416ff7c83685f950e3f91e04f881cc195b00af0759835，引用原字节，不重复复制相同数百MB。比较只允许严格核对新增E.skills.taunt6，不能笼统删除所有技能字段或排除未知差别。

先封装完整主ZIP并逐CP/CRC/SHA验证，60CP全部物理恢复核对后才退役重复CP；对当前/tmp/wod-evidence/v153/acceptance再用版本化retire工具plan→所有文件逐件物理恢复prove→dry-run→apply。必须全覆盖路径、字节、文件/目录模式/Ns；变更、符号链接、未覆盖或空间不足整组拒绝。后置计划/证明/收据/原路径指针必须独立checksummed，不声称进入此前不可变ZIP。最终独立审计将退役文件逐项映射回ZIP和严格计划，并重核远端、源码输入及恢复链。

正式browser-final四键和整档保留供直接接续；新报告压缩/展开仅清空内存副本，原五冻结793208字符及三方案/A保持。不删旧唯一证据、六旧引用或恢复链，不做GC/prune/部署；main保持152，155–157窗口再评估。永久补给待用户。
