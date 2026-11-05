# 云端接续：v0.109

/workspace/wod；feature/v109-position-priority；基线v108 1ba775a8ff350ce315905ca6388a349cca98d382。最终提交见git rev-parse HEAD和恢复包manifest。main仍357336294d0e5eb9191a8a21ba6c8d1147afe215，未推送/合并/部署或改BrogueJS。

新增可选attackOrder五阵位排列；普通远程/法术/心理攻击（single/position）仅显式target:'priority'时使用。近战/原显式阵位/职责目标不改。PLAN_FIELDS支持逐房attackOrder，进入下一房无覆盖恢复默认，默认缺失不向旧party对象添加undefined字段。候选先做存活/阵营/破印合法过滤，第一组封顶技能人数；minTargets不足免费后备，不跨位凑数、不预抽RNG。cast和适用skip有positionPriority事实，实际援护仍可接招。详情V109_POSITION_PRIORITY.md。

保存、个人历史战术复用（缺旧字段会清除）、差异、出征卡、方案册/绑定及整档均贯通。托管指令如不选priority，排序保持不生效，未自动切职责/改资产。没有新增技能/装备/公式/费用/奖励，21路线39装备保持。永久补给仍未实施。

793完整测试，42份v108完整原始报告零排除相同；固定36输入全部全员通关仅作有限证据，不称普适升级。桌面/390px真实编辑/逐房继承/核对，正常seed1/2两份完整API战报及120/260金币公会相同。17浏览器、403语法、114入口模块/131引用。云证据/workspace/wod-evidence/v109；直接跑dist，无构建或安装。

原版证据边界：官方历史配置索引支持方向，但本轮相关正文403/502，未重试/绕过；不能说成功核阅全文或现服规则。本项目五阵位、显式选用/逐房覆盖为暂定改编。勿照搬索引中的六位置/攻击表。继续单人可玩性、角色分工和战报因果，保留本人可切换/托管、小名册、自由普通技能与独立进阶，不重复问已暂缓身份/多人。新持久经济/发布范围才需重大选择。本轮暂无环境硬阻塞，后续仍仅本地提交和恢复。

验证node --test tests/*.test.mjs；node scripts/verify-release.mjs；本机8002/已有Playwright跑scripts/run-browser-acceptance.mjs。
