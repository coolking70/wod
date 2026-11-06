# 云端接续 / v0.118 遗物寻访

工作区 `/workspace/wod`，分支 `feature/v118-equipment-pursuit`，基线v117 `9c53301ae83a8773a6a97692f0e2a3a96b3be59e`。修改前干净且895测试通过。main仍v100 `357336294d0e5eb9191a8a21ba6c8d1147afe215`；本轮只本地提交，不推送、合并或部署。预置BrogueJS仅借用Playwright，未修改。

先读[V118设计与实玩](V118_EQUIPMENT_PURSUIT.md)、[V118_CHECKS.json](V118_CHECKS.json)、[V118_PLAYCHECK.json](V118_PLAYCHECK.json)，再读PROJECT_STATUS、ROADMAP与DEVELOPMENT_POLICY。

## 实现

- `dist/expedition-equipment-goal.mjs`：可选单一目标、归属状态、22件遗物寻访数据及真实源表模型。`validateGuild`校验optional `equipmentGoal={heroId,gearId}`；`setEquipmentGoal/clearEquipmentGoal`复用pending禁改和既有UI过期写保护。
- `dist/expedition-equipment-goal-view.mjs`：公会目标卡/来源入口、装备面板寻访册。当前查看队员与目标队员独立，分配动作精确给指定目标，来源复用路线绑定方案/故事/委托面板。
- `dist/expedition-equipment-view.mjs`：原来源文案也使用统一源表；三选一一次/首通固定/重复池不保证的事实保留。不改GEAR、LOOT、DATA、ENGINE、技能、训练、固定奖励或永久补给。
- 目标实际持有才完成。待领、实验草稿、别人的装备不算；仓库货须手动分配。卸下仍拥有；结束目标不删资产。全队一个目标，可更换已招募队员/缺失遗物；已拥有不可重新设成待寻，无完成奖励/自动赠送/买装备/兑换/转移。
- 单位40装备/22遗物，路线24，普通攻略72。UI badge与本机保存提示更新0.118。版本6可选公会字段，不新增战斗配置或规则版本。

## 实玩与验证

从v117本人E、1090金币真实档自然编号12/13：为F寻铜签，合流拆来源起点5/4/6回合六人生还，首通175/75至1265；再为E寻同件，5/4/5回合六人生还，重复120/55至1385。领取后仓库状态、明确分别分F/E后完成。F已持有不计E；旧失败、第7次三人撤退、攻略、本人及伙伴职责保留。两次箭矢都耗尽，不能宣传省料或普遍稳定。

最终906项完整测试通过，11项新专项被最终全量覆盖；26套统一Chromium桌面/390px流程通过，新流程pageerror0。48份24既有路线×种子1/731完整原始战报与v117零排除相同。457脚本语法、125模块/142引用检查通过。Firefox/Safari/真机未测。

初轮完整906中3条故事一次性来源文案检查失败，恢复明确三选一格式后通过；首轮浏览器在未展开来源详情时读可见文本失败，改为先展开并保留原断言，实际目标名改精确核对。后补故事已满足但pending待领的准确提示，再完整906/统一26重跑通过。初轮失败日志保留，不调种子/数值/断言过测。

复现：

```sh
node --test tests/*.test.mjs
node scripts/verify-release.mjs
WOD_EVIDENCE_DIR=/tmp/wod-v118 node scripts/check-v118.mjs
WOD_EVIDENCE_DIR=/tmp/wod-v118 WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright node scripts/browser-v118.cjs
WOD_EVIDENCE_DIR=/tmp/wod-all-browser WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright node scripts/run-browser-acceptance.mjs
node scripts/check-v118-legacy.mjs /tmp/wod-v117-reference /tmp/v118-legacy.json
```

最后一项需要v117只读参考工作树；本轮 `/tmp/wod-v117-reference` 已存在，不要重复克隆。页面预览是127.0.0.1:8002/dist静态服务，不是公开部署。报告和浏览器脚本fixture写到独立WOD_EVIDENCE_DIR，不能将生成正常档误当给玩家自动发奖。

## 证据与恢复

本轮证据 `/workspace/wod-evidence/v118`：baseline、最终/初轮测试、48份逐条哈希、正常每阶段公会/配置/报告、原版资料边界、统一26浏览器日志及新截图、语法/运行入口/VALIDATION。验证压缩包不包含截图。

本地恢复目录 `/workspace/wod-delivery/v0.118-local-equipment-pursuit`：完整源码ZIP、bundle（本分支/v117/main）、v117→v118和v100→v118二进制完整索引补丁、验证ZIP、SHA256SUMS、manifest、restore-check。最终完整提交/树值以该目录manifest和git log为准。离线bundle克隆核对提交/树/实际入口，两补丁须精确重建相同源码树，再核对所有交付校验和。

## 下一步与限制

用户已授权常规方案自主推进，个人英雄可切换、托管伙伴/小名册、普通自由培养与独立后期进阶不变。不实施普通技能互斥/固定自建主角/在线后端。

补给持久化已由父线程征询用户，回复前不实施永久物资、金币买料、扣押/退款或免费补货任务。此决策不阻塞独立单人开发。当前无新增重大产品决策或真实环境阻塞；下一阶段继续整体可玩动机与实际跨路线成长/资源压力瓶颈，避免反复扩展寻访设置、同类遗物或技能数量。本轮及后续无推送/合并/部署授权。

WoD官方主页本轮正文成功，仅支持收集/配装协作方向；感言不当机制规范。DungeonGuide正文502未重试，不当已读现服规则。寻物目标/来源导航为项目原创暂定设计，不宣称原版同功能或概率/转移/价格复刻。
