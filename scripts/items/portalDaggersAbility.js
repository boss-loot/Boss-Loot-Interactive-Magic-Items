import { MODULE_NAME, SHORT_MODULE_NAME } from '../settings.js';
import { helperData as helpers } from '../helperFunctions.js';

const primeFeatName = 'Prime Portal (Active Ability)';
const secundusFeatName = 'Secundus Portal (Active Ability)';
const tertiusFeatName = 'Tertius Portal (Active Ability)';
const quartusFeatName = 'Quartus Portal (Active Ability)';
const primeArtworkFeat = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-prime-ability.webp`;
const secundusArtworkFeat = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-secundus-ability.webp`;
const tertiusArtworkFeat = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-tertius-ability.webp`;
const quartusArtworkFeat = `modules/${MODULE_NAME}/artwork/006-portal-daggers/art-static-portal-dagger-quartus-ability.webp`;

const primePortalfeat = {
  name: primeFeatName,
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
      value: '',
      units: '',
    },
    target: {
      value: null,
      width: null,
      units: '',
      type: '',
    },
    range: {
      value: 20,
      long: 40,
      units: 'ft',
    },
    uses: {
      value: null,
      max: '',
      per: '',
      recovery: '',
    },
    consume: {
      type: '',
      target: '',
      amount: null,
    },
    ability: '',
    actionType: 'other',
    attackBonus: '',
    chatFlavor: '',
    critical: {
      threshold: null,
      damage: '',
    },
    damage: {
      parts: [],
      versatile: '',
    },
    formula: '',
    save: {
      ability: '',
      dc: null,
      scaling: 'spell',
    },
    type: {
      value: 'feat',
      subtype: '',
    },
    requirements: '',
    recharge: {
      value: null,
      charged: false,
    },
  },
  img: primeArtworkFeat,
  effects: [],
  folder: null,
  sort: 0,
  flags: {
    'midi-qol': {
      effectActivation: false,
      forceCEOff: false,
      onUseMacroName: '', // TO UPDATE
    },
  },
};

const secundusPortalfeat = {
  name: secundusFeatName,
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
      value: '',
      units: '',
    },
    target: {
      value: null,
      width: null,
      units: '',
      type: '',
    },
    range: {
      value: 20,
      long: 40,
      units: 'ft',
    },
    uses: {
      value: null,
      max: '',
      per: '',
      recovery: '',
    },
    consume: {
      type: '',
      target: '',
      amount: null,
    },
    ability: '',
    actionType: 'other',
    attackBonus: '',
    chatFlavor: '',
    critical: {
      threshold: null,
      damage: '',
    },
    damage: {
      parts: [],
      versatile: '',
    },
    formula: '',
    save: {
      ability: '',
      dc: null,
      scaling: 'spell',
    },
    type: {
      value: 'feat',
      subtype: '',
    },
    requirements: '',
    recharge: {
      value: null,
      charged: false,
    },
  },
  img: secundusArtworkFeat,
  effects: [],
  folder: null,
  sort: 0,
  flags: {
    'midi-qol': {
      effectActivation: false,
      forceCEOff: false,
      onUseMacroName: '', // TO UPDATE
    },
  },
};

const tertiusPortalfeat = {
  name: tertiusFeatName,
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
      value: '',
      units: '',
    },
    target: {
      value: null,
      width: null,
      units: '',
      type: '',
    },
    range: {
      value: 20,
      long: 40,
      units: 'ft',
    },
    uses: {
      value: null,
      max: '',
      per: '',
      recovery: '',
    },
    consume: {
      type: '',
      target: '',
      amount: null,
    },
    ability: '',
    actionType: 'other',
    attackBonus: '',
    chatFlavor: '',
    critical: {
      threshold: null,
      damage: '',
    },
    damage: {
      parts: [],
      versatile: '',
    },
    formula: '',
    save: {
      ability: '',
      dc: null,
      scaling: 'spell',
    },
    type: {
      value: 'feat',
      subtype: '',
    },
    requirements: '',
    recharge: {
      value: null,
      charged: false,
    },
  },
  img: tertiusArtworkFeat,
  effects: [],
  folder: null,
  sort: 0,
  flags: {
    'midi-qol': {
      effectActivation: false,
      forceCEOff: false,
      onUseMacroName: '', // TO UPDATE
    },
  },
};

const quartusPortalfeat = {
  name: quartusFeatName,
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
      value: '',
      units: '',
    },
    target: {
      value: null,
      width: null,
      units: '',
      type: '',
    },
    range: {
      value: 20,
      long: 40,
      units: 'ft',
    },
    uses: {
      value: null,
      max: '',
      per: '',
      recovery: '',
    },
    consume: {
      type: '',
      target: '',
      amount: null,
    },
    ability: '',
    actionType: 'other',
    attackBonus: '',
    chatFlavor: '',
    critical: {
      threshold: null,
      damage: '',
    },
    damage: {
      parts: [],
      versatile: '',
    },
    formula: '',
    save: {
      ability: '',
      dc: null,
      scaling: 'spell',
    },
    type: {
      value: 'feat',
      subtype: '',
    },
    requirements: '',
    recharge: {
      value: null,
      charged: false,
    },
  },
  img: quartusArtworkFeat,
  effects: [],
  folder: null,
  sort: 0,
  flags: {
    'midi-qol': {
      effectActivation: false,
      forceCEOff: false,
      onUseMacroName: '', // TO UPDATE
    },
  },
};

export const portalDaggersAbility = {
  primePortalfeat: primePortalfeat,
  secundusPortalfeat: secundusPortalfeat,
  tertiusPortalfeat: tertiusPortalfeat,
  quartusPortalfeat: quartusPortalfeat,
};
