const MODULE_NAME = 'boss-loot-assets-premium';
const allTokens = canvas.scene.tokens; // TokenDocument

if (!game.user.isGM) {
  ui.notifications.warn('You do not have permission to use this macro!');
  return;
}

if (!allTokens || allTokens.size < 1) {
  ui.notifications.warn('There are no tokens on the map!', { console: false });
  return;
}

const isSequencerActive = game.modules.get('sequencer')?.active;
const isBlfxActive = game.modules.get('boss-loot-assets-premium')?.active;
const damageTypes = CONFIG.DND5E.damageTypes;
const damageTypeOptions = Object.entries(damageTypes)
  .map(([key, dt]) => `<option value="${key}">${dt.label}</option>`)
  .join('');

let dialogContent = `
  <label><strong>Select one or multiple tokens to apply damage.</strong></label>
  <div style="display: flex; flex-direction: row; gap: 10px; margin-bottom: 10px;">
    <div style="flex: 1;">
      <label style="font-size: 0.8em;">Damage Roll (eg: 1d6+2)</label>
      <input type="text" name="blfx.damage.roll" value="" style="width: 100%;"/>
    </div>
    <div style="flex: 1;">
      <label style="font-size: 0.8em;">Damage Type</label>
      <select name="blfx.damage.type" style="width: 100%;">
        <option value=""></option>
        ${damageTypeOptions}
      </select>
    </div>
  </div>
  
  <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">`;

// Loop through tokens and add each one as a selectable checkbox.
for (const tokenDoc of allTokens.contents) {
  const actorHp = tokenDoc.actor.system.attributes.hp?.value;
  const actorMaxHp = tokenDoc.actor.system.attributes.hp?.max;
  dialogContent += `
    <div style="display: flex; align-items: center; gap: 10px;">
      <img src="${tokenDoc.actor.img}" width="48" height="48" style="border: none;">
      <label style="flex: 1;">${tokenDoc.name} <span style="margin-left: 20px;">(${actorHp} / ${actorMaxHp} HP)</span></label>
      <input type="checkbox" name="token-${tokenDoc.id}" />
    </div>
  `;
}

dialogContent += `</div>`;

let activeDialog = null;
function closeOnSceneChange() {
  if (activeDialog?.rendered) {
    console.log('Scene changed. Closing the BLFX Damage dialog.');
    activeDialog.close();
  }
}

// --------------------------------------------------------
// DIALOG
// --------------------------------------------------------
foundry.applications.api.DialogV2.wait({
  window: { title: 'BLFX Damage' },
  form: { closeOnSubmit: false },
  content: dialogContent,
  position: { width: 450 },
  rejectClose: false,

  buttons: [
    {
      action: 'submit',
      label: 'Submit',
      default: true,
      callback: async (event, button, dialogElement) => {
        const data = new FormDataExtended(button.form).object;
        // Validate data
        if (validateData(data)) {
          await applyDamage(data);
        }
      },
    },
  ],

  render: (event, dialogElement) => {
    activeDialog = event.target;
    Hooks.on('canvasReady', closeOnSceneChange);
  },

  close: (event, dialogInstance) => {
    Hooks.off('canvasReady', closeOnSceneChange);
  },
});

function validateData(data) {
  const rollDice = data['blfx.damage.roll'].trim();
  if (!rollDice) {
    ui.notifications.warn('Damage Roll cannot be empty!', { console: false });
    return false;
  }

  // Validate the roll
  if (!CONFIG.Dice.DamageRoll.validate(rollDice)) {
    ui.notifications.warn('Enter a valid roll!', { console: false });
    return false;
  }

  if (!data['blfx.damage.type'].trim()) {
    ui.notifications.warn('Damage Type must be selected!', { console: false });
    return false;
  }

  const tokenSelected = Object.keys(data).some(key => key.startsWith('token-') && data[key] === true);
  if (!tokenSelected) {
    ui.notifications.warn('At least one token must be selected!', { console: false });
    return false;
  }

  return true;
}

async function playAnimation(tokenDoc) {
  if (isSequencerActive && isBlfxActive) {
    await new Sequence()
      .effect()
      .file('blfx.spell.template.circle.wave2.blood1.splatter.red')
      .atLocation(tokenDoc)
      .timeRange(0, 450)
      .fadeOut(350)
      .randomRotation()
      .scale(0.25)
      .play();
  }
}

async function applyDamage(data) {
  rollFormula = data['blfx.damage.roll'].trim();
  rollDamageType = data['blfx.damage.type'].trim();

  const roll = await new CONFIG.Dice.DamageRoll(rollFormula, {}, { type: rollDamageType }).evaluate();
  const selectedTokensIds = Object.entries(data)
    .filter(([key, checked]) => key.startsWith('token-') && checked === true)
    .map(([id, _]) => id.replace(/^token-/, ''));

  for (const id of selectedTokensIds) {
    const tokenDoc = await allTokens.get(id);
    await roll.toMessage({
      flavor: `<p> ${tokenDoc.name} takes ${rollFormula} ${rollDamageType} damage!</p>`,
      speaker: ChatMessage.getSpeaker({ actor: tokenDoc.actor }),
    });
    await tokenDoc.actor.applyDamage([{ type: rollDamageType, value: roll.total }]);
    await playAnimation(tokenDoc);
  }
}
