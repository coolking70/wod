# v149云端接续

先读[V149实现](V149_AUTOMATIC_PREPARATION.md)、[检查](V149_CHECKS.json)、[存储/Git政策](CLOUD_STORAGE_AND_GIT_POLICY.md)。目标仓库仍https://github.com/coolking70/wod.git，工作区/workspace/wod，预置BrogueJS不修改。源文件直接位于dist，不需安装或打包；本地8002服务不是部署。

实际最新提交、恢复链和main结果见/workspace/wod-delivery/v0.149-automatic-preparation的DELIVERY.txt、manifest.json、restore-check.json、integration.json，避免猜测尚未产生的SHA。本轮处于149–151已授权集成窗口，先完成最终门禁再尝试普通安全合并；若成功，下一窗口152–154。禁止强推、GC/prune和部署。

末态9110金币/next84、本人E、活跃beryl/B/C/D/E/F、候补A。接续用automaticPreparationLoop().final，来源runs[1].config重置seed731；B仍启用应急，但已显式repeat拆解→射击，所以拆解不列自动候选。正常83零应急，不宣称一定触发。真实整档/四键在/workspace/wod-evidence/v149/browser-final/preparation-final-campaign.json及preparation-final-four-raw-keys.json；旧三方案/A通过scripts/fixtures/v148-preparation-state.json保留。

普通技能自由培养、独立后期进阶、可切换本人和小规模招募名册保持。永久补给待用户决定。本轮只解释既有规则，不预测未来目标/MP/库存/存活/最终选择；公会必须使用实际readiness配置，不能授予草稿装备。齐射未声明弓要求是既有目录事实，本轮不改变它；装备差异验收用明确声明需弓的破甲重箭。

验收前清理有完整审计：v1461229个临时重复文件从主ZIP逐件实际恢复，内容/权限/纳秒mtime精确后退役，实测释放1980846080字节；主ZIP c476556b016ec5a345a8a1b04d8f8d46dd08a0614f1ab6360c3163c61a17b2ed不动。另16个旧代码ZIP/bundle经独立GitHub克隆验证全文件树或全部packed objects，再实际重建源码ZIP，退役357168039逻辑字节，主盘实测释放355786752字节。旧SHA256SUMS保留为历史记录，旁有CODE_PACKAGES_RETIRED_V149.json指向索引与重建说明；不应将退役代码包当作意外丢失。

远端未覆盖的v101源码ZIP、v127旧源码/私有提交包、含六私有引用的v140/v143完整包均保留；六个本地retained引用与146完整+147/148增量验证链不动。新149若集成成功会额外保留独立完整包，具体以收据为准。历史v143原失败导出时间/ID缺口未声称修复。

证据继续wod-checkpoint-stage/version1，新索引v149/.stage-evidence-index.json。原CP ZIP逐字节嵌入并完整物理恢复后，才能退役这些临时重复ZIP，原始报告/图片/导出留存。用scripts/archive-stage-evidence.py verify或restore --root checkpoints/raw/evidence，先核容量，不用旧扁平解析器。下一阶段完整验收前重算双盘，不能把当前余量当永久充足；优先核验已归档重复缓存，不删唯一证据。
