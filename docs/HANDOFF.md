# 接手开发指南

## 先读与当前约束

README → PROJECT_STATUS → ROADMAP → DEVELOPMENT_POLICY → DECISION_PROGRESSION → V62_RESERVE_TRAINING_PATHS → V61_TRAINED_RESERVES → V60_TRAINING_REHEARSAL → V59_TRAINING_PLANS → V58_GROWTH_ACCOUNTING。

用户已确认普通职业技能自由培养、独立后期职业进阶；DECISION_SPECIALIZATION仅是已撤回的普通技能互斥提案，不得据它重新询问或实施。参考服务器/版本尚未指定，Delta只作可替换研究候选，运行profile.referenceServer为null。这个资料约束只影响原版数值标定，不阻塞其他开发，见RULE_CALIBRATION_BOUNDARY与DELTA_REFERENCE_CANDIDATE。

## 运行与当前验证

无需npm安装或构建，dist是可编辑源码。Node24.19.0、Python3.12.14、Chromium154.0.8037.57。当前678项测试通过，0失败/跳过；280个ES模块、49个浏览器脚本语法检查通过。

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
| dist/expedition-roster-rehearsal.mjs、roster-rehearsal-view.mjs | 正常换人事务的前后实际队伍试演、逐房事实、独立报告（后者有expedition前缀） |
| dist/expedition-draft-commands.mjs | 托管伙伴的草稿指令预览/明确采用；只替换默认或本房三类指令 |
| dist/expedition-config-undo.mjs | 配置与本次伙伴职责撤销，角色差量与成对写入/失败回退 |
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

## v0.67接续

historyTacticPreview/reuseHistoryTactic只复制PERSONAL_TACTIC_FIELDS，保持身份/装备/道具种类/永久训练/进阶/经验及全队全局设置。仅当前同职业出战目标，课程未学/待结算/过期拒绝，重新计算不信任传入结果。copyRooms只在同路线允许，按两份路线roomsFor的ID并集替换；范围外当前覆盖保留、历史额外槽忽略。比较器把合法额外roomOrders/overrides也列入，标签数组须新建，不能push到roomsFor返回的静态房间数组。v33旧断言已精确补齐两项变化，441全过。check-v67参考dd3bcc9、生成正常额外槽备份；最后浏览器release-browser。配置undo不回滚托管职责，恢复原职责需伙伴面板明确选择，不得声称完整事务撤回。所有代码只本地提交，原版数值仍待参考服证据。

## v0.68职责撤销续接

从3ee8714干净基线441测试开始，feature/v068-companion-config-undo。configurationUndo只保留旧配置、heroId/lineup/next与被改职责的before/after，不保留整个公会旧快照。四入口（实际队员编辑、协作行编辑、高阶安装、历史单人复用）用applyTacticEdit统一处理；restoreConfigurationUndo按当前公会补回该次职责，期间资产与其他职责保留。待结算、新出征、主角/名单或目标职责冲突拒绝整次撤销，失败不消费记录。

commitPreparationChange先核对两份存储当前文本，再写配置、公会；第二写失败回退配置。首次写失败不改公会；回退也失败明确报错，不称完整事务保证。无持久撤销日志、崩溃恢复或多标签原子锁：撤销仍为本页面会话单槽，普通载入覆盖旧槽且不回退历史职责。不要恢复整个旧公会来修撤销。

453测试、9份完整报告与3ee8714等价；browser-v68最终回执final-browser，覆盖四入口、期间正常训练/另一伙伴选择、跨页拒绝后读取重试、待结算拒绝、单次写失败/回退重试及390px。真实修道院种子3三房通关。复验check-v68需要v0.67参考目录；无参考unchanged=null。正常seerGuild备份可由该脚本重建，WOD_SEER_GUILD可换路径。未重跑432路线研究或1,824条旧活动样本；无新原版数字、推送、合并、部署。详见V68_CONFIG_UNDO.md。

## v0.69草稿到实际指令

从e08585a干净基线、既有已验证453测试继续，分支feature/v069-draft-command-bridge。draftCommandPreview以rosterConfig为草稿载体，只将目标替换为readiness实际角色，再复制该目标指定scope的prep/main/healing；不复制专修、站位、防御、道具策略或资产。本房写覆盖，其他房间先保留实际托管方案；默认采用保留实际覆盖，其余继承新默认。明确应用只把目标切custom，接入applyTacticEdit，配置/职责撤销和成对写入失败补偿沿用v68。

编辑器只在目标实际托管且草稿/公会均出战时显示入口；从战报进入编辑仍不自动改职责。预览使用resolveHeroPlan后的完整实际三类指令，不只给“继承默认”占位。请求签名覆盖目标资产、队伍/职责、next/pending与当前草稿，后台重算，不信任返回候选。课程/待结算拒绝，跨页写保护仍有效。guildUI由初始null在挂载后赋值，首次planner也能挂接入口；不可在挂载前直接访问未初始化const。

460测试、9完整报告与e08585a等价、v68八条浏览器流程复验及v69七条桌面/390px闭环通过。首次针对性用例把全部overrides元数据当作本房有效字段，修正为比较全部有效字段、排除覆盖容器，原失败initial-focused-tests.tap保留。视觉发现初始内部宽度断言不足，已修.layout直接子项min-width与页面级边界断言；最终release-browser。compare-reports.mjs参考目录必填，可输出新阶段回执，禁止覆盖旧阶段结果。未重跑432研究/1,824活动样本。详细见V69_DRAFT_COMMANDS。

## v0.70名册换人试演

从dbb363a干净基线、已验证460测试继续，feature/v070-roster-rehearsal。rehearseReplacement先走swapCompanion，再以两份guildConfig和正常next种子分别simulate；不保存guild、改经验或提前编入。两份报告按当前command附perspective，正常实际换人/出征报告应完整相等。rooms按当前路线完整列槽，未抵达用null，不能补零；总回合只累计已遭遇部分，止步少回合不作效率优势。

UI只有一个内存换人试演，replacementSelections保留每个候补的明确选择；signature含完整公会、草稿、outgoing/incoming，变化就停用旧报告入口。实际换人仍调用原swap，不套用试演返回状态，成功后清试演。其他标签页更新先拒绝查看，重新读取后标过期。报告viewer新增可选origin.note，名册试演明确需另行编入；训练试演旧文案保持。试演区滚动偏移按实际sticky guild-tabs高度计算，390px标题不能被遮挡。

465回归、9完整报告与dbb363a相等、桌面/390px及完整正式出征等于候补试演通过。check-v70生成普通赚取/招募/单项训练/课程的固定断潮案例，原队通关，换射手为零培养米菈后六人仍活但第二房超时、末房未抵达；不是新平衡矩阵。初轮测试用了付不起的二级训练和已是同职责的无变化操作，改为可付的另一普通技能和不同职责，断言保留；初始日志保留，最终465复跑通过。最终浏览器release-browser。未重跑432研究或1,824活动样本，原版数值仍待参考服，不推送/合并/部署。

## v0.71新增地城续接

从3e65c8f干净465基线按整体P3开发，不继续局部工具。expedition-foundry定义四个普通遭遇，无隐藏环境规则；data接入foundry路线/4新房间ID/30预算及plain/split/shelter起点，无训练/课程/装备赠送。split集中辅助，shelter分散中央并护后，不能称通用最优。两件dungeonOnly遗物bellowscoat/kilngauge有实际属性代价，正常首通220金币/90XP/固定巡衣，重复150金币/65XP/池内一件。

472回归、9旧报告完整等价、72有限playcheck通过；发现组plain有失败，不隐藏。browser-v71完成正常实际资产首通、刷新pending同报告、领奖/个人分配/历史不改/再通/390px分阵，三次都4房通关。场景foundry-v71.png为一张AI离线生成图复用4房，原图保留，非4张素材。新内容没有改技能公式、成长体系或原版数字。下步一次性委托/定向遗物；不推送/合并/部署。

## v0.72一次性委托

从881d185干净472基线继续，feature/v072-foundry-contracts。foundry-contract独立定义两个非互斥目标；assessment从完整4房已胜战报、6名正式成员和真实余量/回合/生命计算，90%用整数乘法不靠显示取整。foundryReward只列当前未领取目标；pendingReward把基础金币/loot与目标20金币/指定遗物合并，XP保持基础值。claim才写g.foundry.claimed（尚未参与时可无此字段），不依赖20条履历。非法/重复目标状态拒绝，无新货币或存档迁移流程。

远征委托包含新铸库与旧港口，准备按钮仅换草稿，不接任务或预发奖。新report复盘区foundry-outcome只说明条件，实验/试演/历史不发奖；pending列本次新达成/已包含奖励，重复为无。同名基础/定向掉落按×2显示，实际库存逐件累计。装备来源加入定向委托。铸库结尾/敌方抬头使用支线/铸库守军标签。

479完整回归、9旧路线与9铸库完整战斗报告等价；正常shelter→split→split、首批巡衣分配/再分配尺规后得到240/170/150金币，分别home/blueprints/无新增，XP90/65/65；首通基础仍220，首通新20由委托单列。V71原基础奖励断言保留语义并更新合并结果为精确240/两件指定loot，不用宽松比较，旧881d185仍可复验历史220。浏览器首轮“已完成”广泛文本匹配把说明也计入，收窄到目标卡h3精确两项后final-browser全流程通过，原失败保留。

check-v72可重建正常三轮完成备份，带v0.71参考目录核对9铸库报告，否则combatUnchanged=null；compare-reports另核9旧路线。不重跑72新地城游玩矩阵/旧432候补/1,824活动样本。无重大新决策，无开发环境阻塞，不推送/合并/部署。

## v0.73通路续接

基线4f51c38，feature/v073-foundry-passages。foundry.mjs增加CHANNEL/APPROACHES/resolveFoundryPass，data.roomsFor固定潮渠预览、adaptive默认回廊预览；engine仅foundry第二场且非options.rooms时按实际party/supplies解析，房间覆盖仍foundry_bellows。branch.detail.domain=foundry，room结果仅新决策加id/path/note，旧缺字段默认不加事件以保持完整报告。共享费用在room事件后/预备前结算一次，不抽战斗RNG。resourceLedger复用前后库存。

foundry-view提供双敌情/战前选择、本房channelTactics以及事件/证据cells；classId潮术师为tidecaller。UI的战场事件和行动证据两处都必须按domain分流，不能统一索引HARBOR_NODES。sceneFor使用actualRoom.name，尤其计划潮渠但不足2符回廊时。guild ready显示实际计划，review比较foundryApproach，切换起点保留选择。helper只改本房ranger/tidecaller/scholar指令，不清managed角色。

487测试、9旧路线+9默认铸库完整报告与v72相等。check-v73重建96有限组、三个同预算seed3例和两次正常自动选路，普通装备equip花180金币；输出三护符公会/tmp/wod-v73-three-seals-guild.json。10/13/7是最终helper达图纸例，10/12/8真实失败保留。browser-v73需check-v71的普通trained公会与上述三护符备份，4流程桌面/390px通过，证据在v73/final-browser。

初次helper职业标识和通路证据港口索引问题已修；初始失败与最终成功回执均保留。未重跑旧候补研究。继续有限分支结果影响后续遭遇，重大多人/账号/经济方向不擅动。不推送/合并/部署。

## v0.74引流封库续接

feature/v074-foundry-consequences从71ae145干净487基线继续。foundryFlow可选cooling-1，最新factory与通路明确选择写入；旧缺字段的v73channel/adaptive报告必须保持旧行为。engine.validFoundryFlow校验，外层foundrySource记录第二场真实channel事件ID；第四场先复位FOUNDRY_ROOMS原封库（重要：不能执行roomsFor显式潮渠的条件预览），只有真实source且新flow才用COOLED_VAULT。后者只改fvp.prep ward前排→左翼，其余敌方资产/技能/普通指令不变。branch.kind=vault含sourceEventId/changes及零库存变化，不带第二场members检查。result.path=cooled，实际scene标签跟随result。

foundryEventView/EvidenceCells按kind区分，data-foundry-source与港口定位共享移动逻辑，replay-layout支持该按钮。foundryOutcomeView真正追加resourceLedgerView；其内部路由白名单也必须含foundry。UI对foundry-outcome的ledger-source/edit事件与harbor-assessment共用处理。V73报告已纠正“v73账本UI”的过度描述。A/B解释flow变化为保留原出口/启用潮渠引流，不让产品用户管理兼容字段。

493回归、196mjs/29cjs语法通过；check-v74带v73参考目录核9完整旧通路，compare-reports另核9旧路线。24有限报告前3场完全等价，末房有收益也有代价，不作最优承诺。正常seed3新出口15回合574HP/余3符3箭，240gold90XP图纸奖励；旧出口同预算16回合569HP。browser-v74桌面/390px追溯/账本/刷新/领奖/历史通过；另复跑browser-v73四路径。首轮v74浏览器因账本view内部限港口内容为空而失败，已补白名单与单测，原失败保留。

不重跑旧96/72或候补大样本。当前数值仍为原创原型，不冒认现行原版。开发无权限阻塞；仅原生Library交付以实际结果为准。不推送、合并、部署。

## v0.75封库守望续接

feature/v075-foundry-watch从9e9feaa干净493基线继续。expedition-watch.mjs定义WATCH_ROOMS三遭遇，data全局ROOM_IDS+3、foundrywatch/30预算/watchConfig(plain/split/shelter)，没有新战斗公式/技能/特例。watchConfig只给战术起点，无训练/装备/课程；目前英雄6人/候补2不变。末班监工gear=guardblade，解印师gear=focus，不留装备条件伪技能。敌方使用已有suppress/round/healer，9条真正受阻来自已有普通规则，不是新禁疗机制。

watchseal固定饰品，wil3/cha2/str-2/dex-2，magic10/ranged-10；ROUTE_REWARDS独立首通210gold90XP、重复140gold60XP且每次一枚，原foundry两目标不适用。地图入口/独立watch-brief/敌情/场景和结尾使用铸库既有图；foundryOutcomeView给watch仅资源账本，不调用铸库目标奖励，resourceLedgerView白名单含foundrywatch；原ledger定位/改配处理复用。

watchProfiles用普通疗所→付费训练→正常铸库潮渠13/7→分配巡衣B/尺规C→各60XP升原技能一级，输出/tmp/wod-v75-watch-guild.json next4、/tmp/wod-v75-earned-watchseal.json。check-v75保存36有限报告和正常首通/再通奖励，不注入资产。全部通关但不外推必胜；fresh分阵常用尽药草，不当候补推荐。浏览器真实seed4首通、分配给学者、seed5再通，导出备份到390px seed6分阵继续，刷新/历史纯读取与账本通过。

499回归/200mjs30cjs语法；compare-reports对v74核9旧路线，V75_FOUNDRY_CHECKS另核回廊/潮渠/自动各3种子完整报告；无排除。未重跑v73/v74矩阵或旧候补活动研究。v75没有新增插图，既有图复用按文档记录，不上传新浏览器截图。

连续内容告一段落后的真实产品决定为是否进入原M4/R4每人一角色异步小组；DECISION_ASYNC_GROUP列出最小两参与者/六位置、所有权、准备版本、权威模拟和幂等资产的具体切片，不实施未决账号/云服务。原版参考服仍待核，普通技能自由+独立进阶已确认，不重复问。保持不push/merge/deploy，原生Library交付仍以实际失败记录为准。

## v0.76单人归航续接

用户已选择单人，DECISION_ASYNC_GROUP暂缓，不再反复问。基线a54957c干净499测试，本地feature/v076-foundry-homecoming。远端只读快照在V76_REMOTE_CHECK；origin URL与v75候选ref已确认，v75远端当时不存在，main16986e0；不推送。当前新阶段不改变v75本地ref，便于父线程单独处理已完成分支。

foundry-story独立定义三段正常已结算条件（foundry clear、任一foundry目标、watch clear）与convoy/archive/vigil结局，40gold和指定现有遗物，无XP。g.foundryStory只存ending，validateGuild检查字段与已完成条件；claimFoundryStory在editable后检查canClaim、安全数值，加一次金币和仓库，最后validate返回。只读进度/视图不写；重复改选拒绝，pending不能交付，存储沿用原raw检查。

guild pane journey、地图入口、三个故事段落/结局预览、装备来源已接；同一故事结局不改变未来敌情。UI prepare路由只载入foundryConfig/watchConfig，资产/职责保留。story CSS自适应三列/单列。新课、训练或技能规则没有改动。

506测试，204mjs31cjs语法。check-v76正常watch seed4领奖形成3/3，各结局独立快照精确40/1件，archive分配学者后seed5再通；带v75参考目录对4种pending/report/reward/claim逐对象相同，compare-reports另核9旧报告。browser-v76桌面/390px0→2→3、实验不进度、待结算刷新、旧标签页拒绝改选、装备分配、历史同报告、备份同结局通过。截图只内部验收。未重跑旧大样本。接续主线章节/港口单人旅程，不新增服务或多人投入。

## v0.77灯塔来信续接

feature/v077-lighthouse-letter从75f57b7干净506基线接续。harbor-story定义chapter clear/harbor clear/任一home-seal-salvage条件与light/bridge/chart三回信（40gold+beaconrod/quaycoat/tidecompass）。g.harborStory和g.foundryStory独立；validateGuild检查正常条件，claimHarborStory仅正常可编辑时一次奖励，海图不花、不发XP。普通或风暴clear都可，第三条件不要求storm目标。没有新数值/装备/关卡。

solo-story-view共用展示，foundry/harbor wrappers保留文本和奖励。guildUI的journeyBook仅session阅读状态、枚举校验，旅程面板只渲染当前一本；prepare支持chapter/harbor/foundry/watch，仍保留实际资产/职责；地图两个入口明确book，open可传book。browser-v76旧入口收窄到foundry属性值，维持原意精确测试。equipmentSource列出新三选一来源。

512测试，210mjs32cjs。lighthouseCases正常grown→chapter4→harbor5；check-v77保存三独立分支、兑换海图后交付/射手装备/再港口6、另一正常watch6后同档两故事结局。各额外40，合计80，不注入；输出/tmp/wod-v77-lighthouse-{start,chapter,ready,chart,both}.json。带v76参考目录核4真实结算链，compare-reports另核9完整旧报告。browser-v77桌面/390px正常主线/刷新/原奖励/海图兑换/回信/装备/历史/双故事备份通过；v76完整回归浏览器通过。截图只内部，不进交付ZIP。

重复只读远端v75检查见V77_REMOTE_V75_CHECK：URL与a54957c未变，同名远端ref当时不存在。父线程随后明确授权仅该确定v75，已用目标必须为空的租约保护创建远端分支并重新核验完整a54957cc2af51d3c65542718130a05a873f46477；没有覆盖、合并或部署，新v76/v77不推送。后续方向继续单人，异步提案暂缓，普通技能自由与独立进阶不重问。原版数值未核实，不冒称复刻。保存本地提交与恢复包，Library结果以实际回执为准。

## v0.78沉船邮路续接

feature/v078-drowned-postroute从f569c47干净512基线。expedition-courier定义3新ID，data接courier/30预算/courierConfig(plain/rhythm/ward)，GEAR.postbell固定饰品和独立ROUTE_REWARDS。无新战斗规则。source preset分阵C左/F右/D后/E中央，E心智抵抗+药匣70%，F救护80%，mid D持续护中/B每回合重箭。两种prepared只在末房C优先左鼓手/中印师不同。加载不赠送装备/培养/课程，托管仍用已应用职责。

灯塔结尾传followup给通用story view，guild prepare枚举/map加courier；地图新入口/brief/敌情、ledger、实际scene label接入。复用港口图。结尾从真实正式成员与余量区分全员/带伤/失败，UI转义title/text。新铜铃agi3/wil1/int-2/ranged5/magic-5，首通200/80一件，重复135/55一件，不触发港口/铸库目标。

courierPreparation从正常lighthouse ready→chart40+罗盘给B→E买saltseal/plate共120，1125→1005；不是load preset自动购装。check-v78生成before-protection/start/earned-postbell备份；36固定新内容组，有12失败；prepared确认两方案各4/4六人。未防护的36前稿、初TAP/部分结算40失败和初稿可重演config都在证据目录保留，未弱化奖励断言或改敌人数据。中央空会导致敌方位置目标回退，不能当规避。来源倒下不撤销既有组件。

521回归，214mjs33cjs语法。check-v78带v77参考对所有13旧路线各1/731共26全报告相等，否则unchanged=null。browser-v78 release-browser：实际UI买120装备→first6全员4/4/7→200/80→铜铃B→ward7全员4/4/10→135/55，pending刷新/历史完全相同；导出完整guild与脚本逐字段相同，V78_BROWSER_ASSET_PARITY记录。手机恢复与首通历史只读。真实抢拍的两个队列来源追溯+返回，以及死谱师/活术士余韵同时存在可见；该例余韵未产生攻击，最初浏览器错误假定存在该攻击已纠正，原失败留存。

先前灯塔3种结局各自正常支付120防护的seed6均六人通过，仅chart才装备获奖罗盘，不把其他分支虚构同物品。截图只内部不进Library交付。没有运行旧候补/活动大样本，原版服务器数值仍未核验。新增阶段不推送/合并/部署，v75已发布事实不变。继续单人方向。

## v0.79船底缆道续接

feature/v079-courier-keel从e012aec干净521基线。courier模块增加COURIER_KEEL(同courier_sails覆盖ID)/RELAY、courierPass(sails缺省/keel严格枚举)、按抵达arrow>=2的resolve。引擎仅在courier且非options.rooms时第二场动态决策，真实keel事件ID保存在本次模拟courierSource，第三场据此切换鼓手rhythm front→rear；失败止步不提前出末房、fallback不出relay，默认无新事件，旧14路线28全报告等价。战斗公式/RNG/奖励/版本未改。

courier-view提供双方敌情、keelTactics只改B/C/D本房、实况事件与证据格。UI select持久化、其他起点保留pass；出征实际配置说明成本/回退；scene/report.notes用实际路径，care/portrait同时识别两路单位，comparison逐房显示A/B真实名字。费用到ledger按事件净变化单列。医师死后位置回退可能重新把节拍交前排，文案不承诺永久去掉额外行动。

528测试、217mjs/34cjs；check-v79复用正常courierProfiles，48固定案例保留12失败；带/tmp/wod-v078-reference对14旧路线1/731共28全报告无排除。normal6/7三房分别4/3/11和4/3/8，均六人，200/80→铜铃B→135/55；API完整guild与browser-v79导出完全相同。browser-v79含桌面完整收费/来源/账本/刷新/领奖/配装复战/历史和390px实际低箭seed8零费回退与原末房，0错误无溢出；v78浏览器完整回归通过。最初测试control误用seed731而真实depart用next6，大对象比较时进程SIGKILL，保留失败并纠正控制组，未改敌方数字或放宽比较。脚本默认/tmp/wod-v79，可用WOD_EVIDENCE_DIR；浏览器需现成Playwright/Chromium。新阶段仅本地，持续单人，无新重大待决事项；Library传输结果独立，不作为游戏验证通过依据。

## v0.80削弱/净化续接

feature/v080-weakening-cleanse从075f748干净528基线。新增afflictions纯函数/常量，dissonance为吟游者乐器cha/wil低伤法术，命中存活附skill-3当前+下一回合、同名不刷；cleanse为两学者普通预备，4MP/1rune按负面先筛同阵位最多3活人，移除harmful、保留正面。引擎在attack后记录harmful effect/effect-blocked，在buff前独立处理cleanse并跳过正面effect生成；无负面目标免费skip，正常装备/资源/港口预留照常。没有攻击/防御公式改变，普通技能不互斥。固定效果不随训练增强。

独立theater2房24预算，第二房敌方净谱师cleanse-front repeat→ward-front cycle；源头击杀/屏障承压/净化/主动挫志都有真实资源和行动代价。theaterConfig三起点，地图/实际场景/结尾/用料账本/130gold55XP首通古琴/85gold40XP重复古琴或耳坠接齐，15路线34装备。BUILDS新增cleanser、dissonance并按原逻辑给米菈同类职责；加载不自动买装或培养。

UI负面组件不再统一叫禁疗，signed避免+-3；cleanse events进动作结果/高亮/支援变化，sourceTrace记录已移除的效果和唯一来源可跳回再返回；单位当前快照不把移除状态保留。personal增加weakeningApplications/cleansedEffects，controlApplications仍全负面，禁疗单独显示。属性增益supportEvidence跳过cleanse，净化证据另看原始动作；cooperation不把两次净化候选当同名buff互斥。

540测试、222mjs35cjs；affliction-cases仅显式规则边界，绝不是玩家成长。check-v80正常fresh选择E、grown正常courier资产，36固定样本都六人，教学短线无平衡必要性结论；seed1正常130/55/古琴→E配装→20XP训dissonance+1→seed2敌净化2次、85/40/耳坠，完整最终guild与浏览器完全相同。旧14路线28原事件/结果/资源/其余字段严格同，仅party.skills新增cleanse/dissonance键先断言6再归一比较，不要称原始完整报告完全相同。现有规则/配置/公会编号沿用，新增可选状态规则由v80代码复现，无旧档迁移工程。

browser-v80桌面-3来源/返回、净化保留屏障、pending同报告、领奖/20XP培养/敌净化复战/历史/备份，390px恢复后实际应用D清心职责不改成员资产并seed3六人通过；v79浏览器完整回归通过。首次脚本误点隐藏pane的return导致超时，改正常tab导航，原失败留存，未强制点击。截图仅内部。证据默认/tmp/wod-v80，云端/workspace/wod-evidence/v80，normal JSON都有正常所得资产。无推送/合并/PR/部署，单人继续；后续优先新系统/内容，避免无限局部调参。

## v0.81有限海图续接

feature/v081-charted-shoals从de70e4e干净540基线。shoals数据含3开局/3渡礁/2终礁，composeShoalCharts拒绝坏池与无解，前两场pressure不同生成12张有限图；id1–12直接选图，不用战斗RNG。shoalsRooms映射三个固定slotID和真实node/name/note/enemies；data/ROOM_IDS/expedition/budget30/shoalsConfig plain/roles接入，roles只按作者给定node.tactics安排职业本房目标/保护与站位，不搜索胜率或赠资产。新地图由完整公开数据组合，不是无穷随机内容。

g.shoals可选charted数组，validate在clears合法后检查编号/去重/不超过成功clear数，claim仅rewardVersion2正常won在原clear递增后记章，失败/实验/历史不写。勘探册独立于history20，UI准备页/公会contracts可查看/选图；guildUI snapshot返回clone供准备页展示，正常claim后切准备页刷新。出征核对固定海图和实际三场；engine仅对shoals增加room detail chart/node与result id/node/note，其他路线30全报告无排除等价。实际scene/结尾/敌情/账本接入。16路线34装备，首通170/70盐印护袍，重复115/50护袍或耳坠，只有路线首通一次。

发现正常id=seed与旧掉落低位抵消导致二件池固定，现用独立32bit avalanche混合后取模，不动战斗RNG/金额/首件。13多件池各128纯选择器案例都覆盖全池，非实际胜利或严格等概率证据。新重复掉落可能与更新前不同，历史已发物品不改，旧pending奖励按当前代码重算可能改变；无旧档兼容工程。browser-v80回归仅把seed2重复物品精确预期改为古琴，仍严格检查仓库，旧v80文档保留当时证据。

549测试、226mjs36cjs。check-v81固定96案例全通/18伤员，限定发现101/确认201；正常grown两图1/6→药师护袍→8/7及手机续12/8，整份公会API与UI都严格相同；另独立正常12图完整收集。test另正常21次证明history20截断仍保留册。首次test3把configurationChanges格式化值误当number，已改精确string1/8，失败TAP保留。浏览器桌面pending期间换图后仍只记原图，全部场景/奖励/首通唯一/历史/备份，390px实际第三图、完整册恢复只读展示通过，0错误无溢出；v80完整浏览器回归通过。新截图仅内部。默认/tmp/wod-v81或WOD_EVIDENCE_DIR。当前无新增重大产品待决，继续单人系统/内容；不推送、合并或部署。


## v0.82施法媒介续接

v0.82按R1技能/媒介选择加入跨路线资源取舍：符纸类攻击/支援/召唤逐行选标准、心诵（+4MP/0符纸）或复写（-3MP最低1/2符纸），先个人进阶后媒介；效果与检定不变，港口预留/免费跳过/后备指令/分媒介账本按真实成本。560测试、32完整默认旧报告等价、48有限六人通关样本及正常两次公会结算全对象UI/API等价、桌面/390px和v81浏览器回归通过。原型参数，不冒称原版数字，16路线/34装备保持，详见[V82_CASTING_MEDIA.md](V82_CASTING_MEDIA.md)。新增阶段仅本地，不推送/合并/部署。

feature/v082-casting-media从e188ed7干净549基线接续。media-data纯枚举与校验，media.commandCost先skillManaCost再调整，所有支付/预览共用。engine只有非标准cast加medium对象/itemAmount，非标准skip记所需和0支付；默认报告无新字段。ledger按skill+medium分组并累计实际amount，support/cooperation/readiness/resource-check不再硬编码每次1张；review/guild ready/UI显示媒介，切非符纸技能清字段。只有明确自定义才覆盖托管职责。

新增11项tests/v82.test.mjs；casting-media-cases只作固定研究方案，不是公开最优预设。check-v82两资产×四组×六种子，发现/确认分开，48全六人不等于普遍必要；学者缺料尝试也不等于损失有效施法。正常新公会seed1混合→seed2仅学者复写，130/55古琴→85/40古琴，最终215gold/全员95XP/两琴未配装，无购买/培养。browser-v82与API完整guild严格同。390px只恢复/证据/编辑/切技能，没有第三次实际出征。v81完整浏览器回归通过；两次初稿导航假定超时原件保留，未改规则。

云端证据/workspace/wod-evidence/v82，独立v81参考/tmp/wod-v081-reference；复验命令和限制见V82_CASTING_MEDIA。原版数值待核不阻塞新系统；保持单人、普通技能自由与独立进阶。无推送/合并/PR/部署，无新重大待决。


## v0.83心理攻击续接

v0.83按R1增加心理攻击：吟游者自由普通技能诘心回声，6法力/无材料，独立心理抗性、物理护甲不参与；仍共用法术/心理防御栏和既有心智抵抗培养。新两场24补给镜心问堂含首场心理薄弱重甲、末场抗心理弱法审守与定心支援，固定定心缎带有心理抗性/法术弱点取舍。568测试、30执行/18不同战斗输入的有限检查、32旧报告除严格断言的新增零抗性/可用技能外相同；桌面/390px三次真实出征和两份全量公会API等价、v82媒介浏览器回归通过。17路线/35装备，原型数值；详见[V83_MENTAL_ATTACKS.md](V83_MENTAL_ATTACKS.md)。新增阶段仅本地，不推送/合并/部署。

feature/v083-mental-assault从9aeb7a6干净560基线。TYPES增加mental、DEFENSE_TYPES保留原三栏，defenseProfile mental映射magic并用原意志/智力与resist成本。mental attack只令本次armor=0并记mentalRule，抗性独立；dissonance仍magic。心理快照增加mental键，E最终skills新增mindcall，所以32旧报告只在严格核零/基础6后归一这两处，全其余对象相同，不冒称raw全等。review差异格式化必须用DEFENSE_TYPES，首次全回归在此发现崩溃已修。

inquest模块2场公开原创敌群；data接route/budget/IDs/config，adventure/stage/ledger/outcome接真实场景/结尾。calmribbon固定饰品wil2/agi-2、mental20/magic-10，仅正常通关领取。pressure基本可用，composure用已有resolvechant课程，须正常40XP学习；questioner个人构筑不预装未学课程。普通技能/后期进阶没有互斥改动。

check-v83正常首通140/60→40XP学定心吟→20XP训诘心一级→缎带C→复战90/40，最终230gold/E40XP/其余100XP；手机把C magic改natural后seed3真实6/9回合→320gold/E80XP/其余140XP，两份完整guild均与UI全对象同。30模拟包含plain/pressure在fresh/studied重复，按configFingerprint记录18不同输入，不算30独立策略证据。全部六人只为有限教学短线结果。

568全回归、235mjs38cjs，新桌面/390px与v82完整媒介浏览器通过。首次规则夹具的回蓝/进场初始化/课程/节拍成本断言失败和真实review崩溃全部保留，未弱化断言或调敌人过测。云端证据/workspace/wod-evidence/v83，参考/tmp/wod-v082-reference，截图内部。没有推送、合并、PR、部署或新重大待决。


## v0.84召唤形态续接

v0.84扩展跨路线召唤：潮卫/较脆的远程弩灵共用每主人一只存活限制，新增2法力预备召回，仅本人、不退款、之后另付成本重召；召回不当作增益，目标检查认识所有形态。既有唤潮研修/媒介、独立行动和主人倒下/房间清理一致。577测试、48不同有限输入全员通关、34旧报告除严格核对的潮术师两项可用技能外相同，桌面/390px三次真实出征与两份完整公会API等价、v83浏览器回归通过；保留第二场召回后缺符纸重召失败。另修复问堂账本被显示条件隐藏。仍17路线/35装备，无新资产赠送，详见[V84_SUMMON_FORMS.md](V84_SUMMON_FORMS.md)。新增阶段仅本地，不推送/合并/部署。

feature/v084-summon-forms从868ef25干净568基线。summons纯模板保持原sentinel完全一致，tidearcher生命24+3lv、shot优先rear、低生命/无箭支出；spawn传入实际skill。hasSummoningSkill统一职责/预览/画像，不误认召唤物。recall为buff标记的固定utility，只在预备、2MP，空目标免费，实际移除仅owner自有存活单位并发recall dismiss；不生effect、不返还资源、不占同次重召。deployment/preview/support-index排除虚假增益，原始详情/演出显示召回。唤潮研修同为两形态-2MP，召回不减；媒介先研修后调整。

withSummonPlan仅改C预备，不送资产；48不同输入含none/guardian/archer/shift×问堂/异变×六种子，全部六人但不推荐最优。34原报告只归一已断言C新增技能6/6，其余全同。新公会弩灵seed1=4/4回合140/60；20XP训练弩灵、分配缎带C；shift seed2=5/5回合90/40，首场60潮卫→召回→45弩灵，次场召回后rune0未重召。不要延续早期把两场都说成成功换形态的错误判断，replacement-blocked.json是实际反例。手机seed3改弩灵入场front仍攻击敌rear，4/5回合90/40，最终320gold/C120XP/其余140XP；两份整公会API/UI均同。

577最终全回归、239mjs39cjs通过，新三次浏览器和v83完整回归通过。第一次快捷编辑导航脚本错误、第二次真实inquest账本hidden白名单缺项及修复均保留，不强制点击或删断言。截图只内部；证据/workspace/wod-evidence/v84、旧参考/tmp/wod-v083-reference。没有新地城/装备/账号/服务或重大待决，保持本地提交与单人方向。


## v0.85守卫援护续接

v0.85按R1增加真实守卫援护：5法力预备许可覆盖一个阵位最多3名其他友方，近战/远程到来时每回合最多付2法力尝试一次，体质/感知/援护检定达到攻击实掷×0.8上取整才接招；随后仍正常防御承伤，失败也付费，法术/心理绕过。原目标/实际受击者、许可来源、反应法力分别可追溯。588测试、36不同有限输入全通/11次有伤员、34旧报告除严格核对的守卫可用技能外全同；桌面/390px三次真实出征与两份完整公会API等价、v84召唤浏览器回归通过。仍17路线/35装备，详见[V85_GUARDIAN_INTERCEPTION.md](V85_GUARDIAN_INTERCEPTION.md)。新增阶段仅本地，不推送/合并/部署。

feature/v085-guardian-interception从7402fe1干净577基线。interception纯候选检查，engine本房Map按来源/round限一次，攻击先固定本次attack roll，再反应付2MP/roll(mean interpose)与ceil(attack*.8)比较；成功替换本次chosen的实际target，之后正常defense/armor/resistance/HP，原cast.targets不改且attack.detail.interception另记原目标/反应事件。无援护时不加roll/event，34旧报告仅新增A可用技能6外完全同。cover正面许可自己除外、最多3；失效原因写intercept-skip，未付费不占次数，范围攻击不去重代接者，不递归援护。

ledger/personal反应MP独立累计，不混施法或主动防御；sourceTrace匹配cover唯一身份和原受护人，支持跳回许可/返回。stage显示接招/未及/未触发，支援记录不换算避免伤害。每种守卫技能仍自由培养，训练interpose提高反应mean2/级，不提高覆盖人数或次数；援护卫士角色起点需明确应用。

初稿直接比攻击实掷导致守灯seed1 4尝试0成功且失败，完整initial-direct报告保留，无控制组不能归因；只调新机制系数0.8后固定，敌人不改。36矩阵均通但11伤员，守灯确认低成功，不推荐通用升级。正常问堂免费专修interpose→seed1 5/5回合140/60，4尝试2成功：首下闪避0、次下命中15、失败两下原目标15/21；20XP训一级→选dodge→seed2 5/5回合90/40，4/4但不同种子/防御不做训练因果。手机改center→seed3 5/5回合、心理免费绕过，最终320gold/A120XP/其余140XP/三缎带未分配，两份整guild API/UI皆同。

最终588测试（新增11，含近战/已入场弩灵保护），243mjs40cjs、新三次浏览器及v84完整召唤回归通过。初始browser误要首次接招正伤害，改同seed精确校验0闪避与15实扣，失败原件保留，无调数值/挑种子/删扣血断言。截图内部；证据/workspace/wod-evidence/v85，参考/tmp/wod-v084-reference。无新地城/装备/迁移/账号/服务或重大待决，持续单人、本地提交。

最终复核还补齐致命代接后原群攻列表再轮到已倒下护卫的边界：attack-skip不再掷骰/防御/重复down，不退原施法，其余活目标继续。固定D/C/A夹具原稿A/C/A重复down两次保留；最终A/C+skip只一次down，新增第11项，最终588测试。


## v0.86折潮哨垒续接

v0.86新增三场连续单人地城“折潮哨垒”：前排护医师、后排护弩兵、双盾护医师的敌方援护组合，复用既有反应/心理/救护规则，支持拆来源和绕过的不同分工。新增有护甲/法力/法术抗性代价的固定哨誓披甲，正常首通170金币/70经验、重复115/50。596测试、36不同有限输入六人生还、34份旧原始完整报告与v85逐字段相同（无排除）、桌面/390px三次真实出征及两份完整公会API等价、v85浏览器回归通过。18路线/36装备，详见[V86_PALISADE_GARRISON.md](V86_PALISADE_GARRISON.md)。保持单人、自由普通技能与独立进阶；新增阶段仅本地，不推送/合并/部署。

从干净59a98cdb4da1ead3e6872efda75c7fe56256dd3d/588基线，在feature/v086-palisade-garrison开发。palisade纯内容模块，3房间id为palisade_signal/crossfire/command；30补给，plain/break/bypass三起点，同初始资产，按钮不改公会/已应用职责。反应不连锁，不修改引擎/公式/旧敌群。watchmantle固定掉落且须明确分配，守卫同战术实际+8HP/-4MP/+5援护均值/-2护甲；法术弱点不等于心理弱点。正常seed1→配装/付20XP重箭1→seed2→手机恢复改方案seed3，金币170→285→400，两份全公会与API相等。

专项初次7/8因把默认实验731与真实next1混淆；阳性不连锁用最初731固定观察，保留精确实际受击断言，公会流程仍seed1。初次浏览器仅文案“每次/一次”不匹配，修正脚本，原失败保留；末轮核对结尾路线标签。596/596，247mjs41cjs，36有限六人全通，34旧原始完整战报零排除相同，新三次浏览器/v85三次回归通过。证据/workspace/wod-evidence/v86，参考/tmp/wod-v085-reference。截图只内部，Library结果另记。没有新的重大产品决策/开发阻塞；继续单人路线图，未推送/合并/部署。


## v0.87破印续接

v0.87新增跨路线学者普通技能破印符：低伤法术需命中存活的带增益敌人，移除最早同技能/同来源一组正面组件（含待生效）；本次防御/既定行动不回滚，来源仍可重施。普通培养、媒介、独立库存/预留和精确来源照常；个人按组/组件计数。610测试、72不同有限输入（保留12失败/18有人倒下）、36旧报告仅精确核对的新增可用技能字段之外全同；桌面/390px正常首通→培养配装→邮路失败部分领取→剧场恢复挑战、完整公会API等价及v86浏览器回归通过。仍18路线/36装备，详见[V87_UNRAVELING.md](V87_UNRAVELING.md)。本轮仅本地，不推送/合并/部署。

feature/v087-unraveling从bca9062265d59229430de377797d5cfd9f24cb82干净596基线。unravel辅助模块筛正面技能/来源一组，engine只在新技能目标池筛选和普通attack后处理dispel/dispel-skip；本次防御保留，之后移除，队列不回滚，pending不再激活，允许重施。学者基础skills追加unravel，两学者自由；unraveler构筑草案3级不等于公会训练。实际出征9级→付20XP后10级。新事件绑定攻击ID/原效果ID；source-trace保留攻击与移除两类证据，stage/support/highlights/personal/UI均只读。

真实哨垒1首通170/70→分披甲给A/训练D→邮路2末房全倒，仅两房40/20无装备→手机恢复后剧场3首通130/55。最终340金币、本人125/其他145经验，古琴未分配。两份整个公会与API零排除相同。72有限输入保留12失败，邮路通关8/12但全员2/12，不用破印4/12且全员4/12，非通用升级。36旧报告只移除精确断言的新可用技能字段后相等，不写零排除完整相同。

专项最初12/13，漏算法器自然防御3，已精确改为3+6=9；原失败保留，不改数值/种子。新增第14项验证破除援护后后续物理攻击原目标，来源仍活；不破除阳性对照实际被代接。610全过，251mjs42cjs，新浏览器/v86回归通过。证据/workspace/wod-evidence/v87；参考/tmp/wod-v086-reference。截图仅内部，Library结果另记。无新迁移/账号/服务或产品待决，继续单人本地开发。


## v0.88逆印书库续接

v0.88新增三场连续单人地城“逆印书库”：敌方分别对前排/中央/后排使用既有破印规则，玩家可拆来源、少用增益或另付材料重施；含真实待生效护印移除与药膳补施。新增固定辨印晶镜，法术均值/抗性收益伴随生命/意志/心理弱点代价，修复配装比较遗漏心理差值。618测试、36不同有限输入（2次有人倒下）、36旧原始完整战报零排除相同、桌面/390px三次正常成长闭环与两份完整公会API等价、v87浏览器回归通过。19路线/37装备，详见[V88_COUNTERSEAL_LIBRARY.md](V88_COUNTERSEAL_LIBRARY.md)。保持单人、普通技能自由培养与独立进阶，本轮仅本地，不推送/合并/部署。

从干净abe535b17906968cb8b56814b8d94986b1992b1d/610基线，feature/v088-counterseal-library。scriptorium声明式三场entry/stair/vault，3方案source/lean/renew均12药草10符纸8箭矢，相同草案装备/培养，常规道具占普通行动，不送资产。敌方unravel每回合一次、微光后备，正面筛选后有原阵位回退；不保证永远命中所写阵位。新徽记、敌情、实际场景/压力说明/结尾及账本接入；游戏引擎/公式/旧敌群不改。通用gearDifference补心理差值，counterlens固定饰品实际-8HP/+3MP/+3破印均值，法术+10/心理-10。

真实source1首通180/75→本人D分镜/付20XP破印1→renew2复战125/55→手机恢复lean3复战125/55，三次6人、总430金币/本人165经验其他185，仓库2镜/本人首镜。两份全公会与API相同。36有限组保留fresh lean102/203各5人，长战斗更耗总物资，因此UI从低耗推进改为少用增益并明确单次/总消耗区别；没有调数值或改种子。36旧完整报告原始对象零排除等价。

新增8项全部过，最终618/618、255mjs43cjs、新三次浏览器和v87三次回归通过。初次browser仅错误页签departure等待超时，改实际overview，未强制点击或弱化断言，首份失败保留。证据/workspace/wod-evidence/v88，参考/tmp/wod-v087-reference；截图只内部。Library结果另记，无新迁移/账号/持续费用/重大待决，继续单人本地开发。


## v0.89弩灵目标续接

v0.89新增弩灵战前攻击优先，与己方入场阵位分开；可选敌方阵位/治疗者/召唤者，职责缺失免费后排后备且每次重新检查。逐房命令固定于各次入场，默认旧行为/成本/生命周期保持；含猎援构筑、严格校验、切换技能清理与实际召唤证明。625测试、72不同有限输入全员通关、38旧原始完整报告零排除相同、桌面/390px三次正常成长与两份完整公会API等价、v88浏览器回归通过。仍19路线/37装备，详见[V89_SUMMON_ORDERS.md](V89_SUMMON_ORDERS.md)。仅本地，不推送/合并/部署。

从2c351ef5b6fc290c8734c0471bfa22960c107d59干净618基线，feature/v089-summon-orders。可选prep行summonTarget仅弩灵合法；无字段的旧默认命令/报告不变。summon-orders纯函数生成主指令，职责后备cycle确保每次再检查；spawn固定当次命令，事件orders/form记录实际目标，UI用SUMMON_TARGETS解释职责。切换技能删字段、选rear删可选字段。常规召唤限制/成本/清理和原脚本双卫不改。

正常本人C：问堂1 140/60→付20XP tidearcher1→疗所2 140/55→手机恢复书库3 180/75，六人、总460金币/本人170经验其他190，三件奖励未分配。UI/API整公会无排除相等；72输入只变目标字段，38旧完整报告原始全等；625/625，259mjs44cjs，新浏览器/v88回归通过，无初稿失败。证据/workspace/wod-evidence/v89，参考/tmp/wod-v088-reference，截图内部。无新迁移/账号/持续费用/重大待决；继续单人本地。


## v0.90潮蚀续接

v0.90新增药师普通技能蚀潮药剂与潮蚀持续伤害：4法力/1药草、低伤初击，命中存活者后下一及再下一回合开始按基值6/当时法术抗性跳伤；不重掷/重复收费、不刷新，可净化。含真实生命/溢出、来源、个人持续实伤和终局/召唤/碎印时序。639测试、72不同有限输入全员通关、38旧报告仅精确新增药师可用技能字段外相同；桌面/390px正常培养/敌方净化/三次领取与完整公会API等价，v89浏览器回归通过。仍19路线/37装备，详见[V90_CORROSION.md](V90_CORROSION.md)。本轮本地，不推送/合并/部署。

从956130b53a0837892a8f87165d58f1cf310f465b干净625基线，feature/v090-corrosion。corrosion纯常量/筛选/来源，mireflask加入两药师普通技能。初击后挂harmful且pending，activateTick+1/expiresTick+2；原净化即可移除。回合开始先原缓释再harm，tick作用按当前magic抗性，记录真实HP/溢出、零费用；source死仍保留。down清主人召唤；半血awakens在随后队列前处理；终局continue使当前回合正确计数，跳过多余预备/自然回复/先攻。

个人damage/taken含harm，periodDamage/periodRecords单列；source-trace精确原effect，stage/highlights/UI可读，负面激活带harmful元数据，旧正面事件不加字段。原公式/其他技能不变，旧38报告仅严格断言的F可用技能新增外全等，不写原始零排除。正常书库1 180/75→付20XP mireflask1→剧场2敌方净化130/55→手机问堂3 140/60；总450金币、本人F170经验其他190，三件奖励未分配，两份整个公会与API同。

14新增专项/最终639全过，263mjs45cjs、新浏览器/v89回归通过。首稿12/13是同排召唤物分走目标，改合法summoner职责锁定主人并加强溢出；后增跨房夹具13/14因高敏捷提高远程防御，改可靠法术收尾。原JSON/TAP/首个全量失败保留，不改普通数值/种子或削断言。source-dead初探未击倒来源亦已注明改边界夹具。证据/workspace/wod-evidence/v90，参考/tmp/wod-v089-reference；截图内部，Library另记。无新迁移/账号/持续费用/重大待决，继续单人本地。


## v0.91蚀潮温室续接

v0.91新增三场连续单人地城“蚀潮温室”：敌方按房向前排/中央/后排附蚀，拆来源、按房净化或药蚀反制各有行动/材料取舍；固定滤露面纱以智力/敏捷/法力代价换法术抗性。647测试、36不同有限输入六人生还、38份旧原始完整战报与v90零排除相同；桌面/390px三次正常领取/配装/付费培养与两份完整公会API等价，v90浏览器回归通过。20路线/38装备，详见[V91_MIRE_GREENHOUSE.md](V91_MIRE_GREENHOUSE.md)。本阶段不改引擎/成本，仅本地，不推送/合并/部署。

greenhouse声明三房，既有蚀潮/净化/法术抗性规则进入敌方：各自库存，不扣玩家材料，来源死亡不撤跳；首跳后的净化仅取消后续。三个准备起点不送技能或装备，按房净化只含净化、不藏屏障后备。面纱法术抗性+20、意志+2/智力−2/敏捷−1；A的法力−2，只有真实装备才生效。固定已赚取资产seed1实验有基值6→4实伤；正常第二/三次A没有跳伤，不能冒称是面纱减少总伤害。

正常本人D：净化seed1→190金币/80经验/面纱，明确分A并付20XP训练心智抵抗；拆来源seed2→135/60，桌面325金币、D120XP/其他140XP、一面纱仓库；390px恢复后药蚀反制seed3→135/60，最终460金币、D180XP/其他200XP、两件仓库/首件A穿着。两份浏览器完整公会与API原对象严格相同，零排除；pending改准备/刷新保留原报告/奖励，历史/备份保留当时资产。

8新增专项/647全量通过，267mjs46cjs、新浏览器/v90回归通过。36有限输入全部六人，方案是多项变化且随机序列改变，不作单项因果/净化必要/最优结论。19旧路线×seed1/731共38份原始完整报告零排除等于v90；本阶段不再增加可用技能字段。敌方实际净化玩家毒另用关闭F自动救护/药剂攻前排的合法反例，非默认建议。

初探曾训净化但不会增加固定清除数量，最终正常路径改用有实际收益的心智抵抗；保留initial/refined探测与DESIGN_REFINEMENT，无调普通数值/种子或弱化断言。专项及浏览器没有初稿失败。脚本greenhouse-cases/check-v91/browser-v91，报告V91_MIRE_GREENHOUSE及四JSON；证据/workspace/wod-evidence/v91，参考/tmp/wod-v090-reference。截图仅内部，Library回执另记。规则0.57/配置0.40/公会6不变，无新迁移/服务/重大待决，继续单人本地。


## v0.92指令用料底线续接

v0.92补齐跨路线指令用料底线：每条耗材指令明确付款后至少留多少，条件不足免费走原有后备，不锁材料归属；自动救护仍可用到进攻底线以下。实际媒介支付、逐房覆盖、托管/明确自定义、出征卡片、存档、后备证据跳转与复盘贯通。656测试、24不同有限输入六人生还、40份旧原始完整报告与v91零排除相同；桌面/390px三次正常成长和两份完整公会API等价，v91浏览器回归通过。仍20路线/38装备，无新数值/资产/费用，详见[V92_COMMAND_STOCK_FLOORS.md](V92_COMMAND_STOCK_FLOORS.md)。本地，不推送/合并/部署。

每条有材料技能可带keepStock整数1–60，编辑0省略。支付前按实际commandCost检查stock−amount≥keepStock，低于免费后备、未计一次/回合次数，仍按原游标；群攻一次检查/支付。心诵保留字段但没有材料支付所以不参与；改无材料技能清除字段。港口事件预留先检查，第三场仅释放事件预留，逐条底线继续。敌方只看自己的库存，自动救护不带此逐条规则。绝非把物资锁给某人或保证节省。

stockFloorCheck/Label/Warnings/Evidence在独立模块，engine只在有字段且实际用料时新增stockFloor详情。skip补stockOutcome指向真实后备/普通failed/无预备；旧报告不加空字段。公会实际卡片和伙伴预览、静态材料行、配置差值、账本/复盘均显示明确底线；复盘定位现打开行动证据。实际使用由已应用职责决定，采用草稿会明确转自定义，不偷偷改伙伴托管。

本人F正常温室seed1→190/80，付20XP训药剂，书库seed2→180/75，桌面370金币/F135XP/其他155；390px恢复剧场seed3→130/55，最终500金币/F190XP/其他210，三件奖励未分配。首场药草4时进攻走穿石箭，之后救护用到3；第二场2次底线后备，第三场0次，不能把“配置了”当成“节省了”。两份完整公会与API零排除同。

24有限不同输入，三路线×4种子×无底线/留4，每对仅改一个字段；12对中7对实际触发、5对结果/物资/施药/救护指标同。书库101末房5→6回合，更多救护仍可用尽药草，保留负面取舍和RNG解释，不宣称最优。20旧路线×seed1/731的40原始完整报告零排除同v91。9新增专项/最终656、271mjs47cjs、新浏览器/v91回归通过。

初次导入误用、6/8专项夹具问题、编辑器漏导入/卡片漏呈现真实错误和浏览器外层details导航问题全部保留并精确修正；见FIXTURE_ADJUSTMENT及initial/second/third-browser，未改普通数值/种子或弱化断言。证据/workspace/wod-evidence/v92，参考/tmp/wod-v091-reference；check-v92/browser-v92复现，四JSON回执与专项。规则0.57/配置0.40/公会6沿用，使用新增字段需本版本代码；无旧档迁移、新账号/服务/重大待决，继续单人本地。


## v0.93法力援助续接

v0.93补齐队员间法力调配：吟游者自由普通技能借潮咏，付8法力及一次普通行动，给所选范围内最低比例且不高于50%的另一名正式队友，转入不超过实际支付；保留原有自然恢复/药瓶及少输出的代价。666测试、24有限输入六人生还（12启用中8无转入）、40旧报告仅精确新增吟游者可用技能字段外相同；桌面/390px正常转6、付120XP后转7与两份完整公会API等价，v92浏览器回归通过。仍20路线/38装备，详见[V93_MANA_TRANSFER.md](V93_MANA_TRANSFER.md)。仅本地，不推送/合并/部署。

manalink是吟游者免费普通transfer技能，乐器/8MP/普通行动，不放预备、不受仅封草药救护禁疗影响。选指定友方阵位或全队最低MP比例且≤50%的其他存活非召唤单位，稳定队伍顺序，无目标免费后备。min(实际支付,max(1,floor(1+实时均值×.08)))再按目标上限截断，不退来源付款，不回滚先前失败施法/既定队列；每回合一次/游标仍沿原规则。原1MP回合自然恢复和有限药瓶不变，不能按整房MP差额算转移收益。

元数据/引擎/构筑与静态伙伴/协作候选贯通；mana-transfer原事件记双方前后/完整支付/实际/上限/净损失，个人分别记manaGiven/Received，不能混入HP治疗或伤害。账本施法8另记，舞台/高亮/完整动作摘要/个人双方来源可定位；手机规则整行显示。未使用时不加空计数字段，40旧报告只新E.skills.manalink精确6，断言后删除这一项才全同，绝非零排除原始全对象。

本人E正常温室seed1→190/80，援C6付8；书库seed2→180/75，援D6付8，两次370金币/每人155XP后实付20/40/60训练至3，本人35XP；390px恢复剧场seed3援前排，两次均值77各转A7/付8，130/55后500金币/E90XP/其他210，三奖未装备。两份完整公会API零排除等价，历史仍各自当时培养。

24不同有限输入三路线×4种子×E.main援助/仅后备，12启用中8实际0，四个温室样例有转入且末房回合有增有减。首个正常seed1书库探测还保留7→8回合/药余4→2的代价，不为证明优势调数值/种子。新10专项、最终666、275mjs48cjs、新桌面/手机与v92完整浏览器通过。初次构筑gear转换位置错误、自然回蓝/cast逐房编号/游标/舞台参数/NPC乐器均值/null快照夹具误解及未展开协作details的浏览器失败均保留；见INITIAL_FIX、initial/second TAP、首个665/666全量与初次浏览器。

证据/workspace/wod-evidence/v93，参考/tmp/wod-v092-reference；mana-transfer-cases/check-v93/browser-v93及四JSON复现。规则0.57/配置0.40/公会6沿用，新技能需匹配源码，无旧档迁移、新账号/服务/重大待决。Library结果另记，持续单人本地，不推送/合并/部署。


## v0.94正式循环续接

v0.94按整体循环审查修复首次引导误入实验的问题，打通正式公会核对→战报来源/精准待领→归营收据→个人成长配装→现有章节/故事目标；20路线改按四主题组织，目标可跳过、全部路线仍开放。678测试、40份旧原始完整报告与v93零排除相同；桌面/390px空档四次正式出征/既有结局、两份完整公会API等价、跨页旧报告不误领新一笔与模拟保存失败保护、v93浏览器回归通过。仍20路线/38装备，无新增技能/奖励/战斗数值，详见[V94_OFFICIAL_EXPEDITION_LOOP.md](V94_OFFICIAL_EXPEDITION_LOOP.md)。仅本地，不推送/合并/部署。

基线实际断点：first-guide的run点击实验#run（无成长），现改点guild-run仅进入核对，之后玩家明确正式出征。campObjective只读当前pending/已领clears/本人实际训练/已有两故事结局，失败后载入止步方案供检查，不自动重战/投资/领奖。个人培养可跳过，全部路线仍可自由选；四主题覆盖20路线一次，数据ADVENTURES原顺序/内容/引擎都不改。

pendingOrigin包含ID及完整pending JSON快照；reportHandoff核对源、配置、当时command/主角。实验/试演即使相同战斗输入也不领奖，历史原收据只读；旧报告遇新pending只显示明确新编号入口。claimReport只接受匹配pending并用原claim重算真实奖励，UI领取前重新读档，保存沿原raw比较；不是新增跨进程锁/服务器幂等。storage/focus只刷新提示，不写公会或丢弃准备草稿。来源只在页面内，不混入下载战报或存档schema，刷新用原pending/历史入口重建。

实际空档本人A：侧廊1→40/10；修道院2→120/45，分圣匣重盾A并付20XP格挡，桌面160金币/A35XP/其他55；390px恢复章节3→280/120，港口4→285/100（含旧home目标40），再明确选旧灯塔light40金币/仪杖。最终765金币/A255XP/其他275，沉钟残片1/仪杖2仓库，盾仍A持有，目标指向现有铸库；两份整个公会与API零排除一致。单一路径不作全局可靠性或难度排序。

12专项/最终678全过，280mjs49cjs、新四次浏览器及v93三次回归通过，40原始完整旧报告零归一化等于v93。独立双页档额外章节3/侧廊4，旧页不能重领或误领新一笔；模拟保存异常保持所有资产/pending，恢复测试方法后手动领取一次到480金币，和主流程765档分开。试演不领奖由单元验证，完整v60浏览器未重跑。首轮专项/全量/新浏览器均通过，无普通数据/种子调整或弱化断言。

模块camp-cycle/camp-cycle-view，guild-ui/UI正式来源与目标动作，index入口/版本标签与CSS主题排版。official-loop-cases/check-v94/browser-v94复现；四JSON和V94_OFFICIAL_EXPEDITION_LOOP记录框架完成度/局限。证据/workspace/wod-evidence/v94，参考/tmp/wod-v093-reference。规则0.57/配置0.40/公会6不变，无新持久任务字段或旧档迁移。有限单人仍无自由创建/种族和完整原版等级精通；未以技能数量冒作完成。继续本地，不推送/合并/部署。
