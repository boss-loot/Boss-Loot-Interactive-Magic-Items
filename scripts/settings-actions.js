import { MODULE_NAME } from './settings.js';
import { log } from './boss-loot-log.js';

const MIDI_MIN_VER = '11.2.1';

export class ApplyBossLootMidiSettingsFormApp extends FormApplication {
  constructor() {
    super();
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['form'],
      popOut: true,
      template: `modules/${MODULE_NAME}/templates/config-form-midi.hbs`,
      id: 'apply-bossloot-settings',
      title: 'Modify Midi-QOL Settings',
      width: 500,
      closeOnSubmit: true,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    // Check if the current Midi-QOL version is greater than MIDI_MIN_VER
    const isVersionValid = foundry.utils.isNewerVersion(game.modules.get('midi-qol').version, MIDI_MIN_VER);

    // Disable the confirm button if the version check fails
    if (!isVersionValid) {
      html.find('button[name="submit"]').prop('disabled', true);
      ui.notifications.warn(`Midi-QOL version must be greater than '${MIDI_MIN_VER}'`);
    }
    // Close the form without saving when the cancel button is clicked
    html.find('button[name="cancel"]').click(ev => {
      this.close();
    });
  }

  async _updateObject(event, formData) {
    const settingsPath = `modules/${MODULE_NAME}/scripts/config/bossloot-midi-settings.json`;
    const settingsJSON = await getSettingsFromJSON(settingsPath);
    await importSettingsFromJSON(settingsJSON);
  }
}

async function getSettingsFromJSON(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Could not load settings file: ${response.statusText}`);
  }
  return response.json();
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

function mergeDeep(target, source) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

async function importSettingsFromJSON(json) {
  if (typeof json === 'string') json = JSON.parse(json);

  // Get the current config settings object
  let currentConfigSettings = duplicate(game.settings.get('midi-qol', 'ConfigSettings'));

  // Update the current config settings with the new Boss Loot recommended settings
  const newSettings = json.configSettings;
  for (const key in newSettings) {
    if (currentConfigSettings.hasOwnProperty(key)) {
      // Check for nested obj
      if (isObject(newSettings[key]) && isObject(currentConfigSettings[key])) {
        currentConfigSettings[key] = mergeDeep(currentConfigSettings[key], newSettings[key]);
      } else {
        currentConfigSettings[key] = newSettings[key];
      }
    }
  }

  // Check if 'wounded' is active in CE, and adjust settings accordingly
  const ceStatusEffectNames = game.settings.get('dfreds-convenient-effects', 'statusEffectNames');
  const ceModifyStatusEffects = game.settings.get('dfreds-convenient-effects', 'modifyStatusEffects');
  const isWoundedIncluded = ceStatusEffectNames.map(effect => effect.toLowerCase()).includes('wounded');
  if (!isWoundedIncluded || ceModifyStatusEffects === 'none') {
    log('Disabling the Wounded/Dead Overlay in Midi-QOL', 'Settings');
    currentConfigSettings.midiDeadCondition = 'none';
    currentConfigSettings.midiUnconsciousCondition = 'none';
    currentConfigSettings.addDead = 'none';
    currentConfigSettings.midiWoundedCondition = 'none';
    currentConfigSettings.addWoundedStyle = 'none';
    currentConfigSettings.addWounded = 0;
  }

  await game.settings.set('midi-qol', 'ConfigSettings', currentConfigSettings);
  await game.settings.set('midi-qol', 'EnableWorkflow', json.enableWorkflow);
  await game.settings.set('midi-qol', 'ForceHideRoll', json.forceHideRoll);
  await game.settings.set('midi-qol', 'AutoRemoveTargets', json.autoRemoveTargets);

  log('Midi-QOL Config settings updated', 'Settings');
  ui.notifications.info('Midi-QOL Settings updated!');
}
