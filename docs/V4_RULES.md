# v0.4 实现、证据边界与验证

2026-10-31。本版自主实现；没有复制 dust1/wod_local 代码，不宣称原版数值复刻。

## 本版的可体验变化

- 独立近战、远程、法术防御：被攻击时选择对应技能、扣法力并投点；不占普通行动。装备或法力不满足时回退自然防御，记录原因。
- 多组件效果：疾潮合奏当前回合增加行动，下回合增加攻击技能等级；延迟护印当前回合提供护甲，下回合增加防御技能等级。组件分别激活、到期，等待期间不贡献数值。
- 默认方案与逐房间覆盖：站位、预备指令、普通指令、治疗、防御按组继承；队伍预备顺序也可覆盖。删除覆盖恢复继承，装备训练补给仍为全局。
- 战报按一次施放分组：保留每名目标独立防御与伤害、资源支出、效果；诊断模式保留底层事件。分组不会丢失原始记录。
- 战斗样片：守卫、射手、潮术师及敌人使用 AI 立绘；位移、受击、治疗与多目标弹道来自真实结算事件。三名辅助仍为符号占位，敌人共享样片立绘。未实现在线事件 CG 或完整骨骼动画。

## 规则来源与原创部分

| 部分 | 来源/边界 |
| --- | --- |
| 检定均值为主属性×2+副属性+技能等级×2；自然防御等级0 | 官方 [Combat System](https://world-of-dungeons.net/ency/Combat_System) |
| 自然近战灵巧/敏捷、远程敏捷/感知、法术意志/智力 | 同上；删除旧版统一防御+10 |
| 盾牌防御灵巧/力量及装备前提 | 官方 [Use shield](https://www.world-of-dungeons.net/ency/Skill_-_Use_shield)；本原型以铁壁重甲代表携盾 |
| 防御配置、自然防御回退和独立治疗设置的结构 | 官方 [Hero Settings](https://world-of-dungeons.net/ency/Hero_-_Settings_-_Standard_View) |
| 防御费用1/2MP、基础6级、专修+3级 | 原创平衡参数，非原版数据 |
| 延迟、多组件、同名互斥及持续时间边界 | 当前引擎明确约定，尚未逐项核实原版 |
| 随机分布、重击/致命倍率、先攻衰减、护甲扣减、技能数值 | 沿用原创规则，不宣称复刻；详见 V3_RULES.md |

## 技术约定

事件 actionId 在整次远征中唯一，施放、防御、攻击、倒下等归于同一行动。UI 消费快照与分组事件，不另行计算胜负。延迟组件由全局回合时钟激活，持续时间从激活开始计；房间结束清理非远征效果，包括尚未激活的组件。自然防御不获得防御技能等级加成。

配置版本0.4.0。导入v0.3时保留已有战术并补齐自然防御、空覆盖。无效存储恢复默认方案，不继续使用半迁移状态。

## 验证

`node --test tests/v3.test.mjs tests/v4.test.mjs`：24项全部通过，含旧版20种子完整性检查。覆盖防御消耗、装备/法力回退、延迟与独立到期、跨房间清理、覆盖继承、分组无损、迁移及确定性。

浏览器验证：第二房间修改法术防御不改变默认方案，恢复继承成功；齐射将施放、两次防御和两次攻击收拢为一组，并产生两条弹道；三组预置实验可运行并打开战报。

种子731防御示例：自然防御方案剩余生命516、法力206；技能防御方案剩余生命611、法力158，其中防御消耗53法力。两者均通过三房间六人存活。说明资源取舍，不代表多种子平衡结论。相同种子不保证改变行动后各检定随机数仍一一对应。

## AI 立绘制作记录

文件：dist/assets/portraits-v4.png。使用 image_gen 生成一张四宫格图，CSS 按象限取用；没有使用第三方游戏原画。生成提示词如下：

> Use case: stylized-concept. Asset type: a single 2x2 portrait atlas for an original dark-fantasy tactical RPG set in a drowned abbey. Four equally sized square panels in an exact 2x2 grid with no gutters and no borders. Upper left: weathered male knight in silver plate armor with old gold trim, blue cloak, large shield visible, chest-up. Upper right: female ranger with tied auburn hair, olive hood and an elegant recurved bow visible, chest-up. Lower left: pale female tide sorceress with silver hair, midnight-blue robes and glowing turquoise crystal staff, chest-up. Lower right: sinister drowned undead abbey sentinel in corroded ceremonial armor, blue ghostlight eyes, chest-up. Painterly premium RPG character portraits, cohesive detailed brushwork, strong readable silhouettes and faces, dark teal atmospheric backgrounds, warm gold rim lights on heroes, cold light on enemy. All faces centered inside their own panel; no character or weapon crosses panel boundaries. No text, numbers, logo, UI or watermark. Square canvas, each panel exactly one quarter of image.

## 后续范围

先根据试玩反馈校正防御消耗与延迟收益，再扩充能迫使更换房间配置的遭遇。下一阶段考虑召唤物、物品实例次数，以及从已确定事件选取场景/CG的表现层；仍让确定性引擎负责结算。
