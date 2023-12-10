import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';
import { log } from '../../boss-loot-log.js';

//------------------------
// M A I N
//-----------
async function item({ speaker, actor, token, character, item, args, scope, workflow }) {
  const info = args[0];
  let targetTokens = info.targets;
  const itemNameNormalized = helpers.normalizeItemName(item.name);

  if (targetTokens.length !== 1) {
    log('Please select one target', itemNameNormalized, 'warn');
    ui.notifications.warn(`Please select one target!`);
    return;
  }

  const [target] = targetTokens;

  new Sequence()
    .effect()
    .file('jb2a.greatsword.melee.standard.white')
    .atLocation(token)
    .stretchTo(target)
    .template({ gridSize: 200, startPoint: 200, endPoint: 200 })
    .timeRange(1400, 2500)
    .play();
}

export const deathKissBlade = {
  item: item,
};
