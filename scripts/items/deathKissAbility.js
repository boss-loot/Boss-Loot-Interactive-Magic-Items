import { MODULE_NAME, SHORT_MODULE_NAME } from '../settings.js';
import { helperData as helpers } from '../helperFunctions.js';

const featName = 'Death Kiss Attack (Active Ability)';
const artWorkChatTitle = `modules/${MODULE_NAME}/artwork/009-death-kiss-blade/art-static-for-death-kiss-attack.webp`;

const deathKissAttack = {
  name: featName,
  type: 'feat',
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
      units: 'turn',
    },
    target: {
      value: 20,
      width: null,
      units: 'ft',
      type: 'enemy',
    },
    range: {
      value: null,
      long: null,
      units: 'spec',
    },
    uses: {
      value: 2,
      max: '2',
      per: 'lr',
      recovery: '',
    },
    consume: {
      type: '',
      target: '',
      amount: null,
    },
    ability: '',
    actionType: 'mwak',
    attackBonus: '2',
    chatFlavor: '',
    critical: {
      threshold: null,
      damage: '',
    },
    damage: {
      parts: [['1d8 + @mod + 2', 'slashing']],
      versatile: '',
    },
    formula: '',
    save: {
      ability: '',
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
  img: artWorkChatTitle,
  effects: [],
  folder: null,
  sort: 0,
  ownership: {
    default: 0,
  },
  flags: {
    'midi-qol': {
      fumbleThreshold: null,
      effectActivation: false,
      onUseMacroName: '', // TO UPDATE
    },
  },
};

export const deathKissAbility = {
  deathKissAttack: deathKissAttack,
};
