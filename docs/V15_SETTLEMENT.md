# v0.15 归航账本

本版只增加战报投影与表现，不改变战斗、随机流、配置格式或历史样本。规则版本仍为0.14.0。

## 完成目标

出发前公开三个目标：完成全部三房；完成且六人生还；完成且符纸、箭矢各剩至少2份。后两项是本次表现指标，没有成长奖励、跨远征库存或后端存档。失败时不能用剩余库存获得完成目标。

结算面板默认折叠，明确提示包含尚未播放的结果。共享补给账本从相邻事件库存快照计算增减，满足出发＋获得−消耗＝剩余；每笔变动可跳转对应战报。MP、随身道具和敌方库存不混入账本。当前事件不存在同种资源同时收入和支出的抵消；未来若引入此类事件，需要记录毛收入/毛支出，不能仅依赖净快照。

## 潮位和插画

仅断潮路线显示潮位。进场为0；正在执行第N回合时已结算N−1回合，回合结束及房间结算显示N。当前事件为封路失败才展示封路状态和CG，不把最终失败泄露到早期回放。成功在限时边界清场仍显示本房肃清。

AI插画为预生成静态资产，不是运行时AI生成场景。无人场景避免将撤退误画成死亡，界面显示实际存活人数。内置imagegen生成，文件：dist/assets/flood-gate-v15.png。

### 最终生成提示词

```text
Use case: stylized-concept
Asset type: wide cinematic event illustration for a dark fantasy tactical RPG, 1536x1024 landscape.
Primary request: tidal flooding seals passage through a ruined submerged abbey; the expedition must withdraw.
Scene: empty ancient Gothic stone corridor, massive closed arched iron gate, seawater surging through its bars and over worn stairs, distant cold mist, small amber votive lights reflected in water.
Style: premium painterly dark fantasy game environment, detailed textured stone, atmospheric depth, restrained teal and antique gold palette. Composition: gate centered in upper two thirds, darker quiet foreground suited to a separate UI caption overlay.
Constraints: environment only, no people, no bodies or injury, no monsters, no writing, no letters, no UI, no watermark. Flooded passage indicates blocked travel, not character death.
```

## 验证

110项测试通过。新增覆盖共享收支守恒、救援奖励与费用、失败目标、储备阈值、早期潮位不泄露结局、限时边界成功和普通路线无潮位。

浏览器验证：种子3、拾取＋解读，第二房4/4封路，六人生还，全部目标未达成；药草8＋2−2＝8、符纸8−8＝0、箭矢8−7＝1。账本药草＋2可追溯拾取事件，潮位回到0/4。改赶路后3房完成，前两目标达成、储备目标未达成。已检查封路图加载及实际页面截图V15_FLOOD.jpg。

## 下一步

让目标成为可比较的战术取舍：对照相同种子的不同携带分配与节省材料指令，统计完成、全员归航、储备目标的联合达成率。先验证储备目标的可达性和区分度，再决定是否引入跨远征成长。当前不宣称目标阈值已经平衡。
