import { MODULE_NAME, SHORT_MODULE_NAME } from "../../settings.js";
import { helperData as helpers } from "../../helperFunctions.js";
import { log } from "../../boss-loot-log.js";

//------------------------
// L O C A L    F U N C T I O N S
//-----------
async function pushToken(targetToken, newLocation) {
  await new Sequence().animation().on(targetToken).fadeIn(500).moveSpeed(5).moveTowards(newLocation, { duration: 1, ease: "easeOutQuint", delay: 0, offset: 0 }).play();
}

async function hammerHit(sourceToken, targetToken) {
  await new Sequence()
    .effect()
    .file("jb2a.side_impact.part.shockwave.blue")
    .atLocation(targetToken)
    .attachTo(sourceToken, { followRotation: false })
    .rotateTowards(targetToken, { attachTo: true })
    .scale(0.3)
    .delay(-7000)

    .effect()
    .file("jb2a.impact.006.yellow")
    .atLocation(targetToken)
    .scaleToObject(2)
    .delay(0)
    .waitUntilFinished(-2000)

    .effect()
    .file("jb2a.impact.ground_crack.orange.01")
    .filter("ColorMatrix", { brightness: 1, contrast: 0 })
    .template({ gridSize: 200, startPoint: 200, endPoint: 200 })
    .atLocation(targetToken)
    .scaleToObject(2)
    .delay(10)
    .fadeOut(1000)
    .belowTokens()

    .play();
}

async function itemAfterActiveEffects({ speaker, actor, token, character, item, args, scope, workflow }) {
  const itemNameNormalized = helpers.normalizeItemName(item.name);
  const strLimit = 16;
  const abilityName = "Destabilizing Attack";
  const permittedSize = ["tiny", "sm", "med", "lg"];
  const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/007-destabilizator/art-static-destabilizator.webp`;
  const artWorkChatCardAnimated = `modules/${MODULE_NAME}/artwork/007-destabilizator/art-animated-for-chat-destabilizator.gif`;

  const info = args[0];
  const actorStr = actor.system.abilities.str.value;

  //------------------------
  // Pre-Checks
  //-----------
  if (info.targets.length === 0 || info.targetUuids.length === 0) {
    log("No target to hit", itemNameNormalized);
    return;
  }

  if (info.workflow.hitTargets.size === 0) {
    log("Misses target", itemNameNormalized);
    return;
  }

  if (info.failedSaveUuids.length === 0) {
    log("Saving throw succeded", itemNameNormalized);
  }

  if (info.item.system.attunement !== CONFIG.DND5E.attunementTypes.ATTUNED) {
    ui.notifications.warn(`You cannot use <strong>${abilityName}</strong> without attunement!`);
    return;
  }

  if (actorStr < strLimit) {
    ui.notifications.warn(`You don't have enough STR to use <strong>${abilityName}!</strong>`);
    return;
  }

  if (item.system.rarity === "uncommon") {
    // Remove 'large' from the list of permitted sizes for uncommon items
    permittedSize.pop();
    log("Remove 'large' from the list of permitted sizes for uncommon item!", itemNameNormalized);
  }

  //------------------------
  // M A I N
  //-----------
  const [target] = info.targets; // TokenDocument5e
  const targetSize = target.actor.system?.traits?.size;
  let messageBot;

  if (!permittedSize.includes(targetSize.toLowerCase())) {
    messageBot = "<p>You swing with all your might, but the target's colossal size is too much for even your warhammer's power!</p>";
    await helpers.createChatMessage("Failed", messageBot, abilityName, artWorkChatTitle, artWorkChatCardAnimated);
    await hammerHit(token, target);
    return;
  }

  if (info.failedSaveUuids.length === 0) {
    messageBot = "<p>With a swift maneuver, the target withstands your hammer's blow, staying steadfast against your attempt to push them back!</p>";
    await helpers.createChatMessage("Failed", messageBot, abilityName, artWorkChatTitle, artWorkChatCardAnimated);
    await hammerHit(token, target);
    return;
  }

  // Movement
  const gridSize = canvas.scene.grid.size; // 100 pixels
  const targetSizeMultiplier = target.width || 1; // Assume the default size multiplier is 1

  // Coordinates
  const myTokenCenter = { x: token.center.x, y: token.center.y }; // point (x,y)
  const targetCenterPos = { x: target.x + Math.floor(gridSize / 2), y: target.y + Math.floor(gridSize / 2) }; // center of top left square point (x,y)

  // Determine target new position
  const ray = new Ray(myTokenCenter, targetCenterPos);
  const ppdX = ray.dx === 0 ? 0 : (ray.dx / Math.abs(ray.dx)) * gridSize; // pushed pixel distance X
  const ppdY = ray.dy === 0 ? 0 : (ray.dy / Math.abs(ray.dy)) * gridSize; // pushed pixel distance Y

  const targetNewPossiblePos = [{ x: targetCenterPos.x + ppdX, y: targetCenterPos.y + ppdY }];
  if (ray.slope && isFinite(ray.slope)) {
    targetNewPossiblePos.push({ x: targetCenterPos.x + ppdX, y: targetCenterPos.y });
    targetNewPossiblePos.push({ x: targetCenterPos.x, y: targetCenterPos.y + ppdY });
  }

  let targetNewPos = {};

  // Check collision in all possible positions
  for (let i = 0; i < targetNewPossiblePos.length; i++) {
    let isCollision = false;

    if (targetSizeMultiplier <= 1) {
      // For 1x1 tokens or smaller
      const collision = helpers.testCollision(targetCenterPos, targetNewPossiblePos[i], { type: "move", mode: "any" });
      isCollision = collision;
    } else {
      // For larger than 1x1 tokens
      // check for all squares occupied by the token
      for (let dx = 0; dx < targetSizeMultiplier; dx++) {
        for (let dy = 0; dy < targetSizeMultiplier; dy++) {
          const potentialPos = {
            x: targetNewPossiblePos[i].x + dx * gridSize,
            y: targetNewPossiblePos[i].y + dy * gridSize,
          };
          const collision = helpers.testCollision(targetCenterPos, potentialPos, { type: "move", mode: "any" });

          if (collision) {
            isCollision = true;
            break;
          }
        }

        if (isCollision) {
          break;
        }
      }
    }

    if (!isCollision) {
      // Normalize the token pos
      targetNewPos = {
        x: targetNewPossiblePos[i].x - Math.floor(gridSize / 2),
        y: targetNewPossiblePos[i].y - Math.floor(gridSize / 2),
      };
      break;
    }
  }

  // Check for success
  const pushTarget = Object.keys(targetNewPos).length > 0;
  const messageTop = pushTarget ? "Success" : "Failed";

  if (pushTarget) {
    messageBot = "<p>The force of your swing sends the target flying back 5 feet!</p>";
  } else {
    messageBot = "<p>The surroundings block the force of your blow, preventing you from pushing the target away.</p>";
  }

  await helpers.createChatMessage(messageTop, messageBot, abilityName, artWorkChatTitle, artWorkChatCardAnimated);

  await hammerHit(token, target);

  if (pushTarget) {
    await pushToken(target, targetNewPos);
  }
}

export const destabilizator = {
  itemAAE: itemAfterActiveEffects,
};
