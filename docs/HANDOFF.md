# 接手开发指南

## 先读

README → PROJECT_STATUS → ROADMAP → DEVELOPMENT_POLICY → DECISION_PROGRESSION → V57_ALL_CLASS_ADVANCEMENT → V56_INDEPENDENT_ADVANCEMENT → V55_EXPERIENCE_TRAINING → V54_FREE_TRAINING。

用户已确认普通技能自由培养、独立后期职业进阶；DECISION_SPECIALIZATION只是已撤回的历史提案，不得据它重新询问或实现普通技能互斥。当前待补的是原版数值标定的参考服/版本及资料，见RULE_CALIBRATION_BOUNDARY。

## 运行与当前验证

无需npm安装或构建，dist是可编辑源码，不是缓存。Node24.19.0、Python3.12.14、Chromium154.0.8037.57；392项测试通过，142个ES模块及12个浏览器脚本语法检查通过。

```sh
python3 -m http.server 8000 --directory dist
node --test tests/*.test.mjs
node --check dist/expedition-ui.mjs
git worktree add --detach /tmp/wod-v056-check 988ddcd
node scripts/check-v57.mjs /tmp/wod-v056-check
git worktree remove /tmp/wod-v056-check
git diff --check
```

check-v57生成/tmp/wod-v57-earned-guild.json，来自正常8次疗所结算、课程/训练及资深试炼通关，不注入经验或通关标志。可用WOD_EARNED_GUILD指定备份路径。浏览器脚本browser-v57.cjs需外部Playwright/Chromium与HTTP服务，四个WOD_*参数沿用V49报告；当前默认备份路径与check脚本一致。服务端口可自由选择，本轮仅绑定127.0.0.1:8002，没有公开部署。

规则标签original-wod-inspired-0.57.0，配置schema仍0.40.0。页面v13/v14/v16的1,824条活动样本已按当前引擎重放，除规则标签外数值相同。历史研究数据保持当时口径，不冒充新进阶的平衡验证。历史全报告比较应检出对应提交；当前入口为check-v57和v0.56参考工作树。无参考目录执行会把旧版比较写为null，不得称为复验通过。

## 代码地图

| 路径 | 职责 |
|---|---|
| dist/index.html、expedition-ui.mjs、expedition.css | 当前入口、准备/实验、回放与证据 |
| dist/expedition-data.mjs、content.mjs | 原创内容、技能、配置与每项训练上限 |
| dist/expedition-engine.mjs | 无DOM确定性模拟，规则/呈现分离 |
| dist/expedition-training.mjs | 逐级费用、累计投入与精确退款报价 |
| dist/expedition-growth.mjs | 当前3阶段与高阶普通课程；不是原版完整英雄等级 |
| dist/expedition-advancement-data.mjs、advancement.mjs | 项目后期路径、统一法力/效果加成及资格（后者同样有expedition-前缀） |
| dist/expedition-guild*.mjs、roster*.mjs、personal*.mjs | 个人资产、公会、名册和逐人报告 |
| dist/expedition-readiness.mjs | 真实资产核对，customizeForEditing保留实际职责再切自定义 |
| dist/expedition-equipment*.mjs、loot.mjs | 固定属性装备、来源和奖励（后者有expedition-前缀） |
| dist/expedition-disruption.mjs、healing.mjs、regeneration.mjs | 禁疗、救护决策和缓释触发（后两项同样有前缀） |
| dist/expedition-cooperation.mjs、support*.mjs、source-trace.mjs | 协作候选、原始支援字段及来源（后两项同样有前缀） |
| dist/expedition-harbor*.mjs、resource-ledger.mjs | 港口分支/预留与用料账本（后者有前缀） |
| dist/expedition-report.mjs、review.mjs、stage.mjs、history*.mjs | 分组、复盘、战场和历史（后几项同样有前缀） |
| scripts/、tests/、docs/、dist/assets/ | 复验脚本、测试、报告/截图和素材 |
| .openai/hosting.json | 原Site身份/目录配置；不是GitHub Pages配置 |

## 实现边界

trainingCost返回递增费用单位，经验金额用trainingInvestment；没有总6点预算，MAX_TRAINING_RANK只约束每项。公会必须实际付经验，实验不能发放资产；降低一级只返该级成本，退到零不能重复退款。

个人advancement={path,paidXp:80}是独立资产，配置仅存路径。guildConfig、readiness、companionPreview和historyComparison都须经applyAdvancementAsset读取个人选择，实验草稿不能授予真实进阶。skillManaCost同时用于施法、治疗决策及预览；effectBonus进入真实效果值与来源，不能额外算一次贡献。

已付进阶成本计入careerXp，退回守恒；普通unlocked课程与训练不被删除。历史保留当时路径，当前退回不改历史；待结算必须匹配现有资产且不允许中途改配。普通技能互斥和后期路径选择是两种不同约束，不能混为一谈。

当前300经验/资深试炼/80费用、3阶段、每项+3均是项目参数。原版1–40英雄等级、差异费用/金币、精通冻结与重置点尚未核实为某个现行服规则，不能把历史百科当作已验证数值。规则证据和HTTP403缺口见WOD_DESIGN_REFERENCE_2026-11-05与RULE_CALIBRATION_BOUNDARY。

## Git与发布

本轮从v0.53 1970394继续，v0.54 8a63322、v0.55 7b033c1、v0.56 988ddcd及v0.57均仅本地。最后已批准推送的仍为v0.49 d6f77b8；本轮只读核验main为16986e0，未推送新阶段、合并或部署。源码、验证与报告一起提交；后续推送或Site发布遵循实际用户授权，不因一般建议自动执行。

本机存档不等于源码备份。不要提交凭据、个人浏览器数据或临时运行文件；测试备份由正常游戏事务生成、只在独立测试上下文恢复。素材来源见ASSETS与历史报告，没有补造第三方许可或全仓库开源许可证。
