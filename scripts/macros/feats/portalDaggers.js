import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';
import { log } from '../../boss-loot-log.js';

//------------------------
// F U N C T I O N S
//-----------
function isPointInSquare(point, tokenDocument) {
  const gridSize = canvas.scene.grid.size;
  const h = tokenDocument.height * gridSize;
  const w = tokenDocument.width * gridSize;
  const { x: x0, y: y0 } = point;
  const { x: x1, y: y1 } = tokenDocument;
  const x2 = tokenDocument.x + w;
  const y2 = tokenDocument.y;
  const x3 = tokenDocument.x + w;
  const y3 = tokenDocument.y + h;
  const x4 = tokenDocument.x;
  const y4 = tokenDocument.y + h;

  const minX = Math.min(x1, x2, x3, x4);
  const maxX = Math.max(x1, x2, x3, x4);
  const minY = Math.min(y1, y2, y3, y4);
  const maxY = Math.max(y1, y2, y3, y4);

  return x0 >= minX && x0 <= maxX && y0 >= minY && y0 <= maxY;
}

async function teleportToken(itemNameNormalized, nextPortalId, tokenDoc, position = undefined) {
  if (position) {
    log(`${tokenDoc.name} will teleport to ${nextPortalId}`, itemNameNormalized);
    const portalCoords = { x: position.data.source.x, y: position.data.source.y };

    await new Sequence()
      .animation()
      .on(tokenDoc)
      .opacity(0)
      .animation()
      .on(tokenDoc)
      .teleportTo(portalCoords, { delay: 450 })
      .snapToGrid()
      .closestSquare()
      .waitUntilFinished()
      .animation()
      .on(tokenDoc)
      .opacity(1)
      .play();
  }
}

async function playVisuals(fromToken, toTemplate, itemName, portalId, filterData) {
  // Select file for portal
  const jb2aId = 'jb2a_patreon';
  let jb2aPortalBrightYellow = '';
  if (game.modules.get(jb2aId)?.active) {
    jb2aPortalBrightYellow = 'jb2a.portals.vertical.ring.yellow';
  } else {
    jb2aPortalBrightYellow = 'jb2a.portals.vertical.ring.bright_yellow';
  }

  await new Sequence()
    //Impact
    .effect()
    .file('jb2a.impact.010.orange')
    .atLocation(fromToken)
    .scaleToObject(2)
    .scaleOut(0, 250)
    .randomRotation()

    //Dagger Throw
    .effect()
    .file('jb2a.dagger.throw.01.white')
    .name(itemName)
    .atLocation(fromToken)
    .template({ gridSize: 200, startPoint: 200, endPoint: 200 })
    .stretchTo(toTemplate, { onlyX: true })
    .filter('ColorMatrix', { brightness: 1, contrast: 2, saturate: -1 })
    .spriteOffset({ x: 0.5 }, { gridUnits: true })
    .endTimePerc(0.9)
    .persist()
    .noLoop()
    .zIndex(1)

    //Flash
    .effect()
    .from(fromToken)
    .atLocation(fromToken)
    .filter('ColorMatrix', { saturate: -1, brightness: 10 })
    .scaleToObject(1)
    .filter('Blur', { blurX: 5, blurY: 10 })
    .duration(600)
    .scaleOut(0, 500, { ease: 'easeOutCubic' })
    .fadeOut(600)
    .waitUntilFinished(500)

    //Portal
    .effect()
    .file(jb2aPortalBrightYellow)
    .name(portalId)
    .filter('ColorMatrix', filterData)
    .atLocation(toTemplate)
    .scale(0.7)
    .scaleIn(0, 500, { ease: 'easeOutCubic' })
    .scaleOut(0, 500, { ease: 'easeInQuint' })
    .rotateTowards(fromToken, { cacheLocation: true })
    .spriteRotation(90)
    .anchor({ x: 0.6, y: 0.5 })
    .belowTokens()
    .persist()

    .play();
}

async function checkDistance(crosshairs, token, distanceAvailable, itemImage) {
  let crosshairsDistance = 0;
  while (crosshairs.inFlight) {
    //wait for initial render
    await warpgate.wait(100);

    const ray = new Ray(token.center, crosshairs);
    const distance = canvas.grid.measureDistances([{ ray }], { gridSpaces: true })[0];

    //only update if the distance has changed
    if (crosshairsDistance !== distance) {
      crosshairsDistance = distance;
      if (distance > distanceAvailable) {
        crosshairs.icon = 'icons/svg/hazard.svg';
      } else {
        crosshairs.icon = itemImage;
      }

      crosshairs.draw();
      crosshairs.label = `${distance} ft`;
    }
  }
}

async function deleteItem(sourceActor, itemName) {
  // Delete the dagger from Inventory
  const itemToDelete = sourceActor.items.getName(itemName);
  if (itemToDelete) {
    await itemToDelete.delete();
    log(`Deleted item ${itemName} from inventory of ${sourceActor.name}`, helpers.normalizeItemName(itemName));
  } else {
    log(`Could not find item ${itemName} in player's inventory! Item was not deleted!`);
  }
}

async function primeItemAfterActiveEffects({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemName = helpers.getItemSource(item);
  const itemNameNormalized = helpers.normalizeItemName(itemName);
  const nextItemName = 'Secundus Portal Dagger';
  const portalName = 'Prime Portal';
  const portalId = 'Prime-Portal';
  const nextPortalId = 'Secundus-Portal';
  const info = args[0];
  const distanceAvailable = item.system.range.long;
  const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-prime.webp`;
  const artWorkChatTitleAnimated = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-animated-for-chat-portal-dagger-prime.gif`;

  const abilitySelection = `<div class="dnd5e chat-card item-card midi-qol-item-card">
      <header class="card-header flexrow">
        <img src="${artWorkChatTitle}" title="${itemNameNormalized}" width="36" height="36" />
        <h3 class="item-name">${itemNameNormalized}</h3>
      </header>
      <div class="card-content">
        <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}">Do you want to enter in portal or pull the dagger and close the portal?</p>
        <br />
      </div>
      </div>`;

  // Locally because of the hook
  async function initiateDialog(tokenDoc, position) {
    await new Dialog(
      {
        title: 'Ability',
        content: abilitySelection,
        buttons: {
          button1: {
            icon: "<i class='fa-light fa-person-to-portal'></i>",
            label: 'Enter Portal',
            callback: async () => await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, position),
          },
          button2: {
            icon: "<i class='fa-light fa-dagger'></i>",
            label: 'Pull the dagger',
            callback: async () => {
              /// HOOK OFF
              Hooks.off('updateToken', game.PrimePortalDaggerHookClientSpecificId);
              log(`Deleted the Hook "updateToken" with ID = ${game.PrimePortalDaggerHookClientSpecificId}`, itemNameNormalized);
              delete game.PrimePortalDaggerHookClientSpecificId;

              await Sequencer.EffectManager.endEffects({ name: portalId });
              await Sequencer.EffectManager.endEffects({ name: itemNameNormalized });
              const message = `<p>With a firm grip, you grasp the hilt of the <strong>${itemNameNormalized}</strong> and give it a sharp tug. The blade easily slides out of the wall, the portal it had opened closing in an instant. The magical bond between the dagger and yourself remains, its power still pulsing within you. You secure the blade at your side, ready to use its power again in your journey.</p>`;
              await helpers.createChatMessage(itemNameNormalized, message, itemNameNormalized, artWorkChatTitle, artWorkChatTitleAnimated);
              // Create the item in player's inventory
              const daggerItem = game.items.getName(itemName);
              await actor.createEmbeddedDocuments('Item', [daggerItem]);
              const equippedDaggerItem = actor.items.getName(itemName);
              await equippedDaggerItem?.update({ 'system.attunement': CONFIG.DND5E.attunementTypes.ATTUNED, 'system.equipped': true });
            },
          },
        },
      },
      { width: 500 }
    ).render(true);
  }

  //------------------------
  // P R E C H E C K S
  //-----------
  const portal1 = Sequencer.EffectManager.getEffects({ name: portalId });
  if (portal1.length > 0) {
    ui.notifications.warn(`${portalName} already exist!`);
    return;
  }

  //------------------------
  // M A I N
  //-----------
  const portal1Template = await warpgate.crosshairs.show(
    {
      interval: token.document.width % 2 === 0 ? 1 : -1,
      size: token.document.width,
      icon: item.img,
      label: '0 ft.',
    },
    {
      show: crosshairs => checkDistance(crosshairs, token, distanceAvailable, item.img),
    }
  );

  const crosshairsDistance = helpers.checkDistance(token, portal1Template);

  // Exit if
  if (portal1Template.cancelled || crosshairsDistance > distanceAvailable) {
    return;
  }

  const portal1Coords = { x: portal1Template.x, y: portal1Template.y };

  const collision = helpers.testCollision(token.center, portal1Coords, { type: 'move', mode: 'any' });
  if (collision) {
    ui.notifications.warn('Cannot use the dagger through walls!');
    return;
  }

  game.PrimePortalDaggerHookClientSpecificId = Hooks.on('updateToken', async (tokenDoc, updateData) => {
    // Movement guard
    const inPortalRange = isPointInSquare(portal1Coords, tokenDoc);
    const portal2Position = Sequencer.EffectManager.getEffects({ name: nextPortalId });
    const portal1Position = Sequencer.EffectManager.getEffects({ name: portalId });
    if (inPortalRange && portal2Position.length === 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc, portal2Position[0]);
      } else {
        await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, portal2Position[0]);
      }
    } else if (inPortalRange && portal2Position.length !== 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc);
      }
      log(`${tokenDoc.name} is in front of ${portalName} but there is no destination portal!`, itemNameNormalized);
    }
  });

  log(`Create the Hook "updateToken" with ID = ${game.PrimePortalDaggerHookClientSpecificId}`, itemNameNormalized);

  //------------------------
  // V I S U A L S
  //-----------
  await helpers.replaceChatArtwork(info.itemCardId, artWorkChatTitleAnimated);

  await playVisuals(token, portal1Template, itemNameNormalized, portalId, { hue: 345, saturate: 0, brightness: 1, contrast: 1 });

  await deleteItem(actor, itemName);
}

async function secundusItemAfterActiveEffects({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemName = helpers.getItemSource(item);
  const itemNameNormalized = helpers.normalizeItemName(itemName);
  const nextItemName = 'Tertius Portal Dagger';
  const portalName = 'Secundus Portal';
  const portalId = 'Secundus-Portal';
  const nextPortalId = 'Tertius-Portal';
  const info = args[0];
  const distanceAvailable = item.system.range.long;
  const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-secundus.webp`;
  const artWorkChatTitleAnimated = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-animated-for-chat-portal-dagger-secundus.gif`;

  const abilitySelection = `<div class="dnd5e chat-card item-card midi-qol-item-card">
    <header class="card-header flexrow">
      <img src="${artWorkChatTitle}" title="${itemNameNormalized}" width="36" height="36" />
      <h3 class="item-name">${itemNameNormalized}</h3>
    </header>
    <div class="card-content">
      <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}">Do you want to enter in portal or pull the dagger and close the portal?</p>
      <br />
    </div>
    </div>`;

  // Locally because of the hook
  async function initiateDialog(tokenDoc, position) {
    await new Dialog(
      {
        title: 'Ability',
        content: abilitySelection,
        buttons: {
          button1: {
            icon: "<i class='fa-light fa-person-to-portal'></i>",
            label: 'Enter Portal',
            callback: async () => await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, position),
          },
          button2: {
            icon: "<i class='fa-light fa-dagger'></i>",
            label: 'Pull the dagger',
            callback: async () => {
              /// HOOK OFF
              Hooks.off('updateToken', game.SecundusPortalDaggerHookClientSpecificId);
              log(`Deleted the Hook "updateToken" with ID = ${game.SecundusPortalDaggerHookClientSpecificId}`, itemNameNormalized);
              delete game.SecundusPortalDaggerHookClientSpecificId;

              await Sequencer.EffectManager.endEffects({ name: portalId });
              await Sequencer.EffectManager.endEffects({ name: itemNameNormalized });
              const message = `<p>With a firm grip, you grasp the hilt of the <strong>${itemNameNormalized}</strong> and give it a sharp tug. The blade easily slides out of the wall, the portal it had opened closing in an instant. The magical bond between the dagger and yourself remains, its power still pulsing within you. You secure the blade at your side, ready to use its power again in your journey.</p>`;
              await helpers.createChatMessage(itemNameNormalized, message, itemNameNormalized, artWorkChatTitle, artWorkChatTitleAnimated);
              // Create the item in player's inventory
              const daggerItem = game.items.getName(itemName);
              await actor.createEmbeddedDocuments('Item', [daggerItem]);
              const equippedDaggerItem = actor.items.getName(itemName);
              await equippedDaggerItem?.update({ 'system.attunement': CONFIG.DND5E.attunementTypes.ATTUNED, 'system.equipped': true });
            },
          },
        },
      },
      { width: 500 }
    ).render(true);
  }

  //------------------------
  // P R E C H E C K S
  //-----------
  const portal1 = Sequencer.EffectManager.getEffects({ name: portalId });
  if (portal1.length > 0) {
    ui.notifications.warn(`${portalName} already exist!`);
    return;
  }

  //------------------------
  // M A I N
  //-----------
  const portal1Template = await warpgate.crosshairs.show(
    {
      interval: token.document.width % 2 === 0 ? 1 : -1,
      size: token.document.width,
      icon: item.img,
      label: '0 ft.',
    },
    {
      show: crosshairs => checkDistance(crosshairs, token, distanceAvailable, item.img),
    }
  );

  const crosshairsDistance = helpers.checkDistance(token, portal1Template);

  // Exit if
  if (portal1Template.cancelled || crosshairsDistance > distanceAvailable) {
    return;
  }

  const portal1Coords = { x: portal1Template.x, y: portal1Template.y };

  const collision = helpers.testCollision(token.center, portal1Coords, { type: 'move', mode: 'any' });
  if (collision) {
    ui.notifications.warn('Cannot use the dagger through walls!');
    return;
  }

  game.SecundusPortalDaggerHookClientSpecificId = Hooks.on('updateToken', async (tokenDoc, updateData) => {
    // Movement guard
    const inPortalRange = isPointInSquare(portal1Coords, tokenDoc);
    const portal2Position = Sequencer.EffectManager.getEffects({ name: nextPortalId });
    const portal1Position = Sequencer.EffectManager.getEffects({ name: portalId });
    if (inPortalRange && portal2Position.length === 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc, portal2Position[0]);
      } else {
        await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, portal2Position[0]);
      }
    } else if (inPortalRange && portal2Position.length !== 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc);
      }
      log(`${tokenDoc.name} is in front of ${portalName} but there is no destination portal!`, itemNameNormalized);
    }
  });

  log(`Create the Hook "updateToken" with ID = ${game.SecundusPortalDaggerHookClientSpecificId}`, itemNameNormalized);

  //------------------------
  // V I S U A L S
  //-----------
  await helpers.replaceChatArtwork(info.itemCardId, artWorkChatTitleAnimated);

  await playVisuals(token, portal1Template, itemNameNormalized, portalId, { brightness: 1, contrast: 1, saturate: -2 });

  await deleteItem(actor, itemName);
}

async function tertiusItemAfterActiveEffects({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemName = helpers.getItemSource(item);
  const itemNameNormalized = helpers.normalizeItemName(itemName);
  const nextItemName = 'Quartus Portal Dagger';
  const portalName = 'Tertius Portal';
  const portalId = 'Tertius-Portal';
  const nextPortalId = 'Quartus-Portal';
  const info = args[0];
  const distanceAvailable = item.system.range.long;
  const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-tertius.webp`;
  const artWorkChatTitleAnimated = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-animated-for-chat-portal-dagger-tertius.gif`;

  const abilitySelection = `<div class="dnd5e chat-card item-card midi-qol-item-card">
    <header class="card-header flexrow">
      <img src="${artWorkChatTitle}" title="${itemNameNormalized}" width="36" height="36" />
      <h3 class="item-name">${itemNameNormalized}</h3>
    </header>
    <div class="card-content">
      <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}">Do you want to enter in portal or pull the dagger and close the portal?</p>
      <br />
    </div>
    </div>`;

  // Locally because of the hook
  async function initiateDialog(tokenDoc, position) {
    await new Dialog(
      {
        title: 'Ability',
        content: abilitySelection,
        buttons: {
          button1: {
            icon: "<i class='fa-light fa-person-to-portal'></i>",
            label: 'Enter Portal',
            callback: async () => await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, position),
          },
          button2: {
            icon: "<i class='fa-light fa-dagger'></i>",
            label: 'Pull the dagger',
            callback: async () => {
              /// HOOK OFF
              Hooks.off('updateToken', game.TertiusPortalDaggerHookClientSpecificId);
              log(`Deleted the Hook "updateToken" with ID = ${game.TertiusPortalDaggerHookClientSpecificId}`, itemNameNormalized);
              delete game.TertiusPortalDaggerHookClientSpecificId;

              await Sequencer.EffectManager.endEffects({ name: portalId });
              await Sequencer.EffectManager.endEffects({ name: itemNameNormalized });
              const message = `<p>With a firm grip, you grasp the hilt of the <strong>${itemNameNormalized}</strong> and give it a sharp tug. The blade easily slides out of the wall, the portal it had opened closing in an instant. The magical bond between the dagger and yourself remains, its power still pulsing within you. You secure the blade at your side, ready to use its power again in your journey.</p>`;
              await helpers.createChatMessage(itemNameNormalized, message, itemNameNormalized, artWorkChatTitle, artWorkChatTitleAnimated);
              // Create the item in player's inventory
              const daggerItem = game.items.getName(itemName);
              await actor.createEmbeddedDocuments('Item', [daggerItem]);
              const equippedDaggerItem = actor.items.getName(itemName);
              await equippedDaggerItem?.update({ 'system.attunement': CONFIG.DND5E.attunementTypes.ATTUNED, 'system.equipped': true });
            },
          },
        },
      },
      { width: 500 }
    ).render(true);
  }

  //------------------------
  // P R E C H E C K S
  //-----------
  const portal1 = Sequencer.EffectManager.getEffects({ name: portalId });
  if (portal1.length > 0) {
    ui.notifications.warn(`${portalName} already exist!`);
    return;
  }

  //------------------------
  // M A I N
  //-----------
  const portal1Template = await warpgate.crosshairs.show(
    {
      interval: token.document.width % 2 === 0 ? 1 : -1,
      size: token.document.width,
      icon: item.img,
      label: '0 ft.',
    },
    {
      show: crosshairs => checkDistance(crosshairs, token, distanceAvailable, item.img),
    }
  );

  const crosshairsDistance = helpers.checkDistance(token, portal1Template);

  // Exit if
  if (portal1Template.cancelled || crosshairsDistance > distanceAvailable) {
    return;
  }

  const portal1Coords = { x: portal1Template.x, y: portal1Template.y };

  const collision = helpers.testCollision(token.center, portal1Coords, { type: 'move', mode: 'any' });
  if (collision) {
    ui.notifications.warn('Cannot use the dagger through walls!');
    return;
  }

  game.TertiusPortalDaggerHookClientSpecificId = Hooks.on('updateToken', async (tokenDoc, updateData) => {
    // Movement guard
    const inPortalRange = isPointInSquare(portal1Coords, tokenDoc);
    const portal2Position = Sequencer.EffectManager.getEffects({ name: nextPortalId });
    const portal1Position = Sequencer.EffectManager.getEffects({ name: portalId });
    if (inPortalRange && portal2Position.length === 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc, portal2Position[0]);
      } else {
        await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, portal2Position[0]);
      }
    } else if (inPortalRange && portal2Position.length !== 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc);
      }
      log(`${tokenDoc.name} is in front of ${portalName} but there is no destination portal!`, itemNameNormalized);
    }
  });

  log(`Create the Hook "updateToken" with ID = ${game.TertiusPortalDaggerHookClientSpecificId}`, itemNameNormalized);

  //------------------------
  // V I S U A L S
  //-----------
  await helpers.replaceChatArtwork(info.itemCardId, artWorkChatTitleAnimated);

  await playVisuals(token, portal1Template, itemNameNormalized, portalId, { brightness: 1.5, contrast: 0, saturate: 0, hue: 55 });

  await deleteItem(actor, itemName);
}

async function quartusItemAfterActiveEffects({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemName = helpers.getItemSource(item);
  const itemNameNormalized = helpers.normalizeItemName(itemName);
  const nextItemName = 'Prime Portal Dagger';
  const portalName = 'Quartus Portal';
  const portalId = 'Quartus-Portal';
  const nextPortalId = 'Prime-Portal';
  const info = args[0];
  const distanceAvailable = item.system.range.long;
  const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-quartus.webp`;
  const artWorkChatTitleAnimated = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-animated-for-chat-portal-dagger-quartus.gif`;

  const abilitySelection = `<div class="dnd5e chat-card item-card midi-qol-item-card">
    <header class="card-header flexrow">
      <img src="${artWorkChatTitle}" title="${itemNameNormalized}" width="36" height="36" />
      <h3 class="item-name">${itemNameNormalized}</h3>
    </header>
    <div class="card-content">
      <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}">Do you want to enter in portal or pull the dagger and close the portal?</p>
      <br />
    </div>
    </div>`;

  // Locally because of the hook
  async function initiateDialog(tokenDoc, position) {
    await new Dialog(
      {
        title: 'Ability',
        content: abilitySelection,
        buttons: {
          button1: {
            icon: "<i class='fa-light fa-person-to-portal'></i>",
            label: 'Enter Portal',
            callback: async () => await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, position),
          },
          button2: {
            icon: "<i class='fa-light fa-dagger'></i>",
            label: 'Pull the dagger',
            callback: async () => {
              /// HOOK OFF
              Hooks.off('updateToken', game.QuartusPortalDaggerHookClientSpecificId);
              log(`Deleted the Hook "updateToken" with ID = ${game.QuartusPortalDaggerHookClientSpecificId}`, itemNameNormalized);
              delete game.QuartusPortalDaggerHookClientSpecificId;

              await Sequencer.EffectManager.endEffects({ name: portalId });
              await Sequencer.EffectManager.endEffects({ name: itemNameNormalized });
              const message = `<p>With a firm grip, you grasp the hilt of the <strong>${itemNameNormalized}</strong> and give it a sharp tug. The blade easily slides out of the wall, the portal it had opened closing in an instant. The magical bond between the dagger and yourself remains, its power still pulsing within you. You secure the blade at your side, ready to use its power again in your journey.</p>`;
              await helpers.createChatMessage(itemNameNormalized, message, itemNameNormalized, artWorkChatTitle, artWorkChatTitleAnimated);
              // Create the item in player's inventory
              const daggerItem = game.items.getName(itemName);
              await actor.createEmbeddedDocuments('Item', [daggerItem]);
              const equippedDaggerItem = actor.items.getName(itemName);
              await equippedDaggerItem?.update({ 'system.attunement': CONFIG.DND5E.attunementTypes.ATTUNED, 'system.equipped': true });
            },
          },
        },
      },
      { width: 500 }
    ).render(true);
  }

  //------------------------
  // P R E C H E C K S
  //-----------
  const portal1 = Sequencer.EffectManager.getEffects({ name: portalId });
  if (portal1.length > 0) {
    ui.notifications.warn(`${portalName} already exist!`);
    return;
  }

  //------------------------
  // M A I N
  //-----------
  const portal1Template = await warpgate.crosshairs.show(
    {
      interval: token.document.width % 2 === 0 ? 1 : -1,
      size: token.document.width,
      icon: item.img,
      label: '0 ft.',
    },
    {
      show: crosshairs => checkDistance(crosshairs, token, distanceAvailable, item.img),
    }
  );

  const crosshairsDistance = helpers.checkDistance(token, portal1Template);

  // Exit if
  if (portal1Template.cancelled || crosshairsDistance > distanceAvailable) {
    return;
  }

  const portal1Coords = { x: portal1Template.x, y: portal1Template.y };

  const collision = helpers.testCollision(token.center, portal1Coords, { type: 'move', mode: 'any' });
  if (collision) {
    ui.notifications.warn('Cannot use the dagger through walls!');
    return;
  }

  game.QuartusPortalDaggerHookClientSpecificId = Hooks.on('updateToken', async (tokenDoc, updateData) => {
    // Movement guard
    const inPortalRange = isPointInSquare(portal1Coords, tokenDoc);
    const portal2Position = Sequencer.EffectManager.getEffects({ name: nextPortalId });
    const portal1Position = Sequencer.EffectManager.getEffects({ name: portalId });
    if (inPortalRange && portal2Position.length === 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc, portal2Position[0]);
      } else {
        await teleportToken(itemNameNormalized, nextPortalId, tokenDoc, portal2Position[0]);
      }
    } else if (inPortalRange && portal2Position.length !== 1 && portal1Position.length === 1 && (!isNaN(updateData.x) || !isNaN(updateData.y))) {
      if (tokenDoc.uuid === token.document.uuid) {
        await initiateDialog(tokenDoc);
      }
      log(`${tokenDoc.name} is in front of ${portalName} but there is no destination portal!`, itemNameNormalized);
    }
  });

  log(`Create the Hook "updateToken" with ID = ${game.QuartusPortalDaggerHookClientSpecificId}`, itemNameNormalized);

  //------------------------
  // V I S U A L S
  //-----------
  await helpers.replaceChatArtwork(info.itemCardId, artWorkChatTitleAnimated);

  await playVisuals(token, portal1Template, itemNameNormalized, portalId, { brightness: 1, contrast: 1, saturate: 0, hue: 230 });

  await deleteItem(actor, itemName);
}

export const portalDaggersFeat = {
  primeItemAAE: primeItemAfterActiveEffects,
  secundusItemAAE: secundusItemAfterActiveEffects,
  tertiusItemAAE: tertiusItemAfterActiveEffects,
  quartusItemAAE: quartusItemAfterActiveEffects,
};
