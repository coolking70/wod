# 云端接续 / v0.128 装备技能等级

工作区`/workspace/wod`，分支`feature/v128-equipment-skill-ranks`。基线干净v127 `c6fc7b5be5201cbc2cdf4921463b20f6216154de`、1066完整通过。main仍v100 `357336294d0e5eb9191a8a21ba6c8d1147afe215`；只本地提交，不推送/合并/部署。BrogueJS只读借用Playwright。

先读[V128规则实玩](V128_EQUIPMENT_SKILL_RANKS.md)、[检查](V128_CHECKS.json)、[实玩](V128_PLAYCHECK.json)，按DEVELOPMENT_POLICY/ROADMAP接续。保持可切换个人英雄＋托管、小名册、自由普通技能及独立进阶；补给和推送仍待答复，不阻塞独立本地开发。

## 核心接点

- equipment.mjs：两件商店装备wardfolio/medicbadge、可选ranks汇总和equipmentRank。旧无等级装备保持旧total形状，ranks不是用户可编辑字段，按固定当前穿戴ID读取。
- engine.skillLevel/skillBreakdown只对已有技能叠加一次；原unit.skills仍为基础/专修/永久培养。defenseProfile按本次实际技能叠装备，自然防御0；可选equipment来源字段仅等级装备出现。旧61完整报告零排除同基线。
- equipment-ranks-view：静态来源、职业未掌握不生效说明；装备/差值、编辑、实际成长/出征、历史单位检查器贯通。施法levelSources和防御保存equipment，当次记录不读当前公会。培养试演改用effective skillLevel，13→12。
- 脚本equipment-rank-cases/check-v128/legacy/browser-v128、tests/equipment-skill-ranks。start由v127真实固定输入及三次原正常路径重建，逐字段同原mana-final，保留四冻结payload；未以新版重造旧收藏。

## 最终状态

4280/next40起步，D札册/F药签各60至4160，D保存札册配装。40邮路六人、0草0符2箭，135/55至4295；41灯桥六人5草0符6箭，120/55至4415；明确退D屏障1返20，再42邮路四人（A/D倒下）0草4符1箭，普通135/55至4550、全员目标失败。之后D换回已拥有focus。

D原屏障10→札册13，退款后12，换下9；断流7→8→换下7。F救护永久3+装备2总14，群救7，HP106/MP68；D札册HP102/MP69，原法器MP72。装备等级不计永久3上限/经验投入，不能退装备3的XP或解锁职业外/未学课程。D退款后无可退屏障培养，即使装备仍3；其他培养与进阶不变。

最终next43/履历42..23，旧23..39保持；净金币+270（普通390减买装120）、普通XP每人165，D另返旧20但累计只增165。本人E/托管职责/任务三路签/寻物/四收藏/其他装备与所有权不变；E仍两件套。D札册拥有且保存但当前focus，F新药签。仓库只加普通铜铃2/号琴1；邮路全员旧首证39仍保留，无新装备完成奖。

## 验证与恢复

最终1083完整/17专项，统一浏览器和语法/入口计数见V128_CHECKS。原始`/workspace/wod-evidence/v128`，恢复包`/workspace/wod-delivery/v0.128-local-equipment-skill-ranks`含源码/bundle、v127和v100全索引补丁、验证ZIP/校验单，离线恢复同树/入口。更新HANDOFF.md时必须保留历史全文，仅改当前版本/入口。

专项首轮对正常40的法术防御假设错，保留D实际自然防御0并新增独立法术遭遇，最后17过；无数值调参。原版本轮成功读官方Medikus物品正文，仅借穿戴提升技能等级的结构，具体装备/数值/3槽/费用/上限均项目暂定。Firefox/Safari/实体设备未测。无新增重大决策/阻塞；继续实际探索与队伍分工，避免只复制等级装备。

统一回归初轮35/36通过，v124跨页测试先读取到731而点击时才收到另一页888，公会所有字段一致。测试显式等待接收页种子状态后仅重跑v124通过，严格原始双字段比较保留；其余35套结果未重跑或替换，初轮和重跑收据均保留。生产代码未因此改动。

最终核验：1083/1083完整、17/17专项、36/36统一Chromium套件、527脚本语法、145模块/162引用全部通过；61份旧完整报告零字段排除同基线。最终资产与历史交接保留独立核对见state-preservation.json。
