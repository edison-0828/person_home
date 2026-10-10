Original prompt: 做一个agent，不受用户控制，自己在一个小房子/小地图里进行人类日常生活，用户只能观察它在做什么。

- 2026-10-10: Created observer-only autonomous life simulation prototype in outputs/index.html.
- 2026-10-10: Verified with Playwright: canvas renders, autonomous movement/state text works, day/night changes, job-seeking can transition to remote designer, and no console errors were reported.
- 2026-10-10: Reworked the presentation into crisp 2D pixel art with an isometric/cutaway house, pixel resident sprite, pixel furniture, and day/night palette; verified day and night screenshots plus autonomous state text.
- 2026-10-10: Added a high-cognition personality profile (92/100) with autonomous crypto/US stock research and fitness blocks, plus live thought text and personality data in render_game_to_text; verified market-research behavior in the browser.
- 2026-10-10: 用需求/效用决策替换固定作息。精力、饥饿、心情、存款、昼夜节律（软偏好）、人格和随机性一起给下一步打分，日子之间会不一样。
- 2026-10-10: 吃饭花钱，工作按工时进账，求职改为概率成功；虚拟行情可盈可亏，并影响心情。至少研究两次才允许小仓位买入。
- 2026-10-10: 加入近期事件和昨日总结。记忆会推动之后的选择，念头按当下情境生成，不再使用写死的台词。
- 2026-10-10: 状态写入 localStorage。重新打开从上次继续，并按离开的现实时间追赶一段生活（最多 36 小时）。连续清醒时间改为真实计时。
- 2026-10-10: 无头浏览器验证通过：无控制台报错；连续六天的行动序列彼此不同；很饿会去吃饭，不饿不会被午饭时间拖走，夜里精疲力尽会睡；没钱时去找工作而不是下单；虚拟交易亏损会减少存款和心情；重开页面能续上，离开的时间也会被补上。
- 2026-10-10: 画面改成星露谷式俯视像素小屋。16×16 地砖放大绘制，卧室、厨房、书房、起居健身区和带草地、花、栅栏、树的院子分开布置。林默有四方向多帧走路和坐、做饭、吃饭、打字、举铁、睡觉的姿势，并沿可走格子绕开墙和家具。夜里保留暖色灯光。无头浏览器无控制台报错，床到每个落点都能走到。
- 2026-10-10: 林默开始有情绪、手艺、后悔和领悟。情绪会衰减并轻轻影响选择；下雨会怀念。他自选做饭、吉他、画画或交易纪律来练，有平台期和突破，等级会改变饭菜花费和交易冲动。失误留下教训，照做会加深、久了会淡，并在之后改变行为。夜里写日记，偶尔醒悟并改长期优先级。面板和 localStorage 都能看到这些。无头浏览器里连续多日无控制台报错，能观察到失误到后悔、教训、行为改变的链条，手艺经验在涨，日记彼此不同。
- 2026-10-10: 钱开始推着他的情绪和日子。存款紧时焦虑升高，觉和心情变差，他从院子的门出去打散工（送外卖、搬箱子、发传单），离开画面，回来时更累并拿到这一趟的现金。付不起房租会记成欠款。有余钱时会买手机、电脑、沙发、器械或吉他，东西画在屋子里：电脑抬时薪，吉他和器械改变练习和训练，冲动的小东西会后悔。每天按习惯加减生活轨迹，折线和阶段（从容到谷底）显示在面板上；谷底可能醒过来，顺太久可能松手。收入面板显示职位、时薪、今日散工、本月收支、净资产和最近账目。职业会涨薪、升职、被辞或跳槽。无头浏览器无控制台报错：欠着钱的八天里他出去打了散工，轨迹先降后升；只剩几块钱跨过午夜会欠下房租并更焦虑；存款充足的八天里买齐了几样东西并升到设计主管，时薪写在面板上，轨迹往上走。
- 2026-10-10: 把单文件拆成 ES 模块。地图、人物与地砖、行动登记、决策、情绪、手艺、收支与职业、日记记忆、存档、面板和主循环各自一个文件。新行动只在 `src/actions/catalog.js` 登记一次（id、打分、时长、落点、姿势、副作用、念头）。`render_game_to_text` 和 `advanceTime` 仍挂在 window 上。用 `node server.mjs` 或 `npm start` 打开；`npm run build` 把页面复制到 `dist/`。无头浏览器无控制台报错：原有的多日自主生活、情绪手艺、缺钱散工和有钱购物都还在；地图每个落点都能走到。
- TODO: 多居民与关系、更细的客户与空窗、更完整的健身与身体状态。
