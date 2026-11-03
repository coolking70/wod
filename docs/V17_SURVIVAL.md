# v0.17 守灯归途

新增独立三房生存路线：狙灯栈桥、碎灯礼堂、最后一盏灯。36份战前共享补给预算，预设12/12/12。不采用断潮5回合限时，沿用模拟器24回合保护上限；无回廊救援/沉钟事件。伤亡与资源跨房保留，不复活。

本版为原创遭遇内容更新；未改战斗结算与随机流程。配置结构与引擎ruleset仍0.14.0，样本另外标记contentVersion 0.17.0。旧样本使用原路线不受影响，不宣称复刻WoD数值。

## 战术压力

首房两名弩手优先后排；第二房两名祭司群攻中央；第三房混合后排狙击与中央群攻。强度来自公开的技能等级和属性，未增加隐性伤害倍率。敌情页新增普通技能等级与出发检定均值；实际战报仍以当时状态为准。中央无人时会按已有规则寻找其他非空阵位，不会因空阵位跳过攻击。

四个试玩起点共用装备、补给和输出指令：

- 原始队形：沿用封库基础队形与训练，不启用事件。
- 分房间保护：首房屏障转后排、吟游者开启远程躲避；后两房潮术师左翼、药师右翼、屏障中央。
- 强化救护：仅修改药师，治疗专修、训练全部6点用于治疗+3、治疗阈值80%。替代原药膳/心智抵抗训练，因此不是单变量提高治疗量。
- 保护＋救护：合并两组调整。

载入时原始队形设为A，默认种子1；B可继续编辑。所有改动可在A/B差异表核对，普通配置可撤销。组合方案存在多变量，不能将胜负归因于单个参数。

## 固定种子1–32

|方案|通关|通关且六人生还|平均实际治疗（含失败）|
|---|---|---|---|
|原始队形|17/32|0/32|418|
|分房间保护|31/32|20/32|352|
|强化救护|11/32|0/32|416|
|保护＋救护|31/32|25/32|407|

此次“完成”与“全员归航”有了区分度。治疗总量不等于保护效果；高治疗阈值消耗行动和药草，训练重分配也失去原防御训练。32种子仅是固定测试集，未完成全面平衡，也不是总体成功率。

运行node scripts/sample-v17.mjs可重建dist/samples-v17.json，含每次减员角色、房间、回合及事件ID。无需再添加一张实验表：本轮优先让玩家直接载入四种方案并看战报。

## 表现与验证

新AI环境图用于路线准备卡和三房战场，共享一张场景示意，并非每房独立插画。战场显示当前房间威胁提示。结算显示实际治疗及倒下记录；点击倒下记录定位所属攻击，可查看其防御与伤害链。静态图不决定模拟结果，不调用在线生图。

120项测试通过：预算、独立遭遇、旧路线回归、通关减员与保护后六人生还、覆盖范围、真实敌人目标与等级、场景无模拟副作用、128样本汇总与首种子复现。浏览器种子1：A为5人通关、HP213，B协作为6人通关、HP557；治疗393/387，救护行动6/9。减员跳转定位露弥第三房第三回合；A/B显示13项实际配置差异。截图V17_LANTERN.jpg。

## 后续

下一步优先完善战报中的受击—防御—救护时序阅读，以及敌人身份的视觉区分。若扩展路线，应继续以阵位、目标、行动顺序和持续资源为核心，避免仅提高敌人属性。

## 图像资产

使用内置imagegen生成。资产：dist/assets/last-lantern-v17.png。最终提示词：

```text
Use case: stylized-concept
Asset type: wide landscape background for a dark fantasy tactical RPG.
Primary request: The Last Lantern, an abandoned gothic abbey chapel on a sea-facing stone bridge, a single warm golden lantern still burning on a weathered altar. Empty tactical battlefield, no characters, no monsters.
Style: detailed painterly environment, cinematic depth, teal shadows and muted gold light, coherent dark drowned-abbey atmosphere.
Composition: distant altar and lantern near upper center, wide nave flanked by broken columns, quiet dark stone floor in lower two-thirds to support readable game unit overlays. Landscape 1536x1024.
Constraints: no text, no UI, no symbols resembling letters, no watermark; environment illustration only, no bodies.
```
