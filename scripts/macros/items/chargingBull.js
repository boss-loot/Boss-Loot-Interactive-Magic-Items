import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';
import { log } from '../../boss-loot-log.js';

//------------------------
// F U N C T I O N S
//-----------
function thrownToken(chargingToken, targetToken, itemNameNormalized) {
  const gridSize = canvas.scene.grid.size;
  const newDistance = gridSize * 3;
  const targetTokenCenter = targetToken.center; // compute only once the center

  // From token to target
  const ray1 = new Ray(chargingToken.center, targetTokenCenter);
  const originalDistance = ray1.distance;
  const ratio = newDistance / originalDistance;

  // Check collision
  const collisionSettings = { type: 'move', mode: 'closest' }; // mode: universal
  const collision = helpers.testCollision({ x: ray1.B.x, y: ray1.B.y }, { x: ray1.B.x + ray1.dx * ratio, y: ray1.B.y + ray1.dy * ratio }, collisionSettings);

  let dx, dy, destPosition;
  if (collision) {
    dx = collision.x - targetTokenCenter.x;
    dy = collision.y - targetTokenCenter.y;
    log('Collision detected, stopping the movement', itemNameNormalized);
    let distanceX = dx > 0 ? Math.floor(dx / gridSize) * gridSize : Math.ceil(dx / gridSize) * gridSize;
    let distanceY = dy > 0 ? Math.floor(dy / gridSize) * gridSize : Math.ceil(dy / gridSize) * gridSize;

    destPosition = { x: targetToken.x + distanceX, y: targetToken.y + distanceY };
  } else {
    destPosition = canvas.grid.getSnappedPosition(ray1.B.x + ray1.dx * ratio - targetToken.w / 2, ray1.B.y + ray1.dy * ratio - targetToken.h / 2, 1);
  }

  return { x: destPosition.x, y: destPosition.y };
}

async function chargeAnimation(chargingToken, targetToken) {
  await new Sequence()
    // Charge
    .animation()
    .on(chargingToken)
    .moveTowards(targetToken, { ease: 'easeInOutBack' })
    .moveSpeed(15)
    .waitUntilFinished(-300)
    .closestSquare()
    .effect()
    .file('jb2a.wind_stream.white')
    .timeRange(0, 400)
    .atLocation(chargingToken, { cacheLocation: true })
    .stretchTo(targetToken, { cacheLocation: true })
    .scale({ x: 1, y: 0.2 })
    .belowTokens()
    .play();
}

async function thrownAnimation(chargingToken, targetPosition) {
  await new Sequence()
    //Start dust under token
    .effect()
    .file('jb2a.smoke.puff.ring.01.white.0')
    .atLocation(chargingToken)
    .scaleToObject(1.75)
    .belowTokens()
    .waitUntilFinished(-1000)
    //Turn token invisible
    .animation()
    .on(chargingToken)
    .opacity(0)
    .teleportTo(targetPosition)
    //Token jump
    .effect()
    .from(chargingToken)
    .atLocation(chargingToken)
    .scale(1.5)
    .scaleIn({ x: 0.5, y: 0.5 }, 250, { ease: 'easeOutCubic' })
    .scaleOut({ x: 0.5, y: 0.5 }, 450, { ease: 'easeInCubic' })
    .opacity(1)
    .duration(800)
    .anchor({ x: 0.5, y: 0.5 })
    .loopProperty('sprite', 'rotation', { from: 0, to: 360, duration: 800, ease: 'easeOutQuad' })
    .moveTowards(targetPosition, { rotate: false, ease: 'easeOutSine' })
    .zIndex(2)
    //Token shadow
    .effect()
    .from(chargingToken)
    .atLocation(chargingToken)
    .opacity(0.5)
    .scale(0.9)
    //.belowTokens()
    .duration(800)
    .anchor({ x: 0.5, y: 0.1 })
    .filter('ColorMatrix', { brightness: -1 })
    .filter('Blur', { blurX: 5, blurY: 10 })
    .loopProperty('sprite', 'rotation', { from: 0, to: 360, duration: 800, ease: 'easeOutCirc' })
    .moveTowards(targetPosition, { rotate: false, ease: 'easeOutSine' })
    .zIndex(2)
    .waitUntilFinished(-100)
    //End dust under token
    .effect()
    .file('jb2a.smoke.puff.ring.01.white.2')
    .atLocation(chargingToken)
    .scaleToObject(1.75)
    .effect()
    .file('jb2a.smoke.puff.ring.01.white.1')
    .atLocation(chargingToken)
    .effect()
    .file('jb2a.smoke.puff.side.02.white.0')
    .atLocation(chargingToken)
    .rotateTowards(chargingToken, { rotationOffset: 180, cacheLocation: true })
    .scaleToObject(2.5)
    //Turn token visible
    .animation()
    .on(chargingToken)
    .opacity(1)
    .delay(200)
    .play();
}

async function item({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemNameNormalized = helpers.normalizeItemName(item.name);
  const abilityName = 'Mighty Charge';
  const info = args[0];
  const targetUuid = info.targetUuids;
  const permittedSize = ['tiny', 'sm', 'med'];
  const flatDC = 15;
  const bludgeoningDamage = '4d4';
  const damageType = 'bludgeoning';
  const actorMovementWalk = actor.system.attributes.movement.walk;
  const actorMovementFly = actor.system.attributes.movement.fly;
  const actorMovementUnits = actor.system.attributes.movement.units;
  const extraSquare = canvas.scene.grid.distance;
  const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/011-helm-of-the-charging-bull/art-static-helm-of-the-charging-bull.webp`;
  const artWorkChatCardChargingBull = `modules/${MODULE_NAME}/artwork/011-helm-of-the-charging-bull/art-animated-for-chat-helm-of-the-charging-bull.gif`;

  // Delete the Template
  if (info.templateId) {
    await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [info.templateId]);
  }

  //------------------------
  // P R E - C H E C K S
  //-----------
  if (info.targets.length !== 1) {
    log('Please select one target', itemNameNormalized, 'warn');
    ui.notifications.warn(`Please select one target!`);
    return;
  }

  if (targetUuid && targetUuid.includes(token.document.uuid)) {
    log('Cannot use the item on yourself', itemNameNormalized, 'warn');
    ui.notifications.warn(`Cannot use the item ${itemNameNormalized} on yourself!`);
    return;
  }

  // Check the distance
  const [targetToken] = Array.from(workflow.targets);
  const ray = new Ray({ x: token.center.x, y: token.center.y }, { x: targetToken.center.x, y: targetToken.center.y });
  const collision = helpers.testCollision(ray.A, ray.B, { type: 'move', mode: 'any' });
  const [distanceFeet] = canvas.grid.measureDistances([{ ray }], { gridSpaces: true });
  if (collision) {
    log('You cannot charge through walls', itemNameNormalized, 'warn');
    ui.notifications.warn(`You cannot charge through walls`);
    return;
  }
  if (distanceFeet < 20) {
    log(`You need to charge at least 20 feet to the target (${distanceFeet}ft)`, itemNameNormalized, 'warn');
    ui.notifications.warn(`You need to charge at least 20 feet to the target`);
    return;
  }

  if (distanceFeet > actorMovementWalk + actorMovementFly + extraSquare) {
    log(
      `You don't have enough movement left. Desired move: (${distanceFeet}). Remaining movement: (${
        actorMovementWalk + actorMovementFly
      }${actorMovementUnits})`,
      itemNameNormalized,
      'warn'
    );
    ui.notifications.warn(`You don't have enough movement left.`);
    return;
  }

  //------------------------
  // M A I N
  //------------------------
  const [target] = Array.from(workflow.targets);
  const targetSize = target.document.actor.system?.traits?.size;

  await helpers.hideDivFromChatMessage(info.itemCardId, '#img-static-helm-of-the-charging-bull');
  await chargeAnimation(token, target);

  if (!permittedSize.includes(targetSize.toLowerCase())) {
    await helpers.createChatMessage('Failed', '<p>Foe too large to be thrown!</p>', abilityName, artWorkChatTitle, artWorkChatCardChargingBull);
    return;
  }

  const newTargetLoc = thrownToken(token, target, itemNameNormalized);
  const abilitySaveMessageFlavor = `Dexterity Saving Throw vs DC ${flatDC}`;
  const target_roll = await target.document.actor.rollAbilitySave('dex', {
    fastForward: true,
    targetValue: flatDC,
    rollMode: 'blindroll',
    flavor: abilitySaveMessageFlavor,
  });

  const flavorText = `<p>${abilityName} ${damageType} damage roll</p>`;
  const damageAmount = new Roll(bludgeoningDamage).evaluate({ async: false });

  await damageAmount.toMessage({
    flavor: flavorText,
    speaker: ChatMessage.getSpeaker({ actor: actor }),
  });

  let message;
  let isFullDamage = false;
  let isSuccess = false;

  if (target_roll.total < flatDC) {
    message = "<p>Charged with the helm's power, the enemy is thrown back, stunned and prone.</p>";
    await thrownAnimation(target, newTargetLoc);

    const incapacitatedEffectData = game.dfreds.effectInterface.findEffectByName('Stunned').toObject();
    incapacitatedEffectData.flags.dae = {
      transfer: false,
      specialDuration: ['turnEnd'],
      stackable: 'multi',
      macroRepeat: 'none',
    };

    await game.dfreds.effectInterface.addEffect({ effectName: 'Prone', uuid: targetUuid[0], origin: info.item.uuid });
    await game.dfreds.effectInterface.addEffectWith({ effectData: incapacitatedEffectData, uuid: targetUuid[0], origin: info.item.uuid });
    isFullDamage = true;
    isSuccess = true;
  } else {
    message = '<p>Foe withstood charge!</p>';
  }

  const damageToApply = isFullDamage ? damageAmount.total : Math.floor(damageAmount.total / 2);
  const messageTitle = isSuccess ? 'Success' : 'Failed';
  await helpers.createChatMessage(messageTitle, message, abilityName, artWorkChatTitle, artWorkChatCardChargingBull);
  await MidiQOL.applyTokenDamage([{ damage: damageToApply, type: damageType }], damageToApply, new Set(info.targets), item, new Set(), {});
}

export const chargingBull = {
  item: item,
};
