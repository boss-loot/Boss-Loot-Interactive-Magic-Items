import { bossLootSettings, MODULE_NAME, SHORT_MODULE_NAME, NAMESPACE } from './settings.js';
import { helperData as helpers } from './helperFunctions.js';
import { macros } from './macros.js';
import { items } from './items.js';
import { runAsGM } from './runAsGM.js';
import { log } from './boss-loot-log.js';
export let socket;

const mandatoryModules = [
  'midi-qol',
  'dae',
  'times-up',
  'sequencer',
  'warpgate',
  'dfreds-convenient-effects',
  'effectmacro',
  'socketlib',
  'lib-wrapper',
];
const bossLootLogo = `modules/${MODULE_NAME}/artwork/000-logo/square-logo-animated.gif`;
const titleWarning = 'Warning';
const helperGifs = ['chainweaver-bracer.gif', 'death-kiss-blade.gif', 'helm-of-the-charging-bull.gif', 'void-vortex.gif'];

Hooks.once('init', async function () {
  await bossLootSettings();
});

Hooks.once('socketlib.ready', async function () {
  socket = socketlib.registerModule(MODULE_NAME);
  socket.register('toggleTokenVisibility', runAsGM.toggleTokenVisibility);
  socket.register('deleteToken', runAsGM.deleteToken);
});

Hooks.once('ready', async function () {
  if (!game.user.isGM) {
    return;
  }
  const moduleVersion = game.modules.get(MODULE_NAME).version;
  const storedVersion = game.settings.get(MODULE_NAME, 'moduleVersion');

  if (storedVersion !== moduleVersion) {
    await game.settings.set(MODULE_NAME, 'moduleVersion', moduleVersion);
    if (MODULE_NAME === 'boss-loot-magic-items-free') {
      await game.settings.set(MODULE_NAME, 'showHelperPopup', true);
    }
  }

  if (game.settings.get(MODULE_NAME, 'checkMandatoryModules') === true) {
    await helpers.checkMandatoryModules(mandatoryModules, titleWarning, bossLootLogo);
  }
  if (game.settings.get(MODULE_NAME, 'showHelperPopup') === true) {
    await helpers.launchHelperPopup(helperGifs);
  }

  if (game.modules.get('boss-loot-magic-items-advanced')?.active) {
    console.warn(`${MODULE_NAME} | Boss Loot Advanced is active. Free version will not be initialized.`);
    return; // Exit early since the advanced module is active
  } else {
    globalThis[NAMESPACE] = {
      helpers,
      macros,
	  items,
      log,
      MODULE_NAME,
      NAMESPACE,
    };
  }

  log(`Module loaded!`, MODULE_NAME);
});
