# 云端接续 / v0.126 灯桥守望套装

工作区`/workspace/wod`，分支`feature/v126-item-set-bonuses`，基线干净v125 `9b7c1f73f933708da028bd43b31af54333d8f571`，修改前1032测试通过。main仍v100 `357336294d0e5eb9191a8a21ba6c8d1147afe215`。只本地提交，不推送/合并/部署；用户正在考虑备份推送，未收到授权。BrogueJS只读借用Playwright。

先读[V126规则/实玩/边界](V126_ITEM_SET_BONUSES.md)、[核验](V126_CHECKS.json)、[实玩](V126_PLAYCHECK.json)，再按PROJECT_STATUS/ROADMAP/DEVELOPMENT_POLICY接续。保持可切换个人英雄＋托管伙伴、小规模名册、自由普通技能及独立进阶。永久补给继续等用户，不阻塞独立内容。

## 接点

- `dist/expedition-item-sets.mjs`：无data/guild依赖的部件/档位定义与纯计数/聚合，输出嵌套副本。2件法抗10，3件另加INT2/远抗10/心抗-10，两个档各一次。
- equipmentTotals唯一汇入套装静态值；库存/仓库/别的英雄/保存配装不参与。属性分解另列套装，HP/MP/原检定不重复算，静态效果不能破印。没有持久化激活奖励或新货币。
- `expedition-item-sets-view.mjs`：装备收藏、配装预览、实验编辑/实际出征与当次战报检查器。**回放必须用report.config，不用当前guild gear。**
- `expedition-beaconbridge.mjs`及data/adventure/loot/camp：3房30预算、三起点，三部件普通掉落首固定号琴、重复不保缺件。27路线43装备81目标。
- `scripts/item-set-cases.mjs`、`check-v126.mjs`、`check-v126-legacy.mjs`、`browser-v126.cjs`、`tests/item-set-bonuses.test.mjs`。旧测试仅精确目录总量27/43/81和营地4/27更新，战斗/奖励不放宽。

## 真实状态

从v125的3005/next30/E/全部属性培养继续。普通30首180/80得号琴给E，31重复120/55得巡衣后2件；32重复号琴留仓。33急拍得路签给E后3件，34/35均耗尽药草，32/35留余失败。六次后3785，主动保存两件/三件配装并回两件保留定心缎带，正常36仍六人生还、4草0符6箭，120/55至3905。七次全员只有限成熟队伍证据，不单独归因套装或方案，不调数值/种子求通过。

最终next37、履历36..17，旧17..29保持；E号琴/巡衣/缎带，个人三部件均拥有，两配装保存。仓库新重复号琴3、路签1，巡衣0。净金币+900、普通XP每人+410，无额外套装奖励，全部训练/本人/职责/归信witness三路签/四份收藏不变。寻物明确改为E路签且已拥有。clear首证30、survive31、reserve仍无。

两件实际E：HP106/MP57、心理20/法术0；三件HP102/MP59、心理-10/法术10/远程10。三件不是统一升级。属性中的装备INT-1与套装INT+2必须分别展示；设备部件数在合法槽位按同一人算，不跨人、不按重复库存或保存配装算。

## 验证、恢复及后续

最终计数见V126_CHECKS，原始`/workspace/wod-evidence/v126`，工作快照`/workspace/wod-recovery/v126-before-finalization`，恢复包`/workspace/wod-delivery/v0.126-local-item-set-bonuses`。含源码ZIP/bundle、v125与v100全索引补丁、验证ZIP/manifest/校验单，离线恢复及两补丁同树/入口核验。无外部上传或Library ID。

专项17项覆盖三槽/任意两件/各档一次、跨人/库存/配装/非法重复不计、独立副本、属性资源/抗性/上限/差值、不受破印、正常资产/pending/旧历史/冻结快照与备份。原始首轮模块导入失败、旧4/26分母、预设后隐藏概览导航超时保留；分别更正导入源、严格27分母、显式概览导航，未改变敌人/奖励或放宽数值断言。authored-before-discovery及authored-values-check证明初始部件/套装/敌人/奖励/起点未调参。

原版Sets官方索引支持按同人件数计一次，正文502不重试；内容和数值原创暂定，非现服物品/门槛复刻。Firefox/Safari/实体设备未测。下一步继续实际探索/职业配合，不只堆套装变体。补给和推送备份仍待答复，不擅自推送、合并或部署。

最终核验：1049/1049完整、17/17专项、34/34统一Chromium浏览器套件、515脚本语法、143模块/160引用全部通过；59份旧完整报告零字段排除同基线。原始首轮错误及修复记录保留，最终状态独立核对见state-preservation.json。
