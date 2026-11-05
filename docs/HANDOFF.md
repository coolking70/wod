# 接手开发指南

## 先读与当前约束

README → PROJECT_STATUS → ROADMAP → DEVELOPMENT_POLICY → DECISION_PROGRESSION → V62_RESERVE_TRAINING_PATHS → V61_TRAINED_RESERVES → V60_TRAINING_REHEARSAL → V59_TRAINING_PLANS → V58_GROWTH_ACCOUNTING。

用户已确认普通职业技能自由培养、独立后期职业进阶；DECISION_SPECIALIZATION仅是已撤回的普通技能互斥提案，不得据它重新询问或实施。参考服务器/版本尚未指定，Delta只作可替换研究候选，运行profile.referenceServer为null。这个资料约束只影响原版数值标定，不阻塞其他开发，见RULE_CALIBRATION_BOUNDARY与DELTA_REFERENCE_CANDIDATE。

## 运行与当前验证

无需npm安装或构建，dist是可编辑源码。Node24.19.0、Python3.12.14、Chromium154.0.8037.57。当前433项测试通过，0失败/跳过；168个ES模块、21个浏览器脚本语法检查通过。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
node --test tests/*.test.mjs
node --check dist/expedition-ui.mjs
git worktree add --detach /tmp/wod-v059-check 066cdec
node scripts/check-v60.mjs /tmp/wod-v059-check
git worktree remove /tmp/wod-v059-check
node scripts/check-v61.mjs
git diff --check
```

check-v60要求v0.59参考目录，检查9份完整旧报告及六人12份试演/实际出征报告等价，不排除标签。check-v61重建正常赚取候补，并执行288次固定发现/确认组，更新对应docs回执；会花费几十秒，未完成时不得把旧回执称为本轮结果。check-v57生成/tmp/wod-v57-earned-guild.json，check-v61生成/tmp/wod-v61-trained-roster.json，两者均可用WOD_EARNED_GUILD改路径，且都来自普通游戏事务，不注入经验。

浏览器脚本需要外部Playwright/Chromium与HTTP服务。示例（路径由实际环境提供，不要求依赖在BrogueJS）：

```sh
WOD_PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
WOD_CHROMIUM_PATH=/usr/bin/chromium \
WOD_BASE_URL=http://127.0.0.1:8000 \
WOD_EVIDENCE_DIR=/tmp/wod-browser-v61 \
node scripts/browser-v61.cjs
```

浏览器备份只在独立测试上下文通过正常恢复入口导入，不覆盖用户浏览器。当前本轮服务仅127.0.0.1:8002，未部署公开站点。

规则标签保持original-wod-inspired-0.57.0，schema仍0.40.0、guild key仍abbey-guild-v6。本次v0.58–v0.61没有改变战斗数值/事件结构。活动样本1,824条最后重放于v0.57，本次未重跑；旧研究口径和这次288次候补研究分开，不能混称。

## 代码地图

| 路径 | 职责 |
|---|---|
| dist/index.html、expedition-ui.mjs、expedition.css | 当前入口、编辑/回放/实验；loadReport可选origin显示试演提示 |
| dist/expedition-data.mjs、content.mjs、engine.mjs | 原创内容、配置和确定性引擎（后两项同样有expedition-前缀） |
| dist/expedition-progression-rules.mjs | 当前项目的只读成长参数；研究资料不能选择运行规则 |
| dist/expedition-growth.mjs、progression-view.mjs | 成长阶段与个人四类经验账目（后者有expedition-前缀） |
| dist/expedition-training.mjs、training-plan.mjs、training-plan-view.mjs | 单项报价、整份草案与原子调配入口（后两项有前缀） |
| dist/expedition-training-rehearsal.mjs、training-rehearsal-view.mjs | 真实资产的当前/草案双试演及事实比较（后者有前缀） |
| dist/expedition-advancement-data.mjs、advancement.mjs | 12条项目后期路径、法力/效果来源和资格（后者有前缀） |
| dist/expedition-guild*.mjs、roster*.mjs、personal*.mjs | 公会事务、个人资产/名册成长与战报投影（后两项有前缀） |
| dist/expedition-readiness.mjs、command*.mjs | 实际资产核对与伙伴职责，编辑时保留实际方案（后者有前缀） |
| dist/expedition-equipment*.mjs、loot.mjs | 固定装备、来源和奖励（后者有前缀） |
| dist/expedition-disruption.mjs、healing.mjs、regeneration.mjs | 截疗、救护、缓释（后两项有前缀） |
| dist/expedition-cooperation.mjs、support*.mjs、source-trace.mjs | 支援字段与来源，不计算胜负贡献（后两项有前缀） |
| dist/expedition-harbor*.mjs、resource-ledger.mjs | 港口分支/预留与收支（后者有前缀） |
| dist/expedition-report.mjs、review.mjs、stage.mjs、history*.mjs | 分组、复盘、表现与历史（后几项有前缀） |
| scripts/advancement-cases.mjs、trained-reserve-cases.mjs | 正常赚取测试状态；后者的低成长同时培养路径并非玩家推荐 |
| scripts/、tests/、docs/、dist/assets/ | 复验、测试、报告/截图及素材 |
| .openai/hosting.json | 原Site身份/目录配置，不是本轮部署授权 |

## 资产与草案边界

trainingCost返回递增费用单位，经验用trainingInvestment。无总6点预算，每项上限仍为项目参数+3；公会实际付经验，实验不能授予资产。experienceLedger把可用、训练、课程与后期进阶分开；退回不降低累计/阶段、不遗忘课程，装备/临时加成不算永久投入。

quoteTrainingPlan只读，applyTrainingPlan重新计算整份目标费用/退款，净额用整数处理，不相信界面传入金额。快照覆盖profile及本人身份/经验/培养/课程/进阶；本人变化须重开草案。草案只驻当前页面内存，刷新丢弃；不是公会存档的一部分。待结算禁止应用，既有跨页保存冲突保护保留。

rehearseTrainingPlan只在独立克隆中应用，按实际下一次种子模拟当前/草案，不创建pending或奖励。实际配置复用guildConfig，包括个人装备、训练、已选进阶和托管职责。缓存覆盖公会raw、准备配置和目标/成长快照，过期不展示，跨页变化须重新进入。回放的origin只是界面提示，不写入战报结构。personalReport.healingBlocks表示本人截疗造成救护受阻，不能写成本人治疗被阻止。

个人advancement={path,paidXp:80}是独立资产；guildConfig/readiness/companionPreview/historyComparison须读取真实选择。skillManaCost用于施法、治疗决策及预览，effectBonus进入实际字段。历史保持当时路径，不随当前重选改变。

当前所有费用、3阶段、每项+3和12路径效果都是项目参数。将来校准成本须先处理已付金额/数据，不能直接切换profile重算旧投入。完整原版等级、差异费用/金币、精通冻结与重置点尚未核实某个现行服，未擅自移植；禁止把历史百科和Delta单个技能公开描述当作完整现行成本表。

## 候补证据与后续

v0.61正常构造共28次结算，候补各460经验，19次同时培养中15次止步。它证明资产可正常赚取，不证明培养路径高效。固定较高成长疗所确认组：米菈两种分工和奥林替射手均16/16六人生还，平均回合比原阵容更长；风暴双药师0/16、学者也未优于本次原阵容。只增加有限可用案例，不完成全路线/早期成长可靠性，不新增通用升级快捷方案。

v0.62已验证逐名上场/及时投入：两资深路径各24次零失败，完成次数相同；另新公会逐名候补8次全员通关。普通训练等额转投保持累计经验，空存档浏览器贯通；没有添加免费候补经验。跨路线与其他初期构筑仍待覆盖，有限成功不作全局保证。若真实证据要求改经验归属或成长经济，再作为产品取舍处理，不能以参考服待定为由暂停所有工作。

## Git、交付与权限

本轮续接v0.57 a533454，v0.58 63975dd、v0.59 066cdec、v0.60 a9f7d50、v0.61 9f97859及v0.62均只本地。最后获准推送仍为v0.49 d6f77b8；main为16986e0。未推送新阶段、合并或部署，后续遵从实际授权。

源码/补丁/Git bundle/校验清单位于/workspace/wod-delivery/对应版本目录；本地文件不代表原生Library文件，未创建文件ID。旧交付保留。测试证据在/workspace/wod-evidence/。本机游戏存档不等于Git源码备份，不提交凭据、个人浏览器数据或临时运行文件。素材来源见ASSETS，未补造第三方许可或全仓库开源许可证。

## v0.62复验入口

node scripts/check-v62.mjs：复建v0.61合法基线、两条逐名资深培养与新公会短路径，校验12份最终作战配置完全一致，未重跑288矩阵。WOD_BACKUP_DIR指定三份备份目录。browser-v62不导入备份，从空存档正常游戏，验证+1练习培养和20经验等额换训；脚本使用同一四个WOD环境参数。规则与数据schema不变，无新增关键产品决策；可继续跨路线早期职责验证，无需为版本号单独询问用户。

## v0.63接续

cooperationCheck增加resources与断潮roundLimit，resourceAssignments仅枚举静态配置，禁止把行数求和成需求预测。耗材行后续只含同阶段之后的无材料指令；救护另列普通阶段。focusCommandRow通过phase定位普通/预备，guild编辑先保留实际职责。九份报告与ababfe6完全等价。check-v63三路线/两成长档/三配置共216，候补断潮全超时，双学者资源跳过0；不可解释为缺符纸。browser-v63最后回执在readable-browser，正式功能出征本身止步第二房，不得称通关。继续同职业接替，不调数值或擅增经验。

## v0.64接续

replacementChoices只读排序同职业可选项，不是最佳阵容评分；主角排除，需明确编入，资产与职责不自动继承。cross-route-cases统一合法profile，check-v64要求v63已有回执且个人资产一致后引用原队，不重复旧矩阵；216新样本覆盖同职业替补。browser-v64正常恢复零培养名册并真实断潮通关，保留射手；无需以特定种子功能通关推断可靠性。继续初始职责目标核对；不调数值或擅加经验。

## v0.65接续

roleTargetCandidates与伙伴预览共用初始能力筛选，不检查敌方法力是否够或声称战中始终没有候选。readiness.targetWarnings是逐房元数据，单独显示且不加入阻止出征的errors；普通阵位空位有引擎回退，不用此职责提示。新浏览器验证首房提醒→改配→其他房保留→实际战报，429回归通过。下一步轮换前后历史名单/双方快照，目前configurationChanges仅对新增/离队者显示出战状态，不能看资产细节；可补只读信息，不推断资产继承或贡献。

## v0.66接续

historyComparison新增lineupChanges元数据，原有变化计数/逐人列表保持；快照是深复制，分离left/joined，不猜多人配对。settings是对应配置，rooms是按各自路线resolve后的实际计划。草稿不等于拥有资产，历史无XP/课程付款字段则不补推。433回归与只读/历史导出浏览器闭环通过。可继续单角色战术复用等独立工作，保持资产/课程校验，不需要为版本号等待用户确认；完整原版数值仍需实际参考服资料。
