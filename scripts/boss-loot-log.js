import { bossLootSettings, MODULE_NAME, SHORT_MODULE_NAME } from './settings.js';

/**
 * Logs a message to the console with a consistent format. Item name is optional.
 * @param {string} message - The message to log.
 * @param {string} [itemName] - (Optional) The name of the item related to the log message.
 * @param {string} type - The type of log ('info', 'warn', 'error').
 */
function log(message, itemName = '', type = 'info') {
  // Check the game setting before logging
  const isLoggingEnabled = game.settings.get(MODULE_NAME, 'showLog');

  if (!isLoggingEnabled) {
    return; // Do nothing if logging is disabled
  }

  const logPrefix = `${SHORT_MODULE_NAME}${itemName ? ` | ${itemName}` : ''} | `;
  switch (type) {
    case 'warn':
      console.warn(logPrefix + message);
      break;
    case 'error':
      console.error(logPrefix + message);
      break;
    case 'info':
    default:
      console.log(logPrefix + message);
      break;
  }
}

// Sample usage:
// log('This is an info message');
// log('This is a warning message', '', 'warn');
// log('This is an error message', 'HealingPotion', 'error');

export { log };
