import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';
import { tornadoTakedownItem, thunderstormOfMiseryItem } from '../../items/stormforgerAbilities.js';
import { log } from '../../boss-loot-log.js';

//------------------------
// F U N C T I O N S
//-----------
async function tornadoVisual(sourceToken) {
  //Tornado
  await new Sequence()
    .effect()
    .name('Aerial-Ascension')
    .file('jb2a.whirlwind.bluegrey')
    .scale(0.6)
    .atLocation(sourceToken)
    .attachTo(sourceToken, { bindAlpha: false, followRotation: false })
    .opacity(0.6)
    .persist()
    .zIndex(1)
    .play();

  //Turn Token invisible
  await new Sequence()
    .animation()
    .on(sourceToken)
    .opacity(0)
    //MAKE A FAKE TOKEN AND ANIMATE IT
    .effect()
    .name('Aerial-Ascension')
    .from(sourceToken)
    .attachTo(sourceToken, { bindAlpha: false })
    .loopProperty('spriteContainer', 'position.x', {
      values: [0, 25, -25, 0],
      duration: 10000,
      pingPong: true,
    })
    .loopProperty('spriteContainer', 'position.y', {
      values: [0, -5, 5, -10, 10],
      duration: 1500,
      pingPong: true,
      ease: 'easeInOutSine',
    })
    .persist()
    .zIndex(2)
    .play();

  //FAKE TOKEN SHADOW ANIMATION
  await new Sequence()
    .effect()
    .name('Aerial-Ascension')
    .from(sourceToken)
    .attachTo(sourceToken, { bindAlpha: false })
    .opacity(0.8)
    .scale(0.9)
    .anchor({ x: 0.4, y: 0.1 })
    .filter('ColorMatrix', { brightness: -1 })
    .filter('Blur', { blurX: 5, blurY: 10 })
    .loopProperty('spriteContainer', 'position.x', {
      values: [0, 25, -25, 0],
      duration: 10000,
      pingPong: true,
    })
    .loopProperty('spriteContainer', 'position.y', {
      values: [0, -5, 5, -10, 10],
      duration: 1500,
      pingPong: true,
      ease: 'easeInOutSine',
    })
    .persist()
    .belowTokens()
    .zIndex(0)
    .play();
}

//------------------------
// M A I N
//-----------
async function item({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemName = helpers.normalizeItemName(item.name);
  const aerialAscensionName = 'Aerial Ascension';
  const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/005-stormforger/art-static-stormforger-staff.webp`;

  //------------------------
  // L O C A L     F U N C T I O N S
  //-----------
  async function consumeCharge(n) {
    const usesCount = item.system.uses.value;
    const newUses = usesCount - n;
    if (newUses < 0) return false;

    log(`Updating charges from ${usesCount} to ${newUses}`, itemName);
    await item.update({ 'system.uses.value': newUses });

    if (newUses === 0) await addRandomCharge();
    return true;
  }

  async function addRandomCharge() {
    const flavorText = '<p>If you expend the last charge, roll a d20. On a 20, the staff regains 2d4 + 2 charges.</p>';
    const roll1 = new Roll('1d20').evaluate({ async: false });
    const chatForZeroCharges = await roll1.toMessage({
      flavor: flavorText,
      speaker: ChatMessage.getSpeaker({ actor: actor }),
    });

    // Add some charges
    if (roll1.total === 20) {
      const roll2 = new Roll('2d4 + 2').evaluate({ async: false });
      await item.update({ 'system.uses.value': roll2.total });
      await game.messages
        .get(chatForZeroCharges.id)
        .update({ flavor: `${flavorText}<p style="color: #E94560;">You regained ${roll2.total} charges.</p>`, rolls: [JSON.stringify(roll1), JSON.stringify(roll2)] });
    }
  }

  async function useTornadoTakedown() {
    const remainingCharges = await consumeCharge(2);
    if (!remainingCharges) {
      ui.notifications.warn(`Not enough charges to use ${tornadoTakedownItem.name}`);
      return;
    }
    // Check if item already exist
    let newItem = actor.items.getName(tornadoTakedownItem.name);

    if (!newItem) {
      // Create new Item5e
      log(`Creating new item ${tornadoTakedownItem.name}`, itemName);
      await actor.createEmbeddedDocuments('Item', [tornadoTakedownItem]);
      newItem = actor.items.getName(tornadoTakedownItem.name);
    }

    await newItem.use({}, { configureDialog: false });
  }

  async function useAerialAscension() {
    if (aerialAscensionAnimation.length > 0) {
      await Sequencer.EffectManager.endEffects({ name: 'Aerial-Ascension' });

      //Turn Token visible
      await new Sequence().animation().on(token).opacity(1).play();

      await token.document.update({ elevation: 0 });
    } else {
      const remainingCharges = await consumeCharge(5);
      if (!remainingCharges) {
        ui.notifications.warn(`Not enough charges to use ${aerialAscensionName}`);
        return;
      }
      await token.document.update({ elevation: token.document.elevation + 30 });
      await tornadoVisual(token);
    }
  }

  async function useThunderstormOfMisery() {
    const remainingCharges = await consumeCharge(9);
    if (!remainingCharges) {
      ui.notifications.warn(`Not enough charges to use ${thunderstormOfMiseryItem.name}`);
      return;
    }
    // Check if item already exist
    let newItem = actor.items.getName(thunderstormOfMiseryItem.name);

    if (!newItem) {
      // Create new Item5e
      log(`Creating new item ${thunderstormOfMiseryItem.name}`, itemName);
      await actor.createEmbeddedDocuments('Item', [thunderstormOfMiseryItem]);
      newItem = actor.items.getName(thunderstormOfMiseryItem.name);
    }

    await newItem.use({}, { configureDialog: false });
  }

  //------------------------
  // A B I L I T Y     I N I T
  //-----------
  tornadoTakedownItem.system.source = item.uuid;
  tornadoTakedownItem.effects[0].origin = item.uuid;
  tornadoTakedownItem.flags['midi-qol'].onUseMacroName = '[postActiveEffects]function.bossLoot.macros.stormforger.tornadoItem';

  thunderstormOfMiseryItem.system.source = item.uuid;
  thunderstormOfMiseryItem.effects[0].origin = item.uuid;
  thunderstormOfMiseryItem.flags['midi-qol'].onUseMacroName = '[templatePlaced]function.bossLoot.macros.stormforger.thunderstormItem';

  if (!game.combat?.active) {
    tornadoTakedownItem.effects[0].duration.rounds = null;
    tornadoTakedownItem.effects[0].duration.seconds = 6;
    thunderstormOfMiseryItem.effects[0].duration.rounds = null;
    thunderstormOfMiseryItem.effects[0].duration.seconds = 60;
  }

  //------------------------
  // A B I L I T Y     S E L E C T I O N
  //-----------
  foundry.utils.setProperty(workflow.config, 'consumeUsage', false);

  if (item.system.attunement !== CONFIG.DND5E.attunementTypes.ATTUNED || item.system.equipped === false) {
    ui.notifications.warn(`Item "${item.name}" needs to be <strong>equipped</strong> and <strong>attuned</strong> before use!`);
    return;
  }

  const aerialAscensionAnimation = Sequencer.EffectManager.getEffects({ name: 'Aerial-Ascension' });
  const aerialAscensionText =
    aerialAscensionAnimation.length === 0 ? `Use ${aerialAscensionName} to rise (expending 5 charges)` : `Use ${aerialAscensionName} to descend (expending 0 charges)`;
  const abilitySelection = `<div class="dnd5e chat-card item-card midi-qol-item-card">
    <header class="card-header flexrow">
      <img src="${artWorkChatTitle}" title="${itemName}" width="36" height="36" />
      <h3 class="item-name">${itemName}</h3>
    </header>
    <div class="card-content">
      <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}">1. Ranged Spell Attack: Use ${tornadoTakedownItem.name} (expending 2 charges)</p>
      <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}">2. ${aerialAscensionText}</p>
      <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}">3. Use ${thunderstormOfMiseryItem.name} (expending 9 charges)</p>
      <br />
      <p style="font-family: Arial; font-weight: ${CONST.FONT_WEIGHTS.Bold}; font-size: large;"><strong>Choose wisely:</strong></p>
    </div>
    </div>`;

  await new Dialog(
    {
      title: 'Ability',
      content: abilitySelection,
      buttons: {
        button1: {
          icon: "<i class='fa-light fa-tornado'></i>",
          label: 'Tornado Takedown',
          callback: async () => await useTornadoTakedown(),
        },
        button2: {
          icon: "<i class='fa-light fa-hat-witch'></i>",
          label: 'Aerial Ascension',
          callback: async () => await useAerialAscension(),
        },
        button3: {
          icon: "<i class='fa-light fa-cloud-bolt'></i>",
          label: 'Thunderstorm of Misery',
          callback: async () => await useThunderstormOfMisery(),
        },
      },
    },
    { width: 500 }
  ).render(true);
}

async function tornadoItem({ speaker, actor, token, character, item, args, scope, workflow }) {
  const info = args[0];

  const targetTemplate = { x: info.workflow.templateData.x, y: info.workflow.templateData.y }; // Delete the Template
  await canvas.scene.deleteEmbeddedDocuments('MeasuredTemplate', [info.templateId]);

  const targetToken = info.failedSaves.length !== 0 ? info.failedSaves[0] : null;

  await new Sequence()
    .effect()
    .file('jb2a.whirlwind.bluegrey')
    .atLocation(token)
    .moveTowards(targetTemplate, { ease: 'easeOutSine' })
    .moveSpeed(300)
    .scaleIn(0, 1000, { ease: 'easeOutSine' })
    .loopProperty('sprite', 'position.y', { values: [25, -25], duration: 3000, pingPong: true, ease: 'easeInOutSine' })
    .randomizeMirrorX()
    .scaleToObject(2)
    .waitUntilFinished()
    .play();

  if (targetToken && info.failedSaves.length > 0) {
    await new Sequence()
      .effect()
      .name('Tornado-Takedown')
      .file('jb2a.whirlwind.bluegrey')
      .atLocation(targetToken)
      .loopProperty('sprite', 'position.y', { values: [25, -25], duration: 3000, pingPong: true, ease: 'easeInOutSine' })
      .randomizeMirrorX()
      .scaleToObject(2)
      .persist(true)
      .play();
  }
}

async function thunderstormItem({ speaker, actor, token, character, item, args, scope, workflow }) {
  new Sequence()
    .effect()
    .name('Thunderstorm-of-Misery')
    .file('jb2a.call_lightning.low_res.blueorange')
    .atLocation(token)
    .aboveLighting()
    .scale(2.3)
    .opacity(0.9)
    .fadeIn(3000)
    .fadeOut(400, { ease: 'easeOutCirc', delay: 2000 })
    .persist()
    .play();
}

export const stormforger = {
  item: item,
  tornadoItem: tornadoItem,
  thunderstormItem: thunderstormItem,
};
