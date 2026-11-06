# 云端接续 / v0.125 属性培养

工作区`/workspace/wod`，分支`feature/v125-attribute-training`，基线干净v124 `743f083611bb1bcbffb4474337b0b61522535705`，修改前1016测试通过。main仍v100 `357336294d0e5eb9191a8a21ba6c8d1147afe215`。本阶段只本地提交，不推送/合并/部署；预置BrogueJS只读借用Playwright。

先读[V125规则与实玩](V125_ATTRIBUTE_TRAINING.md)、[核验](V125_CHECKS.json)、[完整实玩](V125_PLAYCHECK.json)，再读PROJECT_STATUS/ROADMAP/DEVELOPMENT_POLICY。保留可切换个人英雄＋托管伙伴、小规模名册、自由普通技能＋独立后期进阶；永久补给待用户，不影响独立工作。

## 接点

- `dist/expedition-attribute-training.mjs`：applyAttributeTraining/attributeBreakdown/attributeResources及作用说明，不导入engine/guild。
- data trainingOptions增加8个`attr:`/kind=attribute；engine buildParty在原职业基础加rank，再原倾向+3、装备一次。旧无属性输入完整报告零变化，不给额外行动或固定辅助值。
- `expedition-attribute-training-view.mjs`：成长中的实际来源/出发上限及付费/退回；手机卡片。guild旧技能/防御训练列表排除attribute避免重复按钮。实验培养必须单独区分attribute总值，不能沿旧else误标防御技能等级。
- 原通用训练/草案/经验账目/资产校验不新增独立货币。试演仅在属性/资源变化时添加相应字段，完整报告及既有无变化结构保留。
- `scripts/attribute-training-cases.mjs`、`check-v125.mjs`、`check-v125-legacy.mjs`、`browser-v125.cjs`、`tests/attribute-training.test.mjs`；统一浏览器增加125。

## 真实状态

v124的2725/next28/E定心缎带继续。E体质/智力1共40XP，HP102→106、MP57→59；F智力/B敏捷各20XP。正常28邮路留余4/4/15全倒、0草3符2箭，过两房40/20至2765。E退体质返20，智力换意志退20/花20，HP102、MP58、累计XP不变。正常29资深试炼6/7/17六人、4草0符0箭，首通240/110及圣匣重盾至3005，全员首证29；进阶资格开放但所有advancement仍null。

最终next30、履历29..10，旧10..27保持；E attr:wil1、F attr:int1、B attr:agi1，净付60XP，两次普通XP各+130。装备/本人/职责/寻物目标、归信任务witness/23、24、27三路签和收藏22/21/2/1完全保持，新盾只入仓未分配。旧27原样重演不可再领。28失败、29符箭0保留，不作单属性胜负或资源归因。

## 验证、恢复、后续

1032完整测试、16新增专项、33套统一Chromium全部通过；507脚本语法、140模块/157引用通过。最终计数见V125_CHECKS，原始目录`/workspace/wod-evidence/v125`，恢复目录`/workspace/wod-delivery/v0.125-local-attribute-training`。源码ZIP/bundle、v124及v100全索引补丁、验证ZIP/manifest/校验单；离线克隆和两补丁核验同提交/树/入口。无原生Library ID或外部上传。

16新增专项覆盖所有属性/角色、叠加/费用/精确重修/累计XP、混合草案、完整只读试演、公会覆盖实验/pending资产/过期/备份及实际28/29。桌面/390px覆盖40XP草案试演→应用、实际与实验差异、两次正常报告/公会同API、手机退回/等额重配、进阶资格不代选、命名绑定/任务/档案整档和另一页F成长时旧页E草案拒绝覆盖。

原版属性/提升正文502未重试，只用官方公开索引支持方向；成本上限/重修/现有HPMP公式为原型，不声称现服属性表或重置点机制。Firefox/Safari/实体设备未测。无新增阻塞，下一步继续实际角色成长后的探索与配合，不继续叠加点数/小变体；永久补给仍待用户，不推送/合并/部署。

原云环境曾不可用；恢复后核实v124原提交/9项恢复包校验和v125未提交文件均可访问，先保存工作快照，再收齐33套浏览器结果并重生成24份当前源码记录逐项核对。唯有体质说明文案的24处重复差异已精确确认，数值/报告/结算无差异；原始证据保留。未在新环境重复开发或声称文件丢失。恢复收据见原始证据environment-recovery.json。
