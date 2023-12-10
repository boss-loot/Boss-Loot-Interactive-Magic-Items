import { MODULE_NAME, SHORT_MODULE_NAME } from '../settings.js';
import { helperData as helpers } from '../helperFunctions.js';

const featName = 'Vortex Arrow (Active Ability)';
const artworkFeat = `modules/${MODULE_NAME}/artwork/002-void-vortex/art-static-gravity-distortion-effect.webp`;

const vortexArrow = {
  name: featName,
  type: 'feat',
  img: artworkFeat,
  system: {
    description: {
      value: '', // TO UPDATE
      chat: '',
      unidentified: '',
    },
    source: '', // TO UPDATE
    activation: {
      type: 'action',
      cost: 1,
      condition: '',
    },
    duration: {
      value: '1',
      units: 'round',
    },
    cover: null,
    crewed: false,
    target: {
      value: 20,
      width: null,
      units: 'ft',
      type: 'radius',
    },
    range: {
      value: 150,
      long: 600,
      units: 'ft',
    },
    uses: {
      value: 1,
      max: '1',
      per: 'lr',
      recovery: '',
    },
    consume: {
      type: '',
      target: '',
      amount: null,
    },
    ability: '',
    actionType: 'save',
    attackBonus: '',
    chatFlavor: '',
    critical: {
      threshold: null,
      damage: '',
    },
    damage: {
      parts: [['6d8', 'force']],
      versatile: '',
    },
    formula: '',
    save: {
      ability: 'dex',
      dc: null,
      scaling: 'spell',
    },
    type: {
      value: '',
      subtype: '',
    },
    requirements: '',
    recharge: {
      value: null,
      charged: false,
    },
  },
  effects: [],
  flags: {
    'midi-qol': {
      fumbleThreshold: null,
      effectActivation: false,
      onUseMacroName: '', // TO UPDATE
    },
  },
};

export const voidVortexAbility = {
  vortexArrow: vortexArrow,
};
