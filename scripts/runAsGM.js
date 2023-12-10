import { MODULE_NAME, SHORT_MODULE_NAME } from './settings.js';
import { helperData as helpers } from './helperFunctions.js';

async function toggleTokenVisibility(data) {
  const token = await fromUuid(data.tokenUuid);
  if (token) {
    // token will be a token document.
    await token.update({ hidden: data.hidden });
  }
}

async function deleteToken(data) {
  const token = await fromUuid(data.tokenUuid);
  if (token) {
    // token will be a token document.
    await token.delete();
  }
}

export let runAsGM = {
  toggleTokenVisibility: toggleTokenVisibility,
  deleteToken: deleteToken,
};
