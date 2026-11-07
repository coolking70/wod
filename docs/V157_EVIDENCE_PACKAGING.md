# v157恢复与证据范围

本轮源码增量、二进制补丁、两个冷恢复收据、远端准确SHA和校验清单在/workspace/wod-delivery/v0.157-mana-shields。主链152完整+153至157增量，备用149完整+150至157增量；不新建完整源码ZIP或bundle。冷恢复比全部1335或新增后的实际tracked Git blob、正式历史、heads及六保留引用，并运行55项新机制/探索/正式闭环/留存smoke；实际计数以restore-check为准。

验收只封存本轮11套完整定向GUI，不重复复制所有历史验收。所有13原CP ZIP字节（包括两次count34失败）和完整原始JSON/PNG/日志/时间及模式/Ns用wod-checkpoint-stage原格式保存，主ZIP先验证全部SHA/CRC，物理恢复13个CP字节，再依公开留存工具对每个展开文件plan/prove/dryrun/apply。不可变master不修改，后置收据与指针另列SHA。原API首轮seed误用及Node/浏览器断言失败记录全部保留。

156独立维护快照873MB只引用精确MANIFEST/SHA256SUMS和六ZIP，不重复打包；旧149与155、156主包和两条源码链均保留。主盘与/tmp按实际容量加安全余量预算，不删唯一证据和历史引用，不做GC/prune。本轮初次完整Node1559有7个旧目标总数102断言失败；修正到35路线×3=105后完整重跑，不将初轮写成全通过。64套全GUI留到158–160main完整门禁。
