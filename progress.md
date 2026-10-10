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
- TODO: 多居民与关系、更长的职业经历、更完整的健身与身体状态。
