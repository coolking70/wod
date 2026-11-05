# 深潮远征 / wod

当前本地开发版本：**v0.57「六职业进阶」**。v0.49已按用户批准推送至 [feature/v049-healing-disruption](https://github.com/coolking70/wod/tree/feature/v049-healing-disruption)，完整SHA `d6f77b8adb0ea7b696015d62c24172d5526b1a89`；main仍为v0.45。后续阶段仅本地提交，未推送或发布。GitHub 接续仓库：https://github.com/coolking70/wod

## 开发交接入口

- [当前进度与恢复边界](docs/PROJECT_STATUS.md)
- [开发记录](docs/DEVELOPMENT_LOG.md)
- [后续计划与验收标准](docs/ROADMAP.md)
- [运行、结构与接手指南](docs/HANDOFF.md)
- [本次迁移验证](docs/MIGRATION_2026-11-03.md)

本项目为无依赖静态网页；`dist/` 就是可编辑源码与运行目录，不是可删除的构建缓存。

```sh
git clone https://github.com/coolking70/wod.git
cd wod
python3 -m http.server 8000 --directory dist
# 浏览器打开 http://localhost:8000
# 另一个终端运行测试：
node --test tests/*.test.mjs
```

线上试玩：https://sunken-abbey-tactics.coolking.chatgpt.site （保留原访问权限）

v0.46从v0.45重新实现：逐房协作核对、288次候补对照、268项测试和本轮浏览器验收。旧会话所称v0.46源码仍未找回，其264项报告不作证据。详见 [v0.46报告](docs/V46_COOPERATION.md)。v0.47见 [双学者报告](docs/V47_SCHOLARS.md)：全部辅助单次用料、逐条定位、576次双学者验证；确认组无稳定通关优势，未加入候补快捷方案。v0.48可从辅助施放追到后续检定字段与原始来源。当前阶段见 [v0.49报告](docs/V49_DISRUPTION.md)：学者可选择截疗符，在伤害、支援用料和出手时序之间取舍，并从救护受阻记录追到实际命中与本房改配。

## 功能与历史文档索引

原创 WoD 灵感远征原型，尚非原版数值复刻。十一路线地图、真实单场引导、六人多套构筑起点与六场连续章节已接入。生命、法力、道具与补给跨房间继承，救援和沉钟事件改变遭遇；战报仍保留实际检定与因果依据。新增敌方支援角色AI画像，保留既有事件插画与战术实验。已加入本机公会存档、金币/经验结算、永久训练、个人装备购买与备份恢复。公会与实验配置分离，新增路线奖励、首通记录、九件地下城专属装备、公会仓库与属性比较。新增六职业高阶普通课程、三个成长阶段和公会学习限制，并接入独立的六职业后期研修。新增熟练/资深两条试炼、敌方组合、三套对照方案与128次样本。新增六人实际资产核对、逐房间指令视图与定位调整入口。新增三部位固定配装、30件具名装备、按部位比较、技能条件影响与掉落来源。新增盐风港四场连续遭遇、七个可能节点、两项预设策略、实际状态选路与解封因果记录。两张原创AI场景图按事件呈现。港口通关海图、三项一次性委托与三件指定装备兑换已接入公会结算。新增可选风暴敌群、职责分工/分散方案、三项风暴目标、逐房效率复盘和敌方治疗溯源。暂无账号和云同步。

- docs/V57_ALL_CLASS_ADVANCEMENT.md：六职业各两个独立后期方向，392项测试与六职业浏览器验收。
- docs/RULE_CALIBRATION_BOUNDARY.md：下一轮原版数值校准的参考服/规则资料缺口。
- docs/V56_INDEPENDENT_ADVANCEMENT.md：独立后期进阶、真实资格/支付/重选、普通技能保留，384项测试与浏览器验收。
- docs/V55_EXPERIENCE_TRAINING.md：移除全角色6点硬上限，真实经验培养与退款，368项测试与浏览器验收。
- docs/V54_FREE_TRAINING.md：逐级成本与单项精确退款，普通技能自由搭配，360项测试与浏览器验收。
- docs/DECISION_PROGRESSION.md：已确认自由普通技能、独立后期职业进阶。
- docs/V53_SUSTAINED_CARE.md：延迟分区恢复、真实招募与共享药草风险，349项测试与浏览器验收。
- docs/DECISION_SPECIALIZATION.md：已被新方向取代的历史互斥方案，不实施。
- docs/V52_CADENCE.md：普通指令每回合一次、节制截疗和实际额外行动，333项测试与浏览器验收。
- docs/V51_EDITING.md：切自定义保留实际职责、逐房改配与真实出征，319项测试和浏览器验收。
- docs/V50_SEER.md：先觉截疗职责、真实学习门槛、先攻公式与来源，313项测试与本轮浏览器验证。
- docs/V49_DISRUPTION.md：可选截疗符、现有伙伴职责入口、受阻来源与实际玩法验收。
- scripts/check-v49.mjs / docs/V49_CHECKS.json：边界用例、真实公会配置和9份旧配置逐条等价检查。
- scripts/browser-v49.cjs / docs/V49_BROWSER.json：公会应用、实际出征、禁疗来源、本房改配与移动视口验证。
- docs/V48_SUPPORT_EVIDENCE.md：辅助→字段→原始证据→改配闭环，291项历史测试与浏览器验证。
- scripts/check-v48.mjs / docs/V48_EVIDENCE.json：三个固定的只读证据功能用例。
- scripts/browser-v48.cjs：来源追溯、返回、A/B与原战报刷新、候补身份及移动视口。
- docs/V47_SCHOLARS.md：辅助用料与逐条编辑、576次双学者对照、确认组结论及验收。
- scripts/sample-v47.mjs / docs/V47_SCHOLAR_SAMPLES.json：双学者完整分层结果。
- scripts/browser-v47.cjs：本轮招募、核对、逐条改配与证据闭环。
- docs/V46_COOPERATION.md：只读协作核对、288次受控实验、浏览器闭环与边界。
- scripts/sample-v46.mjs / docs/V46_COOPERATION_SAMPLES.json：候补协作逐次结果。
- scripts/browser-v46.cjs：可复跑的浏览器验收（需外部Playwright/Chromium）。
- docs/V45_LEDGER.md：候补与训练96次对照、逐人逐房资源账本与改配闭环。
- scripts/sample-v45.mjs / docs/V45_ROSTER_SAMPLES.json：阵容与训练样本。
- docs/V44_RESERVE.md：关键事件符纸预留、行动后备溯源、64次对照与验证。
- scripts/sample-v44.mjs / docs/V44_RESERVE_SAMPLES.json：同配置预留策略对照。
- docs/DEVELOPMENT_POLICY.md：常规推荐自主决策，不维护旧存档兼容。
- docs/V43_STORM.md：风暴规则、奖励、72次对照与浏览器验证。
- scripts/sample-v43.mjs / docs/V43_STORM_SAMPLES.json：同装备、训练、补给的战术比较。
- docs/V42_HARBOR.md：分支机制、港口委托、验证与限制。
- scripts/sample-v42.mjs / docs/V42_HARBOR_SAMPLES.json：192次策略与装备对照。
- docs/V39_ROSTER.md：角色/职业分离、两名候补、招募与轮换。
- docs/V40_EQUIPMENT.md：27件固定装备、三部位、实际属性、来源、比较与验证。
- docs/DECISION_EQUIPMENT.md：已确认固定属性配装。
- docs/DECISION_EXPEDITION_FLOW.md：已确认A，战前策略与整段自动结算。
- docs/V38_PERSONAL.md：个人反馈、支援溯源、相关行动回放与职责预览。
- docs/DECISION_COMPANIONS.md：下一阶段伙伴名册范围决策。
- docs/V37_HERO.md：主角选择、个人养成入口与伙伴职责托管。
- docs/V36_WORKSPACE.md：战场、证据、复盘分区与关键行动播放。
- docs/DECISION_ROLE.md：下一阶段角色归属决策。
- docs/V35_TRACE.md：检定时效果来源与施放跳转。
- docs/V34_SUPPORT.md：支援来源、受益者、效果变化与跳转。
- docs/V33_COMPARISON.md：历史与当前方案逐人对比、实际资产比较。
- docs/V32_HISTORY.md：历史出征快照、重演与方案载入。
- docs/V31_PANELS.md：四面板、装备筛选与浏览器验收。
- docs/V30_READINESS.md：出征核对范围与验收。
- docs/V29_TRIALS.md：新路线、奖励、128次样本与验收。
- docs/V28_GROWTH.md：职业进阶、成长门槛、兼容与验证。
- docs/V27_LOOT.md：奖励表、战利品仓库、旧存档迁移与验证。
- docs/V26_GUILD.md：固定公会规则、持久化边界与验收。
- docs/V25_ADVENTURE.md：实现范围、96次样本、验证与待决策事项。
- dist/index.html：v0.57 主入口；legacy.html 保留v0.2。
- dist/expedition-data.mjs：原创内容、默认配置与迁移。
- dist/expedition-engine.mjs：无DOM的确定性模拟。
- dist/expedition-report.mjs：无损事件分组。
- dist/expedition-ui.mjs / expedition.css：编辑器、回放与战术实验。
- dist/expedition-stage.mjs：只读战场投影与回放导航。
- dist/expedition-events.mjs：机关候选与独立检定。
- docs/V24_DEPLOYMENT.md / dist/expedition-deployment.mjs：阵位部署、覆盖预览与验证。
- docs/V23_TARGETS.md / scripts/sample-v23.mjs：职责选择、限制与验证。
- docs/V22_CONTRACT.md / dist/expedition-contract.mjs：委托判定、方案与验证。
- docs/V21_HOSPICE.md / scripts/sample-v21.mjs：疗所规则、96次样本、图像提示词与验证。
- docs/V20_PRIORITY.md / scripts/sample-v20.mjs：治疗优先级、128次样本与验证。
- docs/V19_HEALING.md / dist/expedition-healing.mjs：治疗诊断与非干扰验证。
- docs/V18_CARE.md / dist/expedition-care.mjs：时序投影、敌人标识与验证。
- docs/V17_SURVIVAL.md：新路线、128次样本、验证与图像提示词。
- scripts/sample-v17.mjs / dist/samples-v17.json：生存试炼样本。
- docs/V16_RESERVE.md：本轮发现与复现说明。
- dist/expedition-reserve.mjs / scripts/sample-v16.mjs：方案配置与样本生成。
- dist/expedition-settlement.mjs：只读目标、账本与潮位投影。
- docs/V15_SETTLEMENT.md：本版说明、AI提示词与验证。
- docs/V14_SCARCITY.md：挑战规则、样本与验证。
- scripts/sample-v14.mjs / dist/samples-v14.json：864次挑战对照。
- docs/V13_OVERVIEW.md：界面、历史基线样本与验证。
- scripts/sample-v13.mjs / dist/samples-v13.json：可复现的策略样本。
- docs/V12_RESCUE.md：救援规则与验证。
- docs/V11_BRANCHES.md：分支规则与验证。
- docs/V10_EVENTS.md：机关规则、验证与素材。
- docs/V9_PRESENTATION.md：本版表现范围、验证与素材来源。
- dist/expedition-review.mjs：只读复盘、差异与方案校验。
- docs/V8_ENCOUNTERS.md：本版遭遇、抗性与验证记录。
- scripts/sample-v8.mjs / docs/V8_SAMPLES.json：8种子对照脚本与样本。
- docs/V7_BUILDS.md：训练与技能规则、验证及边界。
- docs/V6_REVIEW.md：复盘与方案册、统计口径。
- docs/V5_RULES.md：召唤、道具、挑战规则与素材记录。
- docs/V3_RULES.md及其他历史文档保留既往版本记录。

无需安装依赖或构建，静态服务目录为dist。

```sh
node --test tests/*.test.mjs
```

2026-11-03 迁移复验：258项检查通过，0失败。游戏是前端本地模拟，含公会成长，含固定装备池掉落，不含后端账号、随机词缀与多人；视觉为有限样片，未接入在线CG生成。

2026-11-03 云端接续复验：268项测试通过，288次新样本再生成一致；桌面与390px移动视口的Chromium闭环通过。双药师调整尚不足以推荐，不自动替换玩家配置；详见v0.46报告。

2026-11-04 接续验证：279项测试通过，576次双学者样本与本轮浏览器闭环完成；原阵容确认组32/32，双学者默认30/32，仅分散28/32，一次护印29/32。没有候补推荐升级，P2完整验收仍未完成。

2026-11-04 v0.48接续验证：291项测试通过，辅助证据闭环和桌面/移动视口流程通过；不改规则或战果，不计算额外伤害/减伤/胜负贡献。v0.47分支已推送，v0.48仅本地保存。

2026-11-04 v0.49接续验证：307项测试通过，9份旧配置事件流/快照/战果逐条等价；1,824条活动样本重放数值不变，规则标签更新为0.49。桌面/390px视口完成真实公会截疗职责、出征、来源、改配与恢复原战报流程。v0.48已推送核验，v0.49仅本地；没有据单次通关宣称候补升级。

2026-11-04 连续开发v0.50–v0.53：四阶段均保留本地提交、完整回归与桌面/移动浏览器回执；最终349项测试通过，9份旧配置等价、1,824条活动样本数值不变。v0.49已推送核验，之后未推送。当时暂停在职业专精方向选择；该问题已于2026-11-05由普通技能自由培养、独立后期进阶的新方向取代。

2026-11-05：用户确认按原版结构继续，保留普通技能自由培养，后期进阶独立；此前互斥普通技能提案撤回。v0.54逐项重修已通过360项测试与浏览器流程，继续本地开发。

2026-11-05连续开发v0.54–v0.57：逐项精确退款、取消总6点硬上限、六职业各两个独立后期方向均已实现并本地提交。最终392项测试、四阶段桌面/移动验收、9份旧配置等价及1,824条活动样本重放通过。本轮未推送/合并/部署。完整英雄等级/分技能费用/精通锁定尚未按某个现行服务器校准，下一步需明确参考服或规则版本。
