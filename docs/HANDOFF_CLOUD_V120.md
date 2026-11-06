# 云端接续 / v0.120 潮影墓廊

工作区 `/workspace/wod`，分支 `feature/v120-attack-immunity`，从干净v119 `92c84ac77f79caccea1bef3f5686c48935548530` 继续，修改前920测试通过。main仍v100 `357336294d0e5eb9191a8a21ba6c8d1147afe215`。本轮只本地提交，不推送、合并、部署；BrogueJS仅借用Playwright未改。

先读[V120核心机制/实玩/原版边界](V120_ATTACK_IMMUNITY.md)、[V120_CHECKS.json](V120_CHECKS.json)、[V120_PLAYCHECK.json](V120_PLAYCHECK.json)，再读PROJECT_STATUS/ROADMAP/DEVELOPMENT_POLICY。

## 代码接点

- `dist/expedition-immunity.mjs`：模板固有immuneTo的严格枚举/类型筛选/公开标签/排除与实际免疫证据/首个实际后备链接校验。
- `dist/expedition-engine.mjs`：只在有特性时增加快照字段，攻击选择前排除；全无候选免费后备，游标/once/round原样。原施放与援护支付后若实际目标免疫，不再防御/伤害/附着，不退费；法术免疫的潮蚀跳伤为0但旧效果按期结束。英雄配置不能自行赋免疫；运行显式party边界夹具不等于正式资产功能。
- `dist/expedition-ossuary.mjs`：原创两房固定敌情，全特性战前公开。data/adventure/camp/loot/UI接入25路线、24补给、无新装备；首通125/55、重复85/40，原房间20/10不变。
- position-priority/target-check/command-preview：共用合法类型候选。职责存在但免疫此类时明确说明；不误称职业/目标不存在。普通免疫列表不代表本条原目标范围。
- UI/阶段/个人/精华回放：公开免疫与抗性分开，单位快照可查；类型排除检查→首个真实后备→返回，报告更换清状态。实际免疫显示0伤害事实，不换算避免伤害/贡献；心理/法术明确不触发物理援护。

固有免疫不是效果，不可驱散；治疗/友方辅助/净化/召唤本身保持，孩子不继承主人特性。不新增玩家条件/技能/装备/训练费用/伤害公式/永久补给。配置与基础规则版本沿既有值，旧单位无空immuneTo字段。新的25路线/75普通目标常量同步到严格测试和浏览器，旧战斗/奖励断言不放宽。

## 内容与实玩

雾影门厅：前排双雾壳免疫近战/远程，后排刻纹哨弩免疫法术/心理。无识灯庭：前排骨卫免疫心理并援护左翼，侍药免疫远程且救前排，残灯影免疫物理，右翼弩卫免疫法术。先排除再沿既有合法路线，不新增近战阻挡规则。divide/voices两个可改起点保留种子/目标/撤退条件，不改真实资产或职责。

从v119正常1625金币、本人E/铜签目标完成继续：编号16 divide+clear，3/6回合六人生还、余7草4符4箭，首通125/55至1750，首证16。编号17 voices+survive，3/4回合六人生还、余6草4符4箭，E三次心理施放只选择实际侍药；重复85/40至1835，首证17。无新培养/装备/自动分配，仓库、寻物目标、伙伴/本人保留。不同种子/行动不做单项因果归因，也不与三房合流直接比较省料。

合法全物理/等待实验（A剑术、B/E/F射术、C/D等待）种子731在24回合未清首房，6人生还但87次普通空过，0奖励/无领取、不推进编号或公会。12固定新鲜输入（2起点×1/2/7/19/73/731）均六人生还，保留发现结果，不调高/调低敌人或挑种子；仅有限验证，不作全局平衡、候补可靠或单技能优越证明。

## 验证

最终939完整测试、19新专项通过。28套统一Chromium桌面/390px流程全部通过；其后只把心理/法术文案精确为“不触发物理援护”，19专项与本阶段完整桌面/390px再次通过，未改战斗结果/支付。470脚本语法，128模块/145引用无缺失。Firefox/Safari/真机未测。

旧24路线×种子1/731共48默认报告，加真正历史配置7/14/15三份，共51份原始完整报告与v119零排除全等。新正式16/17全报告及每阶段全部公会浏览器同API；实验失败、角色候选、精确后备/返回、方案命名绑定、整档恢复、首证、旧14次五人/0箭且不重领、无横溢贯通。援护后免疫与预存潮蚀等边界由运行单测验证，未声称正常关卡浏览器发生。

初轮生成器把射术给C/D被旧职业验证器拒绝，改用合法等待，未放宽验证。初轮19专项中17通过：末蓝83漏算旧自然+1，改为核对施放5/回复1/援护2和末84；增援重试测试误用repeat等待，保留生产游标，补cycle可回查/repeat不回查。初轮939中3个目录常量仍24/72，严格更新25/75。首轮新浏览器只在最后攻略文案名称断言失败，改为目标ID精确核对正式16/17收据，不改报告/状态断言。失败/初始发现日志保留，不改种子、费用、伤害、HP或职业白名单过测。

```sh
node --test tests/*.test.mjs
node scripts/verify-release.mjs
WOD_EVIDENCE_DIR=/tmp/wod-v120 node scripts/check-v120.mjs
WOD_EVIDENCE_DIR=/tmp/wod-v120 WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright node scripts/browser-v120.cjs
WOD_EVIDENCE_DIR=/tmp/wod-all-browser WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright node scripts/run-browser-acceptance.mjs
node scripts/check-v120-legacy.mjs /tmp/wod-v119-reference /tmp/v120-legacy.json /tmp/wod-v120/ossuary-start.json
```

参考工作树 `/tmp/wod-v119-reference` 已建，不重复克隆。端口127.0.0.1:8002是本地静态预览，不是部署。normal fixtures只作复现，不是给玩家自动发奖。

## 保存和后续

证据 `/workspace/wod-evidence/v120`：baseline/原版边界/初始发现、初轮及最终测试、51份哈希、正常每阶段公会/配置/报告、合法失败实验、28套浏览器与最终本阶段截图、语法/入口/VALIDATION。

恢复目录 `/workspace/wod-delivery/v0.120-local-attack-immunity`：源码ZIP、bundle（当前/v119/main）、v119→v120和v100→v120完整索引二进制补丁、无截图验证ZIP、manifest/SHA256SUMS/restore-check。提交/树以git log和manifest为准；离线克隆核对提交/树/入口，两补丁精确还原同树，再核对全部校验和。

原版仅公开历史索引支持类型免疫方向；新尝试官方Fertigkeiten正文502，未重试；DungeonGuide此前502本轮未重读，FAQ只用索引。四粗类型/选择与原近战路线/援护/周期/召唤时机/所有敌人参数和奖励均项目原创或暂定，不冒充现服完整规则。

无新增硬阻塞或重大产品决策。继续可切换本人/托管伙伴/小名册、普通技能自由培养和独立后期进阶；不实施固定主角、普通技能互斥、账号/多人后端。补给持久化已由父线程征询用户，回复前不实施永久物资/买料/扣押/退款/补货任务，也不将此当整体停工理由。下一步按实际角色分工与跨路线成长瓶颈选有用工作，避免重复堆同类免疫关卡/变体/设置；后续无新的推送、合并或部署授权。
