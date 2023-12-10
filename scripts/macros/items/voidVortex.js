import { MODULE_NAME, SHORT_MODULE_NAME } from '../../settings.js';
import { helperData as helpers } from '../../helperFunctions.js';

//------------------------
// M A I N
//-----------
async function item({ speaker, actor, token, character, item, args, scope, workflow }) {
  const targets = Array.from(workflow.targets);

  for (let target of targets) {
    await new Sequence().effect().file('jb2a.arrow.physical.blue').atLocation(token).stretchTo(target).waitUntilFinished(-200).play();
  }
}

export const voidVortex = {
  item: item,
};
