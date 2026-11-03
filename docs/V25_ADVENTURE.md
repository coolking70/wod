# v0.25 冒险地图与沉钟之下

本轮将计划的流程、构筑、章节、表现四部分做成首个可玩版本，长期成长待产品选择。仍为原创 WoD 灵感规则，不是原版复刻。

## 实现
- 八路线冒险地图；首次出征为真实单场模拟，结算后可跳转协作依据、调整配置或返回地图。
- 六位队员各两个构筑起点，共12套；新增6件有属性取舍的装备。盾甲、弓具、法器类型同时用于战斗与机关检定。
- 应用构筑只改当前队员，清除其房间预备/普通指令/治疗覆盖；保留阵位、防御、道具策略，可撤销。
- 第一章六场连接封库与疗所，第三场进入第四场不恢复生命、法力、道具次数或补给。救援与沉钟事件改变封库第三场，不误称为整个章节末房。
- 章节结局展示通过数、存活与剩余资源；新增敌方召唤者、治疗者独立AI画像，沿用事件驱动场景与特殊插画，可关闭场景自动暂停。
- 测试方案收拢到战术实验，准备页保留冒险相关配置。
- 配置0.25.0，规则original-wod-inspired-0.25.0，兼容旧配置；不自动套用新构筑。

## 验证
158项自动测试全部通过。新增六项覆盖引导真实战斗、章节资源衔接、提前失败、构筑范围、装备家族与旧配置迁移。旧盾牌错误提示断言同步为盾甲类，新增测试验证轻盾甲实际盾击及防御。

96次固定种子试跑（每方案32次）：
|方案|通关|全员归还|平均总回合|救援成功|
|---|---:|---:|---:|---:|
|推荐|32|32|28.46875|4|
|救护|32|32|27.1875|24|
|召唤|32|32|32.4375|4|

此样本证明流程与取舍可见，不证明难度已平衡；三方案全部通关，后续需难度梯度与更大样本。
浏览器完成首次出征→协作事件，章节→守卫破阵构筑→6/6通关，末房敌方专属画像，返回地图，上次战报→按本次配置调整。截图见v25-map.jpg。

## 美术
使用内置imagegen生成并集成 dist/assets/enemy-supports-v25.png。两等宽肖像用于敌方召唤者与治疗者，按原图左右半幅CSS显示。没有在线实时生成、额外服务依赖或永久奖励。
提示词：

Use case: stylized-concept. Asset type: two equal-width side-by-side square portrait panels in a single wide image, for an original dark fantasy tactical RPG. LEFT panel: a drowned abbey tide summoner, male aged priest, crown of weathered oxidized bronze, severe narrow face, dark teal hood, cyan water magic reflected on cheeks, looking slightly right. RIGHT panel: enemy healing herbalist, mature woman, pale gray half-mask covering lower face, moss green hood, tiny herb bundles, amber green medicinal glow, looking slightly left. Both bust portraits centered separately, faces large, symmetrical panel framing, aligned eye level, no overlap across middle. Painterly realistic game character portrait, atmospheric teal and bronze colors, dark plain textured background, strong distinguishable silhouettes. No text, no UI, no logos, no border. Original characters, not existing franchise designs.

## 下一处决策
跨次远征保留什么：
A 固定公会长期养成（推荐）：角色、装备与成长保留，配置与通关奖励形成长期循环。
B 远征重建：局内成长重置，跨局只保留解锁。
C 维持战术沙盒：全部构筑自由配置，不接长期成长。

此选择决定存档实体、奖励发放、失败代价和装备获取。确认后再实现阶段五，避免先写互不兼容的经济模型。

