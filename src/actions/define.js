const actions = [];
const byId = new Map();

export function registerAction(def) {
  if (!def || !def.id) throw new Error('action needs an id');
  if (byId.has(def.id)) throw new Error('duplicate action ' + def.id);
  byId.set(def.id, def);
  actions.push(def);
  return def;
}

export function getAction(id) {
  return byId.get(id) || null;
}

export function actionIds() {
  return actions.map(function (a) { return a.id; });
}

export function allActions() {
  return actions.slice();
}
