# 云端接续：v0.114

/workspace/wod，feature/v114-offbeat-control；基线v113 c6451fd43ea63522263334874e1b6348cf339515。最终提交与源码树见HEAD及恢复包manifest。main仍357336294d0e5eb9191a8a21ba6c8d1147afe215。未推送/合并/部署或修改预置BrogueJS。

先读V114_OFFBEAT_CONTROL、V114_PLAYCHECK、V114_CHECKS。吟游者可选普通技能迟拍弦：需乐器、7法力/无材料/心理低伤，只选当前有额外行动且无迟拍者；命中存活后下一回合减至多1次额外普通行动，保留基础和当前队列，可净化等待/激活、不叠加刷新、来源倒下仍保留、下回合末到期。增益先结束时减少0照实记录。offbeat模块计算与证据复用；引擎只在实际限制时添加actionLimits，未选技能的既有事件保持。默认不选新技能/职责，不改普通自由培养与独立进阶、配置版本或经济。

852完整测试/14新专项通过。旧22路线×seed1/731共44份，严格核对唯一新增party.e.skills.offbeat=6后全报告深比较相同，不能称原始零差异。命令：node scripts/check-v114-legacy.mjs /tmp/wod-v113-reference /workspace/wod-evidence/v114/legacy-final.json。当前参考worktree已存在，不重复克隆。

正常seed1钟楼6人生还、队列2→1及另一迟拍1→1；185金币、正常分怀表E/付20XP培养。seed2邮路前两回合迟拍、末房失败，仅40/20；仅一次预定seed3复战仍末房失败，再40/20，余额265，无邮路首通/遗物。浏览器完整3份报告与3个公会同API，桌面/390px真实编辑/命名绑定/整档恢复/旧报告不重复领奖。36固定输入30胜6败，邮路各模式2/4，哨垒无额外行动时减0；保留所有反例，不以局部队列差推算胜负/避免伤害。统一浏览器22套、431语法、119入口模块/136引用结果见CHECKS。

参考：成功读官方公开Lied der unerträglichen Pein技能页，行动减益/延迟组件有证据；费用/目标/保护基础/期限/职业等具体设计原创暂定，未核验登录服现行规则。reference.json存源边界。不得重试旧403/502正文或绕过权限。

重跑：WOD_EVIDENCE_DIR=<目录> node scripts/check-v114.mjs，生成3次正常案例JSON供scripts/browser-v114.cjs；后者需WOD_PLAYWRIGHT_MODULE及loopback HTTP。统一node scripts/run-browser-acceptance.mjs含22套，可耗时数分钟，先查已有进程/输出不要重复启动。dist直接提供源码，无打包构建/安装需求。

本地恢复包：/workspace/wod-delivery/v0.114-local-offbeat-control。含完整源码ZIP、离线bundle、v113和main v100两份完整索引二进制补丁、无截图验证ZIP、manifest/校验和/离线恢复核对。提交后生成，SHA以实际manifest为准，未上传文件服务。

无新增硬阻塞。继续可切换个人英雄、托管伙伴、小规模招募名册、普通技能自由培养与独立后期进阶。永久补给仍暂缓；优先选择新的单人内容或真实进阶瓶颈，不反复叠加局部设置，也不将迟拍强制给所有路线。不推送、合并或部署，重大方向/真实阻塞才报告。
