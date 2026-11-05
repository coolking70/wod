# 接手开发指南

## 先读与当前约束

README → PROJECT_STATUS → ROADMAP → DEVELOPMENT_POLICY → DECISION_PROGRESSION → V62_RESERVE_TRAINING_PATHS → V61_TRAINED_RESERVES → V60_TRAINING_REHEARSAL → V59_TRAINING_PLANS → V58_GROWTH_ACCOUNTING。

用户已确认普通职业技能自由培养、独立后期职业进阶；DECISION_SPECIALIZATION仅是已撤回的普通技能互斥提案，不得据它重新询问或实施。参考服务器/版本尚未指定，Delta只作可替换研究候选，运行profile.referenceServer为null。这个资料约束只影响原版数值标定，不阻塞其他开发，见RULE_CALIBRATION_BOUNDARY与DELTA_REFERENCE_CANDIDATE。

## 运行与当前验证

无需npm安装或构建，dist是可编辑源码。Node24.19.0、Python3.12.14、Chromium154.0.8037.57。当前521项测试通过，0失败/跳过；214个ES模块、33个浏览器脚本语法检查通过。

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
