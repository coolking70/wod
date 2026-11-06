# 云端交接 v0.138

先读[V138操作与验收](V138_KEYBOARD_REPLAY.md)、[空间/Git约定](CLOUD_STORAGE_AND_GIT_POLICY.md)、[验证收据](V138_CHECKS.json)。仓库`/workspace/wod`，工作分支`feature/v138-keyboard-replay`，基线及main为`b4aa91b6295ba4fc845fb995700861c55b68cb07`；新阶段提交、推送核验及完整恢复清单见交付manifest/远端验证收据。

用户已授权后续完成阶段推送、周期评估main与冗余分支。v137已推送并快进main；清264份已由远端覆盖的重复代码归档，主盘实测增加约6.02GiB。删91本地/6远端已合并旧功能分支，保留名称/SHA清单、main、当前分支与v137里程碑。所有验证ZIP、18330受保护证据文件及未知资料保持；不运行GC/prune。六个旧reflog提交有refs/retained与137156字节增量bundle，组合保留的v137完整bundle离线恢复通过。维护证据根`/workspace/wod-maintenance/2026-11-06-retention`。

不要把旧交付manifest/SHA256SUMS当作当前现存清单；对应目录RETENTION_2026-11-06.json列出已删代码文件及远端恢复方式。旧v136等源码ZIP已按授权清理，可从Git对象/远端指定SHA重建，不需再假定其路径存在。完整v137恢复套件仍保持。

环境重启会重置/tmp。本次旧临时原件已不在，主盘v137验证ZIP校验956文件/79图像全部通过，45份检查点保持，证据可恢复。新大验收放独立临时盘，每组主盘完整检查点，最终合并全部文字/JSON/图像；不以临时盘为唯一备份。开始下阶段先看双盘预算，不反复生成每版50MB源码ZIP+完整Git bundle。

v138只增加回放控制栏焦点、键盘说明/轮廓与局部keydown；不改变引擎、内容、数值或存档。←→步进、空格播放、Home/End当前筛选首末，沿既有stepBy/move；子控件/组合/IME/隐藏区不接管，长按空格不反复切换。四个整档原始键和61/55全报告全等，最终仍6665/next62，未产生新远征/资源消耗/奖励。

复验：`node --test tests/*.test.mjs`；`node scripts/verify-release.mjs`。独立浏览器先`WOD_EVIDENCE_DIR=/tmp/wod-v138-new node scripts/check-v137.mjs`生成相同历史档，再`WOD_PLAYWRIGHT_MODULE=/workspace/BrogueJS/node_modules/playwright WOD_BASE_URL=http://127.0.0.1:8002 WOD_EVIDENCE_DIR=/tmp/wod-v138-new node scripts/browser-v138.cjs`。统一46组按run-browser-acceptance.mjs，设置新的临时输出及WOD_RECEIPT_DIR主盘目录，避免覆盖既有检查点。dist直接运行，无打包安装，BrogueJS依赖只读。

下一main检查窗口v140–142或连贯功能里程碑；有失败、冲突、远端新工作或重要玩法决策时不合并。后续回实际单人核心循环，避免持续堆回放快捷键/分析设置。个人英雄可切换、托管伙伴、小名册、自由普通技能及独立后期进阶方向保持。补给经济/参考服仍待决定，不公开部署。

最终核验：1251/1251完整测试、46/46统一Chromium首轮通过；590份JS+1份Python语法与156模块/174引用通过，184未涉及界面的运行文件精确保持。46份完整检查点独立复核914文件/76图像，原件未删除。
