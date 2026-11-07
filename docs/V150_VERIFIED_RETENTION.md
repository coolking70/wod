# v150 · 可验证的验收留存

本轮优先解决云端持续开发的真实瓶颈：主盘原只余1.47GiB，临时盘1.18GiB。新增scripts/retire-archived-evidence.py，将历史手工维护变为明确的审计、物理恢复证明、默认试算及显式清理。游戏的全部200个dist文件、既有687份运行/脚本/测试输入原字节保持；没有新玩法、参数、存储结构、物品或新正常远征。正式测试档仍沿用v149的9110金币/next84，不把回归重演计为新奖励。

## 安全边界与使用

工具只接受/workspace/wod-evidence或/tmp/wod-evidence下v数字/acceptance目录，拒绝Git目录、符号链接、路径越界、非普通文件、不匹配/缺失文件、变更后的数据/模式/纳秒mtime、不匹配的恢复证明及空间不足。不是任意目录清理工具。只读计划要求已核验主ZIP的SHA，核对全ZIP CRC、每个所选文件SHA、精确路径集合和元数据；旧扁平ZIP和wod-checkpoint-stage/version1嵌套ZIP都支持。

```sh
python scripts/retire-archived-evidence.py plan /path/verified.zip /tmp/wod-evidence/v150/acceptance --expected-sha VERIFIED_SHA256 --out /path/new-plan.json
python scripts/retire-archived-evidence.py prove /path/new-plan.json --out /path/new-proof.json
python scripts/retire-archived-evidence.py retire /path/new-plan.json --proof /path/new-proof.json
python scripts/retire-archived-evidence.py retire /path/new-plan.json --proof /path/new-proof.json --apply --receipt /path/new-receipt.json
python scripts/retire-archived-evidence.py restore /path/new-plan.json --target /path/recovered-cache
```

没有--apply只试算。计划/证明/收据必须是缓存外的新文件，不能覆盖旧资料；保留计划与不可变主归档。证明逐件创建真实新文件，复核内容、权限和纳秒mtime，随后才移除新建证明副本；不读原缓存内容作为恢复来源，也不宣称同时保留全目录。清理前重新核验主归档、证明指纹、全部当前路径/文件和目录元数据，任何额外文件或变动都整组拒绝。最终版本会在删除前fsync备份并持久化元数据。若操作中断，保留的归档/计划可恢复缺失文件，既有内容/元数据不同则拒绝覆盖。

## 旧归档未覆盖PNG的实际发现

v134旧主ZIP未覆盖acceptance中的66个PNG路径；v136未覆盖72个。两次严格计划拒绝的日志保留，未绕过集合断言直接清理。原ZIP继续原位、原SHA保存；本轮另外为当前可访问的完整目录生成独立快照，包含所有文件和文件/目录模式及纳秒mtime，再逐件恢复证明，才退役原重复目录。之后又仅用各自新快照和预期SHA，在空目录同时恢复整棵目录并独立比对全部数据/元数据，不依赖原缓存或外部计划。

| 当前目录快照 | 文件 | PNG | ZIP字节 | SHA256 |
|---|---:|---:|---:|---|
| v134 | 807 | 66 | 148100549 | 94914d146e58bcdae05becba507465d9c61e0a546350d3d3c11f7f5740d289e8 |
| v136 | 859 | 72 | 166696169 | 1c6b63740b4eff19ddb17f7d238885f431af0b93f8d9b3fecb3f91db263b67f8 |

路径在/workspace/wod-delivery/v0.150-verified-retention。扣除两份新快照，主盘净释放2327023616字节；其他直接/失败实验目录不动。这是保全当前仍可见资料，不将旧ZIP描述成原先已完整覆盖PNG，不声称恢复此前已不可见的数据；历史v143失败导出时间/ID缺口仍未修复。

```sh
python scripts/retire-archived-evidence.py snapshot /workspace/wod-evidence/v134/acceptance /path/new-complete-snapshot.zip
python scripts/retire-archived-evidence.py restore-snapshot /path/new-complete-snapshot.zip --expected-sha VERIFIED_SHA256 --target /path/recovered-cache
```

独立快照以wod-acceptance-snapshot/version1的内置.cache-source-metadata.json保存精确元数据，不裁图、不摘要报告。snapshot先预算未压缩大小及100MiB余量，完成全内容/元数据和源目录不变验证后独占创建目标，拒绝覆盖。恢复可直接只用快照+SHA；新旧主ZIP和六个旧Git引用均保留。

## 后续阶段的留存方式

57组既有浏览器仍全部运行，每份原checkpoint ZIP字节仍原封保存在wod-checkpoint-stage/version1主证据包中。主归档封装、完整CRC/SHA及恢复验证后，先退役精确临时CP副本，再通过本工具计划/证明/显式清理整组临时acceptance展开目录。完整内容和必要失败记录保留在可验证归档；未被主归档覆盖的新文件会阻止整组清理。独立直接失败目录仍留存。后置计划/证明/收据和原路径指针都列入交付校验清单，不能只留一个无法恢复的压缩包名称。

旧基线不重复复制：本轮重新计算核对78份完整JSON及33默认说明，原始基线保留于v149主证据ZIP（SHA82419463c1437fce3af416ff7c83685f950e3f91e04f881cc195b00af0759835）和当时原路径，本轮保存对比清单与该依赖，覆盖不减。完整源代码通过149独立完整bundle+150增量离线恢复，不再每阶段制造约53MB的重复全量代码包。

实际空间处理的原型及21项测试、原型SHA、实际计划/证明/原目录元数据全部留存；版本管理代码增加了备份与元数据fsync，其资格/字节/元数据协议不变并单独通过21项测试。不能把未运行的步骤称为通过。

## 主动核验收藏容量，非用户故障报告

按明确要求，仅在独立浏览器测试档副本恢复v149正式测试快照，正式文件SHA不变。五份收藏793208/800000编码字符，仍有6份名额中的一个空位，但只剩6792字符。第83份报告raw2892460字节、gzip-units-v1压缩34452字节、编码45936字符；若加入，总量839144，超39144。

实际界面拒绝并提示“未能收藏：收藏容量不足，请先导出并移除旧快照”。拒绝和导出新完整报告后，原五份及四存储键原文不变，导出与明确移除入口仍可见，未执行删除或扩容。保留截图、完整导出和RESULT.json；没有假设用户实际遇到了这个问题。

## 验证范围

21个Python安全/恢复/容量用例通过一个Node入口纳入完整套件；本轮完整Node测试目标1418（包含该入口），以及全部57组既有浏览器。另有独立390px收藏容量核验。所有最终计数、失败/拒绝记录、恢复和推送以V150_CHECKS.json及交付收据为准。其他浏览器内核/真实设备未测；永久补给方案仍待用户决定。main保持v149，本轮仅推送阶段分支，下一集成窗口152–154。
