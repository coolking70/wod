# 素材台账

## abbey.png
- 类型：原创环境背景；本轮通过内置 imagegen 生成。
- 接入：`dist/assets/abbey.png`；战斗背景及临时事件头图。
- 已检查：无人物、无文字/UI，地面留有角色区域，风格与当前界面相容。
- 限制：目前没有拆层，没有独立事件 CG，三个房间复用背景，不应当作三个独立场景交付。
- 角色/技能标记与棋子：本项目 CSS/SVG 实现，临时可读性资产，非 AI 角色动画。

生成提示词：

Use case: stylized-concept. Create a wide 1536x1024 game environment background for an original dark fantasy tactical RPG called Sunken Abbey. Painterly sophisticated illustrated game art, muted deep blue teal and weathered ivory stone, tiny warm amber candles. Interior of a vast flooded gothic abbey at night, broken arches and a luminous round rose window in distant upper center, ruined altar center back, hanging vines and shallow reflective water. Camera looking horizontally into the hall, slightly elevated. Lower 50 percent is an open, simple flooded stone battle floor with readable flat space for game characters to be overlaid on left and right. Strong atmospheric depth, elegant detailed architecture toward upper half, not photoreal. No characters, no creatures, no writing, no logos, no UI. Landscape composition. This is a project game asset.

## v0.133 携盾守卫程序关节样板

- 源码：`dist/expedition-guardian-motion.mjs`、`dist/guardian-motion.css`；原创程序SVG与关节姿态，无新AI图片请求或外部资产依赖。
- 同一角色模型9嵌套关节、11姿态，用真实事件序列驱动出手、挡架、接招/未及、受击、倒下；实际剑盾/重盾区别，无剑时不画剑刃。原位动作不代表实际移动。
- 只适用于目前携盾守卫，其他职业/武器保留原画像；原13张PNG全部字节保持。不是完整角色美术统一、蒙皮骨骼或3D/视频。
- 固定锚点viewBox120×132、整体脚底60/116，躯干60/74，头60/41，双臂74/47及45/47，前臂76/65及42/65，双腿55/79及67/79。
- 时长900ms/既有播放倍速，短于原1300ms步距；暂停/换页/减少动态效果收束原记录末姿态，无战斗写入。真实53倒下与38未及截图保留，见[V133](V133_GUARDIAN_MOTION.md)。
