# 云端接续：v0.106

仓库/workspace/wod，分支feature/v106-clocktower-epilogue；基线v105 c4ce991cfb72374141b13c96ef6d74830c522a1b，最终提交见git rev-parse HEAD和恢复包manifest。main仍357336294d0e5eb9191a8a21ba6c8d1147afe215，未推送/合并/部署或改BrogueJS。

新故事潮刻余响复用钟楼通关、书库/温室/哨垒任选一路survive首证、钟楼reserve首证。只在正常领取后推进；已有成果直接计入。clocktowerStory:{ending}与两个旧故事独立，明确交付一次40金币/clockpin或counterlens或filterveil；不增经验/装备种类。实现和验证细节见V106_CLOCKTOWER_EPILOGUE.md。

771完整测试、42份v105原始完整战报无排除相同、桌面/390px五次正常出征及全部公会API相同。统一入口包含v76/v77及v94–99/v101–106，共14套；388脚本语法、111入口模块/128引用通过。最初夹具及导航失败保留，最终结果另存/workspace/wod-evidence/v106。

永久材料经济仍未实施。两选项见DECISION_SUPPLY_PERSISTENCE.md：每次预算重置，或金币购买/出发预留/结算退余量/免费恢复委托。新核阅2013官方入门指南仅支持消耗品及金币补购大结构，不能核实现服物价或本项目共用库存等具体提案；Gegenstand正文403未重试。不要把材料待定扩大为整体停工，可以继续不依赖它的单人内容。保持已确认身份与普通技能方向，不重复问已暂缓的身份/多人。

验证node --test tests/*.test.mjs；node scripts/verify-release.mjs；本机8002和已有Playwright运行scripts/run-browser-acceptance.mjs。后续只本地提交及恢复文件，不推送/合并/部署。
