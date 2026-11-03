# 接手开发指南

## 先读

README → PROJECT_STATUS → ROADMAP → DEVELOPMENT_POLICY → V45_LEDGER。按任务再看相关版本报告和测试。不要因旧报告仍写“待决策”就重复询问已经确认的选项。

## 运行与验证

无需npm安装或构建。`dist/`含手写HTML/CSS/ES模块，必须纳入Git。

```sh
python3 -m http.server 8000 --directory dist
node --test tests/*.test.mjs
node --check dist/expedition-ui.mjs
node scripts/sample-v45.mjs
git diff -- docs/V45_ROSTER_SAMPLES.json
git diff --check
```

本次验证环境：Node v24.22.1、Python 3.12.14。浏览器访问localhost:8000，不建议直接file://打开ES模块。采样脚本需在仓库根目录运行，会重写对应样本文件。已有样本不应因无关文档改动而变化。

## 代码地图

| 路径 | 职责 |
|---|---|
| dist/index.html、expedition-ui.mjs、expedition.css | 当前主入口、交互与界面 |
| dist/expedition-data.mjs、content.mjs | 规则配置与内容 |
| dist/expedition-engine.mjs | 不依赖DOM的确定性模拟 |
| dist/expedition-guild*.mjs、personal*.mjs、roster*.mjs | 公会、主角、名册与角色状态 |
| dist/expedition-equipment*.mjs、growth.mjs、loot.mjs | 装备、成长与掉落（后两项同样有expedition-前缀） |
| dist/expedition-harbor*.mjs | 盐风港分支、职责、挑战与预留 |
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
