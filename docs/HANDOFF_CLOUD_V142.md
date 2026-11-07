# 云端交接 v0.142

仓库`/workspace/wod`，分支`feature/v142-guardian-reserve`，基线v141`ec4d1d779f0a46cb4dfce2c0612833892670f559`。先读[V142实现](V142_GUARDIAN_RESERVE.md)、[冻结方案](V142_PLAN.json)、[验证](V142_CHECKS.json)、[空间/Git约定](CLOUD_STORAGE_AND_GIT_POLICY.md)。阶段提交和远端准确SHA以交付manifest/推送收据为准。本轮main仍v140`f04c10b435694876aed9a8940fce80a9f21276e2`，下一完整里程碑评估窗口v143–145。

新增可选守卫beryl贝芮尔，3次结算/60金，零XP/培养、初始职业装备，普通技能自由、独立后期进阶。体质/感知高、力量/灵巧低，相同培养下援护更强、挡架/输出更弱，自然先攻相同。默认援护rear再guardself是免费战术，不是训练。双守卫同技能不叠加，可分区。原六人开局不变，三候补可共存9人但只6人出战；本人仍能切换。含新ID的备份需v142以上，旧程序不认识beryl。

纯显示模块interception-view让普通完整施放详情显示每条真实援护子事件成功/失败、实际目标、反应/难度和MP。原组内索引误用和分组主详情不显示子结果两轮浏览器失败留存；最终分别验证普通分组与诊断精确事件，不改战斗或奖励。通用守卫动作识别新角色ID。

Native终档7680/next70：7485扣60招募到7425，明确A→beryl，塞恩本人不变；68classic六人3/3/4，15草10符8箭，120金45XP+圣物盾；69courier五人4/4/8，0草3符2箭，135金55XP+邮铃，beryl0HP0MP倒下、六人生还目标失败。只新增classic/survive68，五冻结793208字符不变。五位旧活跃成员各100XP，新伙伴100XP，阿瑟候补不加XP。换人保存所有当时六位成员当前tactics，其他资产精确保持；不声称所有旧成员字段完全无变化。

证据`/workspace/wod-evidence/v142`，大验收原件`/tmp/wod-evidence/v142/acceptance`。正式终档`reserve-final.json`、玩家整档`reserve-final-campaign.json`、四原文`reserve-final-four-raw-keys.json`；第三浏览器换回阿瑟的验证分支不当正式终档。两方案及比较A来自真实v141四键；仓库小夹具v141-preparation-state只含这三键，公会仍由既有Native链正常结算得到。不得用空方案册替代用户进度。正式种子68/69与准备模板种子分别保存，不为过测改号。

复验`node --test tests/*.test.mjs`、`node --test tests/guardian-reserve.test.mjs`、`node scripts/verify-release.mjs`；新空目录先check-v142后browser-v142。统一验收当前50组，用独立/tmp目录＋主盘逐组全量ZIP，完整校验原文件/SHA/CRC。不要覆盖失败输出；browser-initial/second有两次完整失败。七份修改前全状态/完整报告零字段排除，actual正常领取所有公会字段按显式期望核查。原版仅官方公开旧百科结构依据，全部新角色及参数明确改编。

恢复依赖已验证v140完整bundle（SHA256 `84d7c048546df8192902ab3161aa28bfa9a8d86a06b60870e059d0c0931f0a9d`）＋v141增量（SHA256 `5ff31a92039d5227a0a47951b78161ecbd836ccae16c71528d6c77fffc32cb6b`）＋本轮v142增量。main应恢复v140，六retained旧引用必须完整；不依赖更老增量。源码/补丁/完整原证据ZIP和离线恢复收据在`/workspace/wod-delivery/v0.142-guardian-reserve`，准确SHA见SHA256SUMS和manifest，不另重复完整源码ZIP/bundle。

v142正常推送阶段分支；v143–145先读取远端main、完整测试、浏览器关键闭环、资产/冻结档及离线恢复，安全再尝试main。只删确认已合并且可恢复分支；保留旧ref、唯一证据、恢复链，不强推、不GC/prune、不部署。补给经济仍待决定，不阻塞其他单人工作。双盘余量见本轮验证，临时盘约需1.8GB跑50组，下轮必须先核对预算，不能耗尽才处理。
