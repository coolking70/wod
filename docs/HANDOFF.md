# 接手开发指南

## 先读

README → PROJECT_STATUS → ROADMAP → DEVELOPMENT_POLICY → V51_EDITING → V50_SEER → V49_DISRUPTION → V48_SUPPORT_EVIDENCE → V47_SCHOLARS → V46_COOPERATION → V45_LEDGER。按任务再看相关版本报告和测试。不要因旧报告仍写“待决策”就重复询问已经确认的选项。

## 运行与验证

无需npm安装或构建。`dist/`含手写HTML/CSS/ES模块，必须纳入Git。

```sh
python3 -m http.server 8000 --directory dist
node --test tests/*.test.mjs
node --check dist/expedition-ui.mjs
node scripts/check-v49.mjs
node scripts/check-v48.mjs
node scripts/sample-v47.mjs
node scripts/sample-v46.mjs
node scripts/sample-v45.mjs
git diff -- docs/V45_ROSTER_SAMPLES.json
git diff --check
```

本轮云端验证环境：Node v24.19.0、Python 3.12.14、Chromium 154.0.8037.57；307项测试通过，120个ES模块及4个浏览器脚本语法检查通过。无构建步骤。浏览器脚本browser-v49.cjs及参数见V49_DISRUPTION.md。浏览器访问本地HTTP服务，不建议直接file://打开ES模块。采样脚本需在仓库根目录运行，会重写对应样本文件。已有样本不应因无关文档改动而变化。

v0.49将引擎RULESET升至 `original-wod-inspired-0.49.0`；配置schema仍为0.40.0，不引入新存档结构。页面正在展示的v13/v14/v16三组共1,824条样本已按新引擎全部重放，除规则标签外数据逐项相同。旧阶段历史研究数据保持原样，不能当成新截疗符的平衡验证。`check-v49.mjs`无参数只写当前边界/功能结果；要重现9份旧配置逐条比较并保留对应结果，请按V49报告提供v0.48参考工作树路径。

## 代码地图

| 路径 | 职责 |
|---|---|
| dist/index.html、expedition-ui.mjs、expedition.css | 当前主入口、交互与界面 |
| dist/expedition-data.mjs、content.mjs | 规则配置与内容 |
| dist/expedition-engine.mjs | 不依赖DOM的确定性模拟 |
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

本次已获批准且已完成的是v0.48分支推送，远端完整SHA为990fca06b669b5b23e569bc821fa54b225840c12。v0.49在本地feature/v049-healing-disruption，未推送/合并/部署；不要把两阶段的授权混同。

当前连续阶段见V50_SEER.md。v0.49已按新授权推送并核验d6f77b8，之后提交只本地。运行 `node scripts/check-v50.mjs /path/to/v049-reference` 可复现固定确认组与旧版等价；browser-v50.cjs验证真实出征结算、学习及先攻来源。引擎仍为0.49，新先攻字段只作观察，没有改变随机调用。

v0.51当前319项测试通过，职责编辑统一经readiness.customizeForEditing物化实际配置，再切自定义。不要直接先setCompanion(custom)再从旧草稿读取指令；锁定技能必须仍可进入编辑移除，出征校验保持独立。browser-v51.cjs验证真实逐房覆盖。
