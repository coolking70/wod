# 云端接续 v0.168

工作区/workspace/wod，分支feature/v168-retry-preparation；基线和main为v167/4f213a4fd66810c828336184f93da8ef04567733。本轮只推送阶段分支，main完整集成窗口170–172；提交、远端及恢复结果见/workspace/wod-delivery/v0.168-retry-preparation/manifest.json。

[实现/复现](V168_RETRY_PREPARATION.md)、[验收](V168_CHECKS.json)。失败报告载入及逐房改配现在只替换当前准备，保留A并可撤销；两种明确保存A按钮在存储成功后才更新内存，失败明确报错，原A不变。准备状态不再显示过时v141。107的A断言是有意契约变更，改为更严格的原A前后保持，原脚本保留。

规范档EV168/browser-final/retry-final-campaign.json和retry-final-four-raw-keys.json：12815金币/next118，E5400XP/原训练和长琴、贝芮尔2285XP/招架1；当前C/A、三方案、五收藏793208、职责、任务与原首证保持。116六人生还/117贝芮尔与伊芙倒下，分别正常135/55及重复邮铃。新界面不影响战斗参数，不能把六人/四人差别归因于A保护。旧115仍可完整重演、不可再领；112/113及其他原始失败证据保持。

源码首选158完整bundle＋159至168全部增量，备用152完整bundle＋153至168；离线main先快进到已验证167，再切168。单一主验收ZIP含全部原始预验收与正式GUI checkpoint，三根完整实恢复后才回收本轮CP/raw重复副本。不要仅用最新增量当完整源码，也不要把Git推送当仓库外证据备份。

保留/workspace/wod-maintenance/2026-11-07-sustainable-evidence-v156整目录（六独立ZIP/74清单，不在156主ZIP内）、六旧引用和所有旧源码/证据链；不GC/prune。167已证明回收的151–154旧代码参考副本，需要时按167交付restore-runtime-cache.py及元数据计划从保留的提交重建，不当作证据遗失。

下一步仍优先实玩后可复现的体验缺口，不为版本号叠机制或按少量样本调数值。main合并前查新远端并跑届时全套浏览器、全Node、数据及双链恢复；继续预算主盘和完整实恢复空间。补给经济等待用户决定，不部署。
