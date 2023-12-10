import { ApplyBossLootMidiSettingsFormApp } from './settings-actions.js';

export const MODULE_NAME = 'boss-loot-magic-items-free';
export const SHORT_MODULE_NAME = 'Boss Loot';
export const NAMESPACE = 'bossLoot';

export async function bossLootSettings() {
  game.settings.register(MODULE_NAME, 'moduleVersion', {
    name: 'Module Version',
    hint: 'Used to track the version of the module for update purposes.',
    scope: 'world',
    config: false,
    type: String,
    default: '',
  });
  game.settings.registerMenu(MODULE_NAME, 'applyBossLootSettings', {
    name: 'Optimize Midi-QoL Settings for Boss Loot',
    label: 'Optimize Settings',
    hint: 'This will adjust various Midi-QoL module settings to ensure the best possible experience with Boss Loot content. Recommended for first-time setup.',
    icon: 'fas fa-magic',
    type: ApplyBossLootMidiSettingsFormApp,
    restricted: true, // Restricts this setting to GMs only
  });
  game.settings.register(MODULE_NAME, 'showLog', {
    name: 'Show Console Log',
    hint: 'If enabled, various operational messages, warnings, and errors will be displayed in the console, which can be useful for debugging or monitoring module behavior.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_NAME, 'showHelperPopup', {
    name: 'Show Helper Pop Up',
    hint: 'If Enabled, you will see the info helper popup at the game start.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
  game.settings.register(MODULE_NAME, 'checkMandatoryModules', {
    name: 'Check mandatory modules',
    hint: 'If Enabled, there will be an automatically check of the mandatory modules, results will be shown in the chat.',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true,
  });
}
