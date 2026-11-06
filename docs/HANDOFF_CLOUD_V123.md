# 云端接续 / v0.123 关键战报收藏

工作区`/workspace/wod`，分支`feature/v123-report-archive`。修改前干净v122为`29f171e624f8505cb9a9cb0e75c69582e87e4f94`，基线977测试通过；main本地仍v100 `357336294d0e5eb9191a8a21ba6c8d1147afe215`。本阶段只本地提交，不推送、合并或部署；预置BrogueJS只读借用Playwright。

先读[V123说明](V123_REPORT_ARCHIVE.md)、[核验](V123_CHECKS.json)、[实玩](V123_PLAYCHECK.json)，再读PROJECT_STATUS/ROADMAP/DEVELOPMENT_POLICY。保持可切换个人英雄＋托管伙伴、小规模招募、自由普通培养＋独立后期进阶。永久补给未决不影响独立工作。

## 接点

- `dist/expedition-report-archive.mjs`：无guild依赖的有界原生gzip/UTF8/SHA、精确元数据/快照验证、完整事件读取。与guild层分开避免循环初始化。
- `expedition-report-archive-guild.mjs`：正式/历史源匹配，冻结、改名、移除、内层验证、异步后的原始存储CAS；既有资产不变。
- `expedition-report-archive-view.mjs`：专用转义只读阅读器、履历收藏库、正常战报页显式冻结控件。**不要把收藏送入通用战报渲染器或伪装成pending来源。**
- guild validate只增加可选reportArchives；campaign/单公会导入异步校验内层，单公会文件上限8MB。保存/读取及准备载入均保留多页面防覆盖；整档仍原四键事务。
- `scripts/report-archive-cases.mjs`、`check-v123.mjs`、`check-v123-legacy.mjs`、`browser-v123.cjs`、`tests/report-archive.test.mjs`。统一浏览器增加v123，不改旧关卡/目录断言。

## 状态与限制

真实2150/next21继续，历史1/2先冻结；正常21机廊留余6人3/4回合、10/6/8补给，90/40至2240。用旧2战术配当前真实资产，正常22邮路0人生还、4/6/12回合、0/4/3补给，仅40/20至2280。第三房失败与旧2的4/4/13回合分别完整保留，未换种子/调数值。

最终next23、履历22..3，收藏22/21/2/1（四份参考743652/800000编码字符）。旧3..20精确保持；本人E、所有职责、装备/仓库、训练/进阶、寻物目标不变，两次普通XP各+60。当前E真实triagepin与旧2方案clockpin差异保留，正式出发仍当前资产。旧1/2源是收藏时历史重演，不是追回当年原始日志。

最多6槽且总容量可能先满；流式解压最大12MB及声明值，不支持当前压缩API时明确报错。无单独快照导入/奖励。当前存档结构/规则允许现有合法报告，未承诺未来规则迁移兼容。Firefox/Safari/实体设备未测。

## 验证与恢复

最终999完整测试、22专项、31套统一Chromium全部通过；493脚本语法、136运行模块/153引用通过。准确证据见V123_CHECKS，原始目录`/workspace/wod-evidence/v123`。基线/首轮结果保留，最终新增单公会导入内层测试；浏览器压缩字节差异只在独立解码/SHA/全部报告相等后归一化，不能拿此理由忽略其他字段。59份v122旧完整报告零字段排除一致。

恢复目录`/workspace/wod-delivery/v0.123-local-report-archive`，含源码ZIP、bundle、v122和v100全索引补丁、验证ZIP、manifest/校验单；打包后离线克隆及两补丁同树验证。无外部文件上传、原生Library ID或远端新提交。

下一步优先正常单人探索、队伍成长和实际目标循环，不继续堆档案设置。无本阶段新增阻塞，补给决策继续交由父线程等待用户；不得自行永久补给、推送、合并或部署。
