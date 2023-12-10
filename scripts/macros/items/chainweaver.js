import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';
import { log } from '../../boss-loot-log.js';

//------------------------
// F U N C T I O N S
//-----------
async function returnOneUse(item, usesCount) {
  await item.update({ 'system.uses.value': usesCount + 1 });
}

async function failChainVisual(sourceToken, targetToken) {
  try {
    await new Sequence()
      .effect()
      .file('jb2a.bullet.Snipe.blue')
      .filter('ColorMatrix', { hue: 135, brightness: 1, contrast: 0, saturate: 0 })
      .template({ gridSize: 200, startPoint: 200, endPoint: 200 })
      .attachTo(sourceToken)
      .stretchTo(targetToken)
      .effect()
      .file('modules/sequencer/samples/Bindings/chain.png')
      .tint('#353935')
      .filter('ColorMatrix', { hue: 135, brightness: 1, contrast: 0, saturate: 0 })
      .attachTo(sourceToken)
      .stretchTo(targetToken, { attachTo: true, tiling: true })
      .scale(0.15)
      .belowTokens()
      .waitUntilFinished(-400)
      .play();
  } catch (error) {
    log(`Error in playing the chain throw effect visuals: ${error.message}`, '', 'error');
  }
}

async function successChainVisual(sourceToken, targetToken) {
  await failChainVisual(sourceToken, targetToken);
  try {
    await new Sequence()
      .effect()
      .file('modules/sequencer/samples/Bindings/chain.png')
      .tint('#353935')
      .filter('ColorMatrix', { hue: 135, brightness: 1, contrast: 0, saturate: 0 })
      .name('Chainhook-Bracer-Chain')
      .attachTo(sourceToken)
      .stretchTo(targetToken, { attachTo: true, tiling: true })
      .scale(0.15)
      .belowTokens()
      .persist()
      .effect()
      .file('jb2a.markers.chain.standard.loop.02.red')
      .name('Chainhook-Bracer-Chain')
      .filter('ColorMatrix', { hue: 125, brightness: 1, contrast: 1, saturate: 0 })
      .attachTo(targetToken)
      .scaleToObject(1.5)
      .persist()
      .wait(500)
      .animation()
      .on(targetToken)
      .moveTowards(sourceToken, { ease: 'easeOutCirc' })
      .moveSpeed(10)
      .closestSquare()
      .async()
      .play();
  } catch (error) {
    log(`Error in playing the chain loop effect visuals: ${error.message}`, '', 'error');
  }
}

async function promptToPullFriend(artWork, itemName) {
  const dialogContent = `<div class="dnd5e chat-card item-card midi-qol-item-card">
    <header class="card-header flexrow">
      <img src="${artWork}" title="${itemName}" width="36" height="36" />
      <h3 class="item-name">${itemName}</h3>
    </header>
    <div class="card-content">
      <p><span style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Black}">The ${itemName} hums with magic as you consider using it to pull your friend to safety.</span></p>
      <p><span style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Black}">Is your friend willing to be pulled?</span></p>
      <br>
    </div>
    </div>`;

  return new Promise(resolve => {
    new Dialog({
      title: 'Attempt to pull a friend',
      content: dialogContent,
      buttons: {
        Yes: {
          label: `Yes`,
          callback: () => resolve(true),
        },
        No: {
          label: `No`,
          callback: () => resolve(false),
        },
      },
      close: () => resolve(null), // If the dialog is closed, resolve with null
    }).render(true);
  });
}

async function itemTemplatePlaced({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemNameNormalized = helpers.normalizeItemName(item.name);
  const effectName = 'Holding Chain (Temporrary Effect)';
  const info = args[0];
  const targetTokens = info.targets;
  const targetUuid = info.targetUuids;
  const usesCount = item.system.uses.value;
  const itemRange = item.system.range.long;
  const permittedSize = ['tiny', 'sm', 'med'];
  const artWorkChatCardStatic = `modules/${MODULE_NAME}/artwork/003-chainweaver-bracer/art-static-chainweaver-bracer.webp`;
  const artWorkChatCardAnimated = `modules/${MODULE_NAME}/artwork/003-chainweaver-bracer/art-animated-for-chat-chainweaver-bracer.gif`;
  const artworkHoldingChainEffect = `modules/${MODULE_NAME}/artwork/003-chainweaver-bracer/art-static-holding-chain-effect.webp`;

  //------------------------
  // P R E - C H E C K S     G U A R D S
  //-----------

  // Delete the Template
  if (info.templateId) {
    await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [info.templateId]);
  }

  if (targetTokens.length !== 1) {
    await returnOneUse(item, usesCount);
    log('Please select one target to pull', itemNameNormalized, 'warn');
    ui.notifications.warn(`Please select one target to pull!`);
    return;
  }

  if (targetUuid && targetUuid.includes(token.document.uuid)) {
    await returnOneUse(item, usesCount);
    log('Cannot use the item on yourself', itemNameNormalized, 'warn');
    ui.notifications.warn(`Cannot use the item ${itemNameNormalized} on yourself!`);
    return;
  }

  // Check the distance
  const [targetToken] = targetTokens; // TokenDocument
  const [targetTokenObj] = Array.from(workflow.targets);
  const distanceFeet = helpers.checkDistance(token, targetTokenObj); // from center to center

  if (distanceFeet > itemRange) {
    await returnOneUse(item, usesCount);
    log(`Please target a token in a ${itemRange} feet range. Actual range: ${distanceFeet}`, itemNameNormalized, 'warn');
    ui.notifications.warn(`Please target a token in a ${itemRange} feet range!`);
    return;
  }

  // Check the size
  const targetSize = targetToken.actor.system?.traits?.size;
  const isProperSize = permittedSize.includes(targetSize.toLowerCase());
  if (!isProperSize) {
    const textToChat = `<p>You extend the <strong>${itemNameNormalized}'s</strong> magic chain towards the <strong>${targetToken.name}</strong>, but it's too massive and powerful, the chain struggles to even reach it, let alone pull it towards you. The creature looks at you with contempt as it remains in its place.</p>`;
    await helpers.createChatMessage('FAIL', textToChat, itemNameNormalized, artWorkChatCardStatic);
    await failChainVisual(token, targetTokenObj);
    return;
  }

  //------------------------
  // M A I N
  //-----------

  const holdingChainEffect = {
    name: effectName,
    icon: artworkHoldingChainEffect,
    duration: {
      rounds: 1,
      startTime: null,
      seconds: null,
      combat: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    origin: item.uuid,
    disabled: false,
    changes: [],
    tint: null,
    transfer: false,
    flags: {
      effectmacro: {
        onDelete: {
          script: `// Delete Seq Effects\nawait Sequencer.EffectManager.endEffects({ name: "Chainhook-Bracer-Chain" });\n\n// Delete Restrained effect from target\nconst hasEffectApplied = game.dfreds.effectInterface.hasEffectApplied("Restrained", "${targetToken.uuid}");\nif (hasEffectApplied) {\n  await game.dfreds.effectInterface.removeEffect({ effectName: "Restrained", uuid: "${targetToken.uuid}" });\n  bossLoot.log(\`"Restrained" effect removed from ${targetToken.name}\`);\n}\n`,
        },
      },
    },
  };

  let isWilling = false;
  let success = false;
  const isFriendly = targetToken.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;

  if (isFriendly) {
    isWilling = await promptToPullFriend(artWorkChatCardStatic, itemNameNormalized);
  }

  // Dialog cancelled
  if (isWilling === null) {
    return;
  }

  //Begin contested Roll check
  if (!isWilling) {
    const targetSkill = targetToken.actor.system.skills.acr.mod > targetToken.actor.system.skills.ath.mod ? 'acr' : 'ath';

    const target_roll = await targetToken.actor.rollSkill(targetSkill, {
      fastForward: true,
      rollMode: isFriendly ? 'publicroll' : 'blindroll',
    });
    const main_roll = await actor.rollSkill(`ath`, {
      fastForward: true,
      targetValue: target_roll.total,
      flavor: `Athletics contested check vs <strong>DC ${target_roll.total}</strong>`,
    });
    /*
  ***
  *** Not so nice because rollOptions applies to both dices
  ***
  const contestResult = await MidiQOL.contestedRoll({
    source: { token, rollType: 'skill', ability: 'Athletics' },
    target: { token: targetTokenObj, rollType: 'skill', ability: targetSkill },
    flavor: itemNameNormalized,
    displayResults: true,
    itemCardId: workflow.itemCardId,
    rollOptions: { fastForward: !isFriendly, chatMessage: true, rollMode: isFriendly ? 'publicroll' : 'blindroll' },
  });
  success = contestResult.result >= 0;
  */

    // Check for success
    success = main_roll.total >= target_roll.total;
  } else {
    success = true;
  }

  if (!success) {
    const textToChat = `<p>You extend the <strong>${itemNameNormalized}'s</strong> magic chain towards the <strong>${targetToken.name}</strong>, with a quick and precise movement, but it manages to dodge and evade the chain's grasp, remaining out of reach.</p>`;
    await helpers.createChatMessage('FAIL', textToChat, itemNameNormalized, artWorkChatCardStatic);
    await failChainVisual(token, targetTokenObj);
    return;
  }

  if (!game.combat?.active) {
    holdingChainEffect.duration.rounds = null;
    holdingChainEffect.duration.seconds = 6;
  }
  await actor.createEmbeddedDocuments('ActiveEffect', [holdingChainEffect]);

  // Add Restrained effect
  await game.dfreds.effectInterface.addEffect({ effectName: 'Restrained', uuid: targetToken.uuid });

  const textToChat = `<p>With a swift flick of your wrist, the <strong>${itemNameNormalized}</strong> extends its magic chain towards the <strong>${targetToken.name}</strong>, latching onto it with a loud clink. The creature stumbles and is pulled towards you with a force, its eyes widen in surprise as it struggles to break free but to no avail.</p>`;
  // await helpers.hideDivFromChatMessage(info.itemCardId, '#boss-loot-chainweaver-bracer');
  await helpers.createChatMessage('SUCCESS', textToChat, itemNameNormalized, artWorkChatCardStatic, artWorkChatCardAnimated);

  // Chain Effect
  await successChainVisual(token, targetTokenObj);
}

export const chainweaver = {
  itemTP: itemTemplatePlaced,
};
