import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';
import { socket } from '../../bossLoot.js';
import { log } from '../../boss-loot-log.js';

async function featTemplatePlaced({ speaker, actor, token, character, item, args, scope, workflow }) {
  const info = args[0];
  const templ = canvas.scene.templates.get(info.templateId);
  const vortexArrowArtwork = `modules/${MODULE_NAME}/artwork/002-void-vortex/art-animated-for-chat-vortex-arrow.gif`;

  await helpers.replaceChatArtwork(info.itemCardId, vortexArrowArtwork);

  await new Sequence()
    .effect()
    .file('jb2a.arrow.physical.blue')
    .atLocation(token)
    .stretchTo({ x: templ.x, y: templ.y }, { cacheLocation: true })
    .template({ gridSize: 200, startPoint: 200, endPoint: 200 })
    .waitUntilFinished()
    .effect()
    .file('jb2a.explosion.03.blueyellow')
    .atLocation(templ)
    .scaleToObject()
    .effect()
    .file('jb2a.sphere_of_annihilation.600px.purple')
    .name('VoidVortexBlackHole')
    .atLocation(templ)
    .scaleToObject()
    .belowTokens()
    .fadeIn(300, { ease: 'easeInSine' })
    .persist()
    .attachTo(templ)
    .play();
}

async function featPostSave({ speaker, actor, token, character, item, args, scope, workflow }) {
  const info = args[0];
  const templ = canvas.scene.templates.get(info.templateId);
  const itemNameNormalized = helpers.normalizeItemName(item.name);
  const canvasGridSize = canvas.scene.grid.size;
  const tokensToMove = Array.from(workflow.failedSaves);

  if (tokensToMove.length === 0) {
    log('No tokens in failedSaves', itemNameNormalized);
    return;
  }

  const incapacitatedEffectData = game.dfreds.effectInterface.findEffectByName('Incapacitated').toObject();
  incapacitatedEffectData.flags.dae = {
    transfer: false,
    specialDuration: ['turnStartSource'],
  };
  incapacitatedEffectData.flags.effectmacro = {
    onDelete: {
      script:
        'await bossLoot.macros.vortexArrowFeat.effectDelete({token: arguments[0], actor:arguments[2], speaker: arguments[3], scene: arguments[4], effect: arguments[6]})',
    },
  };
  incapacitatedEffectData.duration.seconds = game.combat?.active ? null : 6;

  tokensToMove.forEach(async targetToken => {
    const randomizeX = Math.floor(Math.random() * canvasGridSize * helpers.randomInt(-1, 1));
    const randomizeY = Math.floor(Math.random() * canvasGridSize * helpers.randomInt(-1, 1));

    const newTokenPos = { x: templ.x - randomizeX, y: templ.y - randomizeY };

    new Sequence()
      .animation()
      .on(targetToken)
      .fadeIn(500)
      .moveSpeed(5)
      .rotateTowards(newTokenPos)
      .moveTowards(newTokenPos, { duration: 1, ease: 'easeInQuint', delay: 0, offset: 0 })
      .play();

    // Apply Incapacitated on each Token
    const isIncapacitated = game.dfreds.effectInterface.hasEffectApplied('Incapacitated', targetToken.actor.uuid);
    if (!isIncapacitated) {
      await game.dfreds.effectInterface.addEffectWith({ effectData: incapacitatedEffectData, uuid: targetToken.actor.uuid, origin: item.uuid });
    }

    // Toggle token visibility
    await socket.executeAsGM('toggleTokenVisibility', { tokenUuid: targetToken.document.uuid, hidden: true });
  });
}

// (token,character,actor,speaker,scene,origin,effect,item)
async function effectDelete({ token, actor, speaker, scene, effect }) {
  await socket.executeAsGM('toggleTokenVisibility', { tokenUuid: token.document.uuid, hidden: false });
  const { x, y } = canvas.grid.getSnappedPosition(token.document.x, token.document.y);
  await token.document.update({ x, y }, { animate: false });
}

export const vortexArrowFeat = {
  featTP: featTemplatePlaced,
  featPS: featPostSave,
  effectDelete: effectDelete,
};
