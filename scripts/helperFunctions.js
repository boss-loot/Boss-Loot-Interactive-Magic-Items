import { MODULE_NAME, SHORT_MODULE_NAME } from './settings.js';
import { log } from './boss-loot-log.js';

export const helperData = {
  replaceChatArtwork: async function _replaceChatArtwork(id, pic) {
    const chatMessage = game.messages.get(id);
    const chatMessageContent = chatMessage.content;
    const htmlArtwork = `<img src="${pic}" width="272" height="272"/>`;
    const parser = new DOMParser();
    const doc = parser.parseFromString(chatMessageContent, 'text/html');
    const cardContent = doc.querySelector('.card-content');
    const existingImage = cardContent.querySelector('img');

    // Replace the existing image with the new image
    if (existingImage) {
      existingImage.src = pic;
    } else {
      cardContent.insertAdjacentHTML('beforeend', htmlArtwork);
    }

    const result = doc.documentElement.outerHTML;
    chatMessage.content = result;
    await chatMessage.update({ content: result });
    await ui.chat.scrollBottom();
  },
  randomInt: function _randomInt(min, max) {
    return min + Math.round(Math.random() * (max - min));
  },
  pressChatButton: async function _pressChatButton(messageId, actionButton) {
    const chatMessageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    const chatMessageButton = chatMessageElement?.querySelector(`[data-action=${actionButton}]`);

    chatMessageButton?.click();
  },
  disableChatButton: async function _disableChatButton(messageId, actionButton) {
    const chatMessageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    const chatMessageButton = chatMessageElement?.querySelector(`[data-action=${actionButton}]`);

    if (!chatMessageButton) return;

    chatMessageButton.setAttribute('disabled', '');
    const chatMessage = game.messages.get(messageId);
    await chatMessage.update({ content: chatMessageElement.outerHTML });
  },
  checkDistance: function _checkDistance(obj1, obj2) {
    if (obj1 === undefined || obj2 === undefined) {
      return undefined;
    }

    const obj1Center = obj1.center ?? { x: obj1.x, y: obj1.y };
    const obj2Center = obj2.center ?? { x: obj2.x, y: obj2.y };

    if (obj1Center.x === undefined || obj1Center.y === undefined || obj2Center.x === undefined || obj2Center.y === undefined) {
      return undefined;
    }

    const ray = new Ray({ x: obj1Center.x, y: obj1Center.y }, { x: obj2Center.x, y: obj2Center.y });
    const [distanceFeet] = canvas.grid.measureDistances([{ ray }], { gridSpaces: true });

    return distanceFeet;
  },
  /**
   * Creates a chat message with given parameters in Foundry VTT.
   *
   * @param {string} title - The title of the chat message. Displayed as the header in the chat card and as the title of the artwork.
   * @param {(string|string[])} msg - The content of the chat message. If it is an array of strings, they will be joined together. Each string should contain HTML tags for formatting.
   * @param {(string|string[])} footer - The footer of the chat message. If it is an array of strings, each element will be enclosed in a `<span>` tag.
   * @param {string} titleImg - The URL of the image displayed in the header of the chat card.
   * @param {string} [artImg=''] - The URL of the artwork image displayed in the content of the chat card. This parameter is optional and defaults to an empty string.
   * @param {number} [msgType=CONST.CHAT_MESSAGE_TYPES.OOC] - The type of the chat message. This parameter is optional and defaults to OOC (Out Of Character) type.
   * @returns {Promise<void>} - A Promise that resolves when the chat message is successfully created.
   */
  createChatMessage: async function _createChatMessage(title, msg, footer, titleImg, artImg = '', msgType = CONST.CHAT_MESSAGE_TYPES.OOC) {
    // Convert messages and footers to HTML strings if they are arrays
    const messageContent = Array.isArray(msg) ? msg.join('') : msg;
    const footerContent = Array.isArray(footer) ? footer.map(foot => `<span>${foot}</span>`).join(' ') : `<span>${footer}</span>`;

    // Prepare the data to be injected into the template
    const templateData = {
      title: title,
      messageContent: messageContent,
      footerContent: footerContent,
      titleImg: titleImg,
      artImg: artImg,
    };

    // Render the external template
    const chatMessageTemplate = await renderTemplate(`modules/${MODULE_NAME}/templates/chat-message.hbs`, templateData);

    const chatOptions = {
      content: chatMessageTemplate,
      type: msgType,
    };
    await ChatMessage.create(chatOptions);
  },
  launchHelperPopup: async function _launchHelperPopup(imagePool) {
    const randomgif = helperData.randomInt(0, imagePool.length - 1);
    const popupImage = `modules/${MODULE_NAME}/artwork/000-logo/square-logo.png`;
    const gifDemo = `modules/${MODULE_NAME}/artwork/000-logo/${imagePool[randomgif]}`;
    const storedVersion = game.settings.get(MODULE_NAME, 'moduleVersion');
    let patreonLine = '';
    if (MODULE_NAME === 'boss-loot-magic-items-free') {
      patreonLine =
        '<p>Want even more unique items? Support us on <a href="https://www.patreon.com/BossLoot" target="_blank">Patreon</a> to unlock exclusive loot!</p>';
    }

    const templateData = {
      moduleVersion: storedVersion,
      popupImage: popupImage,
      gifDemo: gifDemo,
      patreonLine: patreonLine,
    };

    // Render the external template
    const dialogBoxTemplate = await renderTemplate(`modules/${MODULE_NAME}/templates/helper-popup.hbs`, templateData);

    const dialog = new Dialog(
      {
        title: 'Module Helper',
        content: dialogBoxTemplate,
        buttons: {},
        render: () => {
          const checkbox = dialog.element.find('#bossLootHelperPopup');

          checkbox.change(async () => {
            if (checkbox[0].checked) {
              log('Changing Helper pop-up to disabled!');
              await game.settings.set(MODULE_NAME, 'showHelperPopup', false);
            } else {
              log('Changing Helper pop-up to enabled!');
              await game.settings.set(MODULE_NAME, 'showHelperPopup', true);
            }
          });
        },
      },
      { width: '800px', height: '450px' }
    );

    await dialog.render(true);
  },
  missingModulesCustomMessage: async function _missingModulesCustomMessage(messageLevel, summary, msg, logo) {
    const lastItem = msg.pop();
    const listItems = msg.map(item => (item.includes('<h2>') ? `${item}` : `<p>${item}</p>`)).join('');
    const lastItemHtml = `<h2>Actions:</h2><h3>${lastItem}</h3>`;

    // Render the template with the provided data
    const missingModuleTemplate = await renderTemplate(`modules/${MODULE_NAME}/templates/missing-modules-message.hbs`, {
      messageLevel: messageLevel,
      summary: summary,
      listItems: listItems,
      lastItemHtml: lastItemHtml,
      logo: logo,
      moduleName: SHORT_MODULE_NAME,
    });

    const chatMessageWarning = {
      content: missingModuleTemplate,
      type: CONST.CHAT_MESSAGE_TYPES.OOC,
    };
    await ChatMessage.create(chatMessageWarning);
  },

  checkModule: function _checkModule(module) {
    const moduleObj = game.modules.get(module);
    if (moduleObj === undefined) {
      return `Module <strong>${module}</strong> NOT installed!`;
    } else if (moduleObj.active === false) {
      return `Module <strong>${module}</strong> installed but it is not currently active!`;
    }
    return undefined;
  },
  checkMandatoryModules: async function _checkMandatoryModules(mandatoryModules, messageLevel, logo) {
    let moduleMessage = mandatoryModules.reduce((result, module) => {
      let message = helperData.checkModule(module);
      if (message) result.push(message);
      return result;
    }, []);

    // Check for JB2A_DnD5e and jb2a_patreon
    const jb2aModules = ['JB2A_DnD5e', 'jb2a_patreon'];
    const activeJb2a = jb2aModules.some(module => game.modules.get(module)?.active);

    if (!activeJb2a) {
      moduleMessage.push(`At least one of the <strong>JB2A_DnD5e</strong> or <strong>jb2a_patreon</strong> modules must be installed and active!.`);
    }

    if (moduleMessage.length > 0) {
      moduleMessage.unshift('<h2>Modules</h2>');
      moduleMessage.push(
        `Only after you <strong>install and activate</strong> the above modules ${SHORT_MODULE_NAME} will work properly!<br><br>PS: This message won't appear if everything is ok, so if you see it please try to install/activate missing modules then delete the chat messages and restart Foundry!`
      );
      await helperData.missingModulesCustomMessage(messageLevel, 'Missing Modules', moduleMessage, logo);
    }
  },
  getFunctionBody: function _getFunctionBody(func) {
    const funcAsString = func.toString();
    return funcAsString.slice(funcAsString.indexOf('{') + 1, funcAsString.lastIndexOf('}'));
  },
  /**
   * This function normalizes a string by removing a version number, if present, from the end.
   * Version numbers are expected to be prefixed with 'v' or 'V', followed by one or more digits.
   *
   * @param {string} inputString - The string to normalize.
   * @returns {string} - The input string with the version number removed, or the original string
   * if no version number was found.
   *
   */
  normalizeItemName: function _normalizeItemName(inputString) {
    return inputString.replace(/ v\d+$/i, '');
  },
  /**
   * This function hides a specified element in a Foundry VTT chat message.
   * The chat message and the element to hide are identified by their ID and class name respectively.
   * A new 'hidden' class is added to the specified element to hide it.
   *
   * @param {string} cardId - The ID of the chat message.
   * @param {string} className - The class name of the element to hide.
   *
   * @returns {Promise} - A promise that resolves when the chat message content has been updated.
   */
  hideDivFromChatMessage: async function _hideDivFromChatMessage(cardId, className) {
    const chatMessage = game.messages.get(cardId);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = chatMessage.content;

    const elementToHide = tempDiv.querySelector(className);
    // Check if element to hide exists
    if (!elementToHide) {
      log(`Element with class "${className}" not found in ChatMessage with id [${cardId}]`, '', 'error');
      return;
    }

    elementToHide.classList.add('hidden');

    log(`Class hidden added near to "${className}" in ChatMessage with id [${cardId}]`);
    await chatMessage.update({ content: tempDiv.innerHTML });
  },
  /**
   * This function checks if two objects are colliding.
   *
   * @param orig The original object, which must be a Point object.
   * @param dest The destination object, which must be a Point object.
   * @param options The collision options.
   * @return True if the objects are colliding, false otherwise.
   */
  testCollision: function _testCollision(orig, dest, options) {
    if (!orig || !dest || !orig.x || !orig.y || !dest.x || !dest.y || !options) {
      log('Incorrect use of testCollision', '', 'error');
      return null;
    }
    return CONFIG.Canvas.polygonBackends.move.testCollision(orig, dest, options);
  },
  /**
   * Asynchronously pauses the execution for a specified number of milliseconds, then resolves the returned Promise.
   *
   * @param {number} ms - The number of milliseconds to pause execution for.
   * @return {Promise<void>} A Promise that resolves after the specified delay.
   *
   * @example
   * await _wait(1000);  // Pauses execution for 1000 milliseconds
   */
  wait: async function _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  /**
   * Converts a given function to its string representation and wraps it in an Immediately-Invoked Function Expression (IIFE).
   *
   * @param {Function} input - The function to be converted.
   * @return {string} A string that represents the IIFE of the input function.
   *
   */
  functionToString: function _functiongToString(input) {
    return `(${input.toString()})()`;
  },
  /**
   * Extracts the inner HTML content from a specified section within a larger HTML string, identified by a unique ID.
   * If the specified ID does not exist within the HTML string, an empty string is returned.
   *
   * @param {string} htmlString - The full HTML content from which the inner HTML is to be extracted.
   * @param {string} sectionId - The unique identifier of the section whose content is to be extracted.
   * @return {string} The inner HTML of the identified section, or an empty string if the ID is not found.
   *
   */

  extractInnerHTMLById: function _extractInnerHTMLById(htmlString, id) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const section = doc.querySelector(`section#${id}`);

    return section ? section.innerHTML : '';
  },

  /**
   * Retrieves the source of an item from its data object.
   *
   * @param {object} item - The item object from which the source information is to be retrieved.
   * @return {string} The source of the item as a string, or an empty string if the source information is not available.
   *
   */

  getItemSource: function _getItemSource(item5e) {
    if (typeof item5e.system.source === 'string') {
      return item5e.system.source;
    }
    return item5e.system.source.custom;
  },
};
