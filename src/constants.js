export const TILE = 16, SCALE = 2, COLS = 22, ROWS = 18;

export const KEY = 'linmo-pixel-life-v1';

export const SIM_MIN_PER_SEC = 5;

export const MIND = {cognition: 92, interests: ['crypto', 'US stocks', 'fitness'], risk: 'research-before-acting'};

export const WEATHERS = [
  {full:'晴朗 · 微风', short:'晴朗', walk:1},
  {full:'大太阳', short:'晴热', walk:0.72},
  {full:'多云', short:'多云', walk:0.5},
  {full:'阴天 · 凉', short:'阴天', walk:0.28},
  {full:'小雨', short:'小雨', walk:-0.62}
];

export const SKILL_META = {
  cooking:{name:'做饭', place:'stove'},
  guitar:{name:'吉他', place:'sofa'},
  drawing:{name:'画画', place:'desk'},
  trading:{name:'交易纪律', place:'desk'}
};

export const FEEL_NAME = {joy:'喜悦', anxiety:'焦虑', loneliness:'孤独', pride:'自豪', regret:'后悔', hope:'希望', nostalgia:'怀念'};

export const LESSON_TEXT = {
  patient:'手痒的时候先复盘，不要用仓位出气。',
  sleep:'熬夜换来的清醒，第二天会连本带利还回去。',
  train:'没练的那一天，身体会在第二天提醒他。',
  spend:'心情不好时多花的钱，事后并不安慰人。',
  oversleep:'睡过头不是休息，是把早晨弄丢了。',
  rent:'欠着的房租会把晚上变长。先把日子垫平。'
};
