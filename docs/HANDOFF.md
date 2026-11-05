# 接手开发指南

## 先读

README → PROJECT_STATUS → ROADMAP → DEVELOPMENT_POLICY → DECISION_PROGRESSION → V54_FREE_TRAINING → V53_SUSTAINED_CARE → DECISION_SPECIALIZATION → V52_CADENCE → V51_EDITING → V50_SEER → V49_DISRUPTION → V48_SUPPORT_EVIDENCE → V47_SCHOLARS → V46_COOPERATION → V45_LEDGER。按任务再看相关版本报告和测试。不要因旧报告仍写“待决策”就重复询问已经确认的选项。

## 运行与验证

无需npm安装或构建。`dist/`含手写HTML/CSS/ES模块，必须纳入Git。

```sh
python3 -m http.server 8000 --directory dist
node --test tests/*.test.mjs
node --check dist/expedition-ui.mjs
git worktree add --detach /tmp/wod-v052-check 52adecb
node scripts/check-v53.mjs /tmp/wod-v052-check
git worktree remove /tmp/wod-v052-check
git diff --check
```

本轮云端验证环境：Node v24.19.0、Python 3.12.14、Chromium 154.0.8037.57；最终349项测试通过，131个ES模块及8个浏览器脚本语法检查通过。无构建步骤。browser-v50/v51/v52/v53.cjs分别保存各阶段验收，当前浏览器参数见V53_SUSTAINED_CARE.md及V49报告。需要本地HTTP服务，不建议file://打开ES模块。

当前引擎RULESET为original-wod-inspired-0.53.0，配置schema仍0.40.0。三组页面活动样本v13/v14/v16共1,824条已用新引擎重放，除规则标签外数据逐项相同。历史研究数据保持原口径，不冒充新技能的平衡结果。历史check脚本需要完整复现时检出对应提交；当前旧版等价入口是check-v53和v0.52参考工作树。无参考目录运行会将V53_CHECKS的旧版比较写为null，不能声称复验旧版。

v0.50–v0.53的独立分支/本地提交均可恢复，v0.49已推送d6f77b8，之后没有推送或部署。当前下一步等待DECISION_SPECIALIZATION的核心养成方向选择，职业专精提案尚未实施。

## 代码地图

| 路径 | 职责 |
|---|---|
| dist/index.html、expedition-ui.mjs、expedition.css | 当前主入口、交互与界面 |
| dist/expedition-data.mjs、content.mjs | 规则配置与内容 |
| dist/expedition-engine.mjs | 不依赖DOM的确定性模拟 |
| dist/expedition-regeneration.mjs | 可选药敷的存活/激活触发筛选，恢复由引擎在回合开始记录 |
| dist/expedition-disruption.mjs、healing.mjs | 当回合禁疗能力/来源与自动救护决策（后者同样有expedition-前缀） |
| dist/expedition-guild*.mjs、personal*.mjs、roster*.mjs | 公会、主角、名册与角色状态 |
| dist/expedition-equipment*.mjs、growth.mjs、loot.mjs | 装备、成长与掉落（后两项同样有expedition-前缀） |
| dist/expedition-harbor*.mjs | 盐风港分支、职责、挑战与预留 |
| dist/expedition-support-evidence.mjs | 正式队员辅助的实际受益者、后续字段、来源与复盘索引；不推断额外伤害或胜负贡献 |
| dist/expedition-cooperation.mjs | 准备草稿/公会实际配置的只读协作、全部辅助单次费用与逐条编辑定位 |
| dist/expedition-resource-ledger.mjs | 逐人逐房用料账本 |
| dist/expedition-report.mjs、review.mjs、stage.mjs | 战报、复盘和战场投影（后两项同样有expedition-前缀） |
| scripts/、tests/ | 确定性实验与Node测试 |
| dist/assets/、docs/ | 场景素材、版本报告、历史验证及截图 |
| .openai/hosting.json | 原Site身份和静态目录配置；不是GitHub Pages配置 |

## 开发边界

规则结算与显示分离，复盘不能修改战果；实验不能发放公会资产。身份和职业分开，避免重新引入固定a–f索引假设。统计须说明因果边界、样本范围和失败口径。素材来源及提示词见ASSETS及对应版本文档；没有凭空补加第三方授权或全仓库开源许可证。

## Git与发布

GitHub仓库作为后续接续入口，建议每个可验证阶段及时提交并推送，避免只有聊天记录。原45个提交的信息保存在docs/SOURCE_HISTORY.txt；GitHub导入为源码快照，不保持原提交对象链。迁移不会自动配置GitHub Pages，也不会改变现有Site访问权限；GitHub源码与Sites部署是两个独立动作。后续发布仍要同步准确源码、验证并记录对应版本。不要把凭据、浏览器个人存档或临时运行配置提交。

新的接手者应在完成一轮后更新PROJECT_STATUS/ROADMAP，记录真实测试结果与尚未完成项。旧会话未恢复的v0.46不得直接标为已交付。

当前批准的推送为v0.49，远端完整SHA d6f77b8adb0ea7b696015d62c24172d5526b1a89；v0.50–v0.53四个阶段仅本地提交。不要因一般“建议推送”越过本轮范围，main不合并，Site不部署。

职责编辑统一经readiness.customizeForEditing物化实际配置，再切自定义。不要直接先setCompanion(custom)再从旧草稿读取指令；锁定技能必须仍可进入编辑移除，出征校验保持独立。安装指令先准备成功再保存职责。

round只允许普通阶段；有该条目时该角色本回合首次普通检查从首条开始，按条目计成功，闪避也计次，不越过前置持续指令。道具/救护优先且不消耗普通指令次数。

缓释只由已激活、正值且目标存活的药敷触发；回合开始先激活后恢复，不新增随机调用。每次恢复不扣费，不占普通行动，不复活，固定8点不随训练提高。统计已包含在总治疗，不与普通救护占行动混淆。

2026-11-05当前方向已确认，不再停在DECISION_SPECIALIZATION。普通技能保持自由，后期职业进阶独立。v0.54当前360项测试通过；trainingQuote统一显示成本/退款，lowerTraining只退最后一级，守恒careerXp并保留已学技能。browser-v54.cjs验证实际赚取经验和出征快照。
