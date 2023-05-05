const orgName = "Boss Loot";
const mandatoryModules = ["midi-qol", "dae", "times-up", "tokenmagic", "sequencer", "warpgate", "dfreds-convenient-effects", "effectmacro", "socketlib", "lib-wrapper"]; // "JB2A_DnD5e", "jb2a_patreon"
const moduleMessage = [];
const bossLootLogo = "modules/boss-loot-magic-items-free/artwork/000-logo/square-logo-animated.gif";
const titleWarning = "Warning";

async function createChatMessage(summary, msg) {
  const lastItem = msg.pop();
  const listItems = msg.map((item) => `<p>${item}</p>`).join("");
  const lastItemHtml = `<hr><h3>${lastItem}</h3>`;
  const chatMessageWarning = {
    content: `
      <div class="dnd5e chat-card item-card midi-qol-item-card">
        <header class="card-header flexrow">
          <img src=${bossLootLogo} title="${titleWarning}" width="36" height="36" />
          <h3 class="item-name" style="color: #FF6969">${titleWarning} - ${summary}</h3>
        </header>
        <div class="card-content">
            ${listItems}${lastItemHtml}
        </div>
        <footer class="card-footer"><span>${orgName}</span></footer>
      </div>`,
    type: CONST.CHAT_MESSAGE_TYPES.OOC,
  };
  await ChatMessage.create(chatMessageWarning);
}

Hooks.once("ready", async function () {
  if (game.user.isGM) {
    console.log(`${orgName} | Module loaded`);

    mandatoryModules.forEach((module) => {
      const moduleObj = game.modules.get(module);
      if (moduleObj === undefined) {
        moduleMessage.push(`Module <strong>${module}</strong> NOT installed!`);
      } else if (moduleObj.active === false) {
        moduleMessage.push(`Module <strong>${module}</strong> installed but NOT active!`);
      }
    });

    // Check for JB2A_DnD5e and jb2a_patreon
    const jb2aDnd5e = game.modules.get("JB2A_DnD5e");
    const jb2aPatreon = game.modules.get("jb2a_patreon");

    if (!jb2aDnd5e && !jb2aPatreon) {
      moduleMessage.push(`At least one of the <strong>JB2A_DnD5e</strong> or <strong>jb2a_patreon</strong> modules must be installed for ${orgName} to work properly.`);
    } else if (!jb2aDnd5e?.active && !jb2aPatreon?.active) {
      moduleMessage.push(`At least one of the <strong>JB2A_DnD5e</strong> or <strong>jb2a_patreon</strong> modules must be active for ${orgName} to work properly.`);
    }

    if (moduleMessage.length > 0) {
      moduleMessage.push(
        `Only after you <strong>install and activate</strong> above modules ${orgName} will work properly!<br><br>PS: This message won't appear if everything it's ok, so if you see it please try to install/activate missing modules then delete the chat messages and restart Foundry!`
      );
      await createChatMessage("Missing Modules", moduleMessage);
    }
  }
});
