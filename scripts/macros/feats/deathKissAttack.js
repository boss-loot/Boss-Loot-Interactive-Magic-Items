import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';
import { log } from '../../boss-loot-log.js';

async function itemFeat({ speaker, actor, token, character, item, args, scope, workflow }) {
  const info = args[0];
  const itemNameNormalized = helpers.normalizeItemName(item.name);
  const artWorkChatTitleAnimated = `modules/${MODULE_NAME}/artwork/009-death-kiss-blade/art-animated-for-chat-death-kiss-blade.gif`;

  if (info.targets.length === 0) {
    log('No hits', itemNameNormalized);
    return;
  }

  await helpers.replaceChatArtwork(info.itemCardId, artWorkChatTitleAnimated);

  // Making a copy to not alter the original array
  const targets = Array.from(info.targets);
  targets.unshift(token.document);

  const seq = new Sequence();

  for (let t = 0; t < targets.length; t++) {
    if (t == targets.length - 1) {
      break;
    }
    log(`Now attacking ${targets[t + 1].name}`, itemNameNormalized);

    await seq
      .animation()
      .on(token)
      .fadeOut(150)

      .effect()
      .file('jb2a.gust_of_wind.veryfast')
      .endTime(380)
      .filter('ColorMatrix', { hue: 115 })
      .atLocation(targets[t], { cacheLocation: true })
      .stretchTo(targets[t + 1], { cacheLocation: true })
      .waitUntilFinished(-500)

      .effect()
      .file('jb2a.greatsword.melee.standard.white')
      .spriteScale(0.5)
      .randomRotation()
      .template({ gridSize: 200, startPoint: 200, endPoint: 200 })
      .timeRange(1400, 2000)
      .atLocation(targets[t + 1], { cacheLocation: true })
      .waitUntilFinished(-500);
  }

  await seq
    .effect()
    .file('jb2a.gust_of_wind.veryfast')
    .endTime(380)
    .filter('ColorMatrix', { hue: 115 })
    .atLocation(targets[targets.length - 1], { cacheLocation: true })
    .stretchTo(targets[0], { cacheLocation: true })
    .waitUntilFinished(-500)

    .animation()
    .on(token)
    .fadeIn(100)

    .effect()
    .file('jb2a.static_electricity.03.blue')
    .filter('ColorMatrix', { hue: 190 })
    .atLocation(token)
    .scaleToObject()
    .play();
}

export const deathKissAttack = {
  itemFeat: itemFeat,
};
