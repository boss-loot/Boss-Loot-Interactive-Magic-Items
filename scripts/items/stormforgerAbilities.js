import { MODULE_NAME, SHORT_MODULE_NAME } from '../settings.js';
const artWorktornadoTakedownItem = `modules/${MODULE_NAME}/artwork/005-stormforger/art-satic-tornadon-takedown-effect.webp`;
const artWorkthunderstormOfMiseryFeat = `modules/${MODULE_NAME}/artwork/005-stormforger/art-static-thunderstorm-of-misery-effect.webp`;

export const tornadoTakedownItem = {
  name: 'Tornado Takedown',
  type: 'consumable',
  img: artWorktornadoTakedownItem,
  system: {
    description: {
      value: `<p><strong>Tornado Takedown</strong>: Expending 2 charges allows the wielder to summon a tornado that travels to a creature within 60 feet. The creature must make a Dexterity saving throw, on a failed save it takes [[/r 1d6]] bludgeoning damage and [[/r 2d6]] lightning damage, and is @UUID[Compendium.dnd5e.rules.w7eitkpD7QQTB6j0.JournalEntryPage.TpkZgLfxCmSndmpb]{Incapacitated} until the end of your next turn. On a successful save it takes half as much damage and is not incapacitated.</p><hr /><img src="modules/${MODULE_NAME}/artwork/005-stormforger/art-animated-for-chat-stormforger-staff.gif" title="Stormforger" width="272" height="272" />`,
      chat: '',
      unidentified: '',
    },
    source: '', // TO UPDATE
    quantity: 1,
    weight: 0,
    attunement: 0,
    equipped: true,
    rarity: 'legendary',
    identified: true,
    activation: {
      type: 'action',
      cost: 1,
      condition: '',
    },
    duration: {
      value: '',
      units: '',
    },
    cover: null,
    crewed: false,
    target: {
      value: 1,
      width: null,
      units: 'ft',
      type: 'radius',
    },
    range: {
      value: 60,
      long: 60,
      units: 'ft',
    },
    uses: {
      value: 1,
      max: '1',
      per: 'charges',
      recovery: '',
      autoDestroy: true,
    },
    actionType: 'save',
    chatFlavor: '',
    damage: {
      parts: [
        ['1d6 + 2', 'bludgeoning'],
        ['2d6', 'lightning'],
      ],
      versatile: '',
    },
    formula: '',
    save: {
      ability: 'dex',
      dc: null,
      scaling: 'spell',
    },
    consumableType: 'scroll',
  },
  effects: [
    {
      name: 'Tornado Takedown (Temporary Effect)',
      icon: artWorktornadoTakedownItem,
      origin: '', // TO UPDATE
      duration: {
        rounds: 1, // TO UPDATE
        startTime: null,
        seconds: null, // TO UPDATE
        combat: null,
        turns: null,
        startRound: null,
        startTurn: null,
      },
      disabled: false,
      changes: [
        {
          key: 'macro.CE',
          mode: 0,
          value: 'Incapacitated',
          priority: 20,
        },
      ],
      tint: null,
      transfer: false,
      flags: {
        'times-up': {},
        'dfreds-convenient-effects': {
          description: '',
        },
        dae: {
          selfTarget: false,
          selfTargetAlways: false,
          stackable: 'noneName',
          durationExpression: '',
          macroRepeat: 'none',
          specialDuration: [],
        },
        effectmacro: {
          onDelete: {
            script: "await Sequencer.EffectManager.endEffects({ name: 'Tornado-Takedown' });",
          },
        },
      },
    },
  ],
  flags: {
    'midi-qol': {
      forceCEOff: false,
      effectActivation: false,
      onUseMacroName: '', // TO UPDATE
    },
  },
};

export const thunderstormOfMiseryItem = {
  name: 'Thunderstorm of Misery',
  type: 'feat',
  system: {
    description: {
      value:
        '<p><strong>Thunderstorm of Misery (Active Ability)</strong>: Expending 9 charges allows the wielder to unleash the full potential of the Stormbringer Staff, summoning a powerful storm that rages around them in a 50-foot radius for 1 minute. The storm creates dangerous terrain, making the ground slippery and filled with debris, making it difficult for creatures within the area of effect to move around. The howling winds, lightning strikes and heavy rain make it hard for creatures to see or hear, imposing disadvantage on any perception checks made while within the storm. The storm also unleashes bolts of lightning, forcing creatures within the affected area, to make a Dexterity saving throw. On a failed save they take [[/r 8d6]] lightning damage, or half as much damage on a successful one.</p>',
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
      value: '10',
      units: 'round',
    },
    target: {
      value: 50,
      width: null,
      units: 'ft',
      type: 'creature',
    },
    range: {
      value: null,
      long: null,
      units: '',
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
    actionType: 'save',
    attackBonus: '',
    chatFlavor: '',
    critical: {
      threshold: null,
      damage: '',
    },
    damage: {
      parts: [['8d6', 'lightning']],
      versatile: '',
    },
    formula: '',
    save: {
      ability: 'dex',
      dc: null,
      scaling: 'spell',
    },
    type: {
      value: 'feat',
      subtype: '',
    },
    requirements: '9 Charges',
    recharge: {
      value: null,
      charged: false,
    },
  },
  img: artWorkthunderstormOfMiseryFeat,
  effects: [
    {
      name: 'Thunderstorm of Misery (Temporary Effect)',
      icon: artWorkthunderstormOfMiseryFeat,
      origin: '', // TO UPDATE
      duration: {
        rounds: 10,
      },
      disabled: false,
      changes: [],
      tint: null,
      transfer: false,
      flags: {
        dae: {
          selfTargetAlways: true,
        },
        effectmacro: {
          onDelete: {
            script: 'const thunderFeat = await fromUuid(effect.origin);\nawait Sequencer.EffectManager.endEffects({ name: "Thunderstorm-of-Misery" });\nthunderFeat?.delete();\n',
          },
        },
      },
    },
  ],
  folder: null,
  sort: 0,
  flags: {
    'midi-qol': {
      forceCEOff: false,
      effectActivation: false,
      onUseMacroName: '', // TO UPDATE
    },
    midiProperties: {
      magicdam: true,
    },
  },
};
