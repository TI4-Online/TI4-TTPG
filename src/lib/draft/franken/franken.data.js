/**
 * - name : string
 * - description : string
 * - source : string, faction name
 */
const FACTION_ABILITIES = [
    {
        name: "Aetherpassage",
        description:
            "After a player activates a system, you may allow that player to move their ships through system that contain your ships.",
        source: "Empyrean",
    },
    {
        name: "Amalgamation",
        description:
            "When you produce a unit, you may return 1 captured unit of that type to produce that unit without spending resources.",
        source: "Vuil'raith Cabal",
    },
    {
        name: "Ambush",
        description:
            "At the start of a space combat, you may roll 1 die for each of up to 2 of your cruisers or destroyers in the system. For each result equal to or greater than that ship's combat value produce 1 hit; your opponent must assign it to 1 of their ships.",
        source: "Mentak Coalition",
    },
    {
        name: "Analytical",
        description:
            "When you research a technology that is not a unit upgrade technology, you may ignore 1 prerequisite.",
        source: "Universities of Jol-Nar",
    },
    {
        name: "Arbiters",
        description:
            "When you are negotiating a transaction, action cards can be exchanged as part of that transaction.",
        source: "Emirates of Hacan",
    },
    {
        name: "Armada",
        description:
            "The maximum number of non-fighter ships you can have in each system is equal to 2 more than the number of tokens in your fleet pool.",
        source: "Barony of Letnev",
    },
    {
        name: "Assimilate",
        description:
            "When you gain control of a planet, replace each PDS and space dock that is on that planet with a matching unit from your reinforcements.",
        source: "L1Z1X Mindnet",
    },
    {
        name: "Awaken",
        description:
            "After you activate a system that contains 1 or more of your sleeper tokens, you may replace each of those tokens with 1 PDS from your reinforcements.",
        source: "Titans of Ul",
    },
    {
        name: "Blood Ties",
        description:
            "You do not have to spend influence to remove the custodians token from Mecatol Rex.",
        source: "Winnu",
    },
    {
        name: "Brilliant",
        description:
            "When you spend a command token to resolve the secondary ability of the Technology strategy card, you may resolve the primary ability instead.",
        source: "Universities of Jol-Nar",
    },
    {
        name: "Coalescence",
        description:
            "If your flagship or your Awaken faction ability places units into the same space area or onto the same planet as another player's units, your units must participate in combat during the Space Combat or Ground Combat steps.",
        source: "Titans of Ul",
    },
    {
        name: "Council Patronage",
        description:
            "Replenish your commodities at the start of the strategy phase, then gain 1 trade good.",
        source: "Keleres",
    },
    {
        name: "Crafty",
        description:
            "You can have any number of action cards in your hand. Game effects cannot prevent you from using this ability.",
        source: "Yssaril Tribes",
    },
    {
        name: "Creuss Gate",
        description:
            "When you create the game board, place the Creuss Gate (tile 17) where your home system would normally be placed. The Creuss Gate system is not a home system. Then place your home system (tile 51) in your play area.",
        source: "Ghosts of Creuss",
    },
    {
        name: "Dark Whispers",
        description:
            "During setup, take the additional Empyrean faction promissory note; you have 2 faction promissory notes.",
        source: "Empyrean",
    },
    {
        name: "Devotion",
        description:
            "After each space battle round, you may destroy 1 of your cruisers or destroyers in the active system to produce 1 hit and assign it to 1 of your opponent's ships in that system.",
        source: "Yin Brotherhood",
    },
    {
        name: "Devour",
        description:
            "Capture your opponent's non-structure units that are destroyed during combat.",
        source: "Vuil'raith Cabal",
    },
    {
        name: "Distant Suns",
        description:
            "When you explore a planet that contains 1 of your mechs, you may draw 1 additional card; choose 1 to resolve and discard the rest.",
        source: "Naaz-Rokha Alliance",
    },
    {
        name: "Edict",
        description:
            "When you win a combat, place 1 command token from your opponent's reinforcements in your fleet pool if it does not already contain 1 of that player's tokens; other players' tokens in your fleet pool increase your fleet limit but cannot be redistributed.",
        source: "Mahact Gene-Sorcerers",
    },
    {
        name: "Fabrication",
        description:
            "Action: Either purge 2 of your relic fragments of the same type to gain 1 relic or purge 1 of your relic fragments to gain 1 command token.",
        source: "Naaz-Rokha Alliance",
    },
    {
        name: "Foresight",
        description:
            "After another player moves ships into a system that contains one or more of your ships, you may place 1 token from your strategy pool in an adjacent system that does not contain another player's ships; move your ships from the active system into that system.",
        source: "Naalu Collective",
    },
    {
        name: "Fragile",
        description:
            "Apply -1 to the result of each of your unit's combat rolls.",
        source: "Universities of Jol-Nar",
    },
    {
        name: "Future Sight",
        description:
            "During the agenda phase, after an outcome you voted for or predicted is resolved, gain 1 trade good.",
        source: "Nomad",
    },
    {
        name: "Galactic Threat",
        description:
            "You cannot vote on agendas. Once per agenda phase, after an agenda is revealed, you may predict aloud the outcome of that agenda. If your prediction is correct, gain 1 technology that is owned by a player who voted how you predicted.",
        source: "Nekro Virus",
    },
    {
        name: "Gashlai Physiology",
        description: "Your ships can move through supernovas.",
        source: "Embers of Muaat",
    },
    {
        name: "Guild Ships",
        description:
            "You can negotiate transactions with players who are not your neighbor.",
        source: "Emirates of Hacan",
    },
    {
        name: "Harrow",
        description:
            "At the end of each round of ground combat, your ships in the active system may use their Bombardment abilities against your opponent's ground forces on the planet.",
        source: "L1Z1X Mindnet",
    },
    {
        name: "Hubris",
        description:
            "During setup, purge your Alliance promissory note. Other players cannot give you their Alliance promissory notes.",
        source: "Mahact Gene-Sorcerers",
    },
    {
        name: "Imperia",
        description:
            "While another player's command token is in your fleet pool, you can use the ability of that player's commander, if it's unlocked.",
        source: "Mahact Gene-Sorcerers",
    },
    {
        name: "Indoctrination",
        description:
            "At the start of a ground combat, you may spend 2 influence to replace 1 of your opponent's participating infantry with 1 infantry from your reinforcements.",
        source: "Yin Brotherhood",
    },
    {
        name: "Law's Order",
        description:
            "You may spend 1 influence at the start of your turn to treat all laws as blank until the end of your turn.",
        source: "Keleres",
    },
    {
        name: "Masters of Trade",
        description:
            "You do not have to spend a command token to resolve the secondary ability of the Trade strategy card.",
        source: "Emirates of Hacan",
    },
    {
        name: "Mitosis",
        description:
            "Your space docks cannot produce infantry. At the start of the status phase, place 1 infantry from your reinforcements on any planet you control.",
        source: "Arborec",
    },
    {
        name: "Munitions Reserves",
        description:
            "At the start of each round of space combat, you may spend 2 trade goods; you may reroll any number of your dice during that combat round.",
        source: "Barony of Letnev",
    },
    {
        name: "Nomadic",
        description:
            "You can score objectives even if you do not control the planets in your home system.",
        source: "Clan of Saar",
    },
    {
        name: "Orbital Drop",
        description:
            "Action: Spend 1 token from your strategy pool to place 2 infantry from your reinforcements on 1 planet you control.",
        source: "Federation of Sol",
    },
    {
        name: "Peace Accords",
        description:
            "After you resolve the primary or secondary ability of the Diplomacy strategy card, you may gain control of 1 planet other than Mecatol Rex that does not contain any units and is in a system that is adjacent to a planet you control.",
        source: "Xxcha Kingdom",
    },
    {
        name: "Pillage",
        description:
            "After 1 of your neighbors gains trade goods or resolves a transaction, if that neighbor has 3 or more trade goods, you may take 1 of their trade goods or commodities.",
        source: "Mentak Coalition",
    },
    {
        name: "Propagation",
        description:
            "You cannot research technology. When you would research a technology, gain 3 command tokens instead.",
        source: "Nekro Virus",
    },
    {
        name: "Quantum Entanglement",
        description:
            "You treat all systems that contain either an alpha or a beta wormhole as adjacent to each other. Game effects cannot prevent you from using this ability.",
        source: "Ghosts of Creuss",
    },
    {
        name: "Quash",
        description:
            "When an agenda is revealed, you may spend 1 token from your strategy pool to discard that agenda and reveal 1 agenda from the top of the deck. Players vote on this agenda instead.",
        source: "Xxcha Kingdom",
    },
    {
        name: "Raid Formation",
        description:
            "When 1 or more of your units use Anti-Fighter Barrage, for each hit produced in excess of your opponent's fighters, choose 1 of your opponent's ships that has Sustain Damage to become damaged.",
        source: "Argent Flight",
    },
    {
        name: "Reclamation",
        description:
            "After you resolve a tactical action during which you gained control of Mecatol Rex, you may place 1 PDS and 1 space dock from your reinforcements on Mecatol Rex.",
        source: "Winnu",
    },
    {
        name: "Riftmeld",
        description:
            "When you research a unit upgrade technology, you may return 1 captured unit of that type to ignore all of that technology's prerequisites.",
        source: "Vuil'raith Cabal",
    },
    {
        name: "Scavenge",
        description: "After you gain control of a planet, gain 1 trade good.",
        source: "Clan of Saar",
    },
    {
        name: "Scheming",
        description:
            "When you draw 1 or more action cards, draw 1 additional action card. Then, choose and discard 1 action card from your hand.",
        source: "Yssaril Tribes",
    },
    {
        name: "Slipstream",
        description:
            "During your tactical actions, apply +1 to the move value of each of your ships that starts its movement in your home system or in a system that contains either an alpha or beta wormhole.",
        source: "Ghosts of Creuss",
    },
    {
        name: "Stall Tactics",
        description: "Action: Discard 1 action card from your hand.",
        source: "Yssaril Tribes",
    },
    {
        name: "Star Forge",
        description:
            "Action: Spend 1 token from your strategy pool to place either 2 fighters or 1 destroyer from your reinforcements in a system that contains 1 or more of your war suns.",
        source: "Embers of Muaat",
    },
    {
        name: "Technological Singularity",
        description:
            "Once per combat, after 1 of your opponent's units is destroyed, you may gain 1 technology that is owned by that player.",
        source: "Nekro Virus",
    },
    {
        name: "Telepathic",
        description:
            "At the end of the strategy phase, place the Naalu 0 token on your strategy card; you are first in initiative order.",
        source: "Naalu Collective",
    },
    {
        name: "Terragenesis",
        description:
            "After you explore a planet that does not have a sleeper token, you may place or move 1 sleeper token onto that planet.",
        source: "Titans of Ul",
    },
    {
        name: "The Company",
        description:
            "During setup, take the 2 additional Nomad faction agents and place them next to your faction sheet; you have 3 agents.",
        source: "Nomad",
    },
    {
        name: "The Tribunii",
        description:
            "During setup, choose an unplayed faction from among the Mentak, the Xxcha, and the Argent Flight; take that faction's home system, command tokens, and control markers. Additionally, take the Keleres hero that corresponds to that faction.",
        source: "Keleres",
    },
    {
        name: "Unrelenting",
        description:
            "Apply +1 to the result of each of your unit's combat rolls.",
        source: "Sardakk N'orr",
    },
    {
        name: "Versatile",
        description:
            "When you gain command tokens during the status phase, gain 1 additional command token.",
        source: "Federation of Sol",
    },
    {
        name: "Voidborn",
        description: "Nebulae do not affect your ships' movement.",
        source: "Empyrean",
    },
    {
        name: "Zeal",
        description:
            "You always vote first during the agenda phase. When you cast at least 1 vote, cast 1 additional vote for each player in the game, including you.",
        source: "Argent Flight",
    },
];

/**
 * - undraftable : array of {name, nsid, count, triggerNsid|triggerNsids|triggerAbility} objects
 */
const UNDRAFTABLE = [
    // CARDS
    {
        name: "Antivirus",
        nsid: "card.promissory.nekro:base/antivirus",
        count: 1,
        triggerAbility: "Technological Singularity",
    },
    {
        name: "Artuno the Betrayer",
        nsid: "card.leader.agent.nomad:pok/artuno_the_betrayer",
        count: 1,
        triggerAbility: "The Company",
    },
    {
        name: "Blackshade Infiltrator",
        nsid: "card.leader.mech.yssaril:pok/blackshade_infiltrator",
        count: 1,
        triggerAbility: "Stall Tactics",
    },
    {
        name: "Blood Pact",
        nsid: "card.promissory.empyrean:pok/blood_pact",
        count: 1,
        triggerAbility: "Dark Whispers",
    },
    {
        name: "Brother Omar",
        nsid: "card.leader.commander.yin:codex.vigil/brother_omar.omega",
        count: 1,
        triggerAbility: "Indoctrination",
    },
    {
        name: "Dark Pact",
        nsid: "card.promissory.empyrean:pok/dark_pact",
        count: 1,
        triggerAbility: "Dark Whispers",
    },
    {
        name: "Ember Colossus",
        nsid: "card.leader.mech.muaat:pok/ember_colossus",
        count: 1,
        triggerAbility: "Star Forge",
    },
    {
        name: "Gift of Prescience",
        nsid: "card.promissory.naalu:base/gift_of_prescience",
        count: 1,
        triggerAbility: "Telepathic",
    },
    {
        name: "Hil Colish",
        nsid: "card.technology.unit_upgrade.creuss:franken.base/hil_colish",
        count: 1,
        triggerNsid: "tile.system:base/51",
    },
    {
        name: "It Feeds on Carrion",
        nsid: "card.leader.hero.vuilraith:pok/it_feeds_on_carrion",
        count: 1,
        triggerNsids: [
            "card.technology.unit_upgrade.vuilraith:franken.pok/dimensional_tear",
            "card.technology.unit_upgrade.vuilraith:pok/dimensional_tear_2",
        ],
    },
    {
        name: "Memoria II",
        nsid: "card.technology.unit_upgrade.nomad:pok/memoria_2",
        count: 1,
        triggerNsid: "card.technology.unit_upgrade.nomad:franken.pok/memoria",
    },
    {
        name: "Moyin's Ashes",
        nsid: "card.leader.mech.yin:pok/moyins_ashes",
        count: 1,
        triggerAbility: "Indoctrination",
    },
    {
        name: "Munitions Reserves",
        nsid: "card.other.portrait:base/munitions_reserves",
        count: 1,
        triggerAbility: "Munitions Reserves",
    },
    {
        name: "Promise of Protection",
        nsid: "card.promissory.mentak:base/promise_of_protection",
        count: 1,
        triggerAbility: "Pillage",
    },
    {
        name: "Suffi An",
        nsid: "card.leader.agent.mentak:pok/suffi_an",
        count: 1,
        triggerAbility: "Pillage",
    },
    {
        name: "That Which Molds Flesh",
        nsid: "card.leader.commander.vuilraith:pok/that_which_molds_flesh",
        count: 1,
        triggerNsids: [
            "card.technology.unit_upgrade.vuilraith:franken.pok/dimensional_tear",
            "card.technology.unit_upgrade.vuilraith:pok/dimensional_tear_2",
        ],
    },
    {
        name: "The Thundarian",
        nsid: "card.leader.agent.nomad:pok/the_thundarian",
        count: 1,
        triggerAbility: "The Company",
    },
    {
        name: "ZS Thunderbolt M2",
        nsid: "card.leader.mech.sol:pok/zs_thunderbolt_m2",
        count: 1,
        triggerAbility: "Orbital Drop",
    },

    // SYSTEM TILES
    {
        name: "Creuss Gate",
        nsid: "tile.system:base/17",
        count: 1,
        triggerNsid: "tile.system:base/51",
    },
    {
        name: "Muaat Supernova",
        nsid: "tile.system:pok/81",
        count: 1,
        triggerNsid: "card.leader.hero.muaat:pok/adjudicator_baal",
    },

    // VALEFAR
    {
        name: "Valefar Assimilator X",
        nsid: "card.technology.unknown.nekro:base/valefar_assimilator_x",
        count: 1,
        triggerAbility: "Technological Singularity",
    },
    {
        name: "Valefar Assimilator X Token",
        nsid: "token.nekro:base/valefar_assimilator_x",
        count: 1,
        triggerAbility: "Technological Singularity",
    },
    {
        name: "Valefar Assimilator Y",
        nsid: "card.technology.unknown.nekro:base/valefar_assimilator_y",
        count: 1,
        triggerAbility: "Technological Singularity",
    },
    {
        name: "Valefar Assimilator Y Token",
        nsid: "token.nekro:base/valefar_assimilator_y",
        count: 1,
        triggerAbility: "Technological Singularity",
    },

    // TOKENS
    {
        name: "Alpha Wormhole Token",
        nsid: "token.wormhole.creuss:base/alpha",
        count: 1,
        triggerNsids: [
            "card.technology.blue.creuss:base/wormhole_generator",
            "card.technology.blue.creuss:codex.ordinian/wormhole_generator.omega",
            "card.promissory.creuss:base/creuss_iff",
        ],
    },
    {
        name: "Beta Wormhole Token",
        nsid: "token.wormhole.creuss:base/beta",
        count: 1,
        triggerNsids: [
            "card.technology.blue.creuss:base/wormhole_generator",
            "card.technology.blue.creuss:codex.ordinian/wormhole_generator.omega",
            "card.promissory.creuss:base/creuss_iff",
        ],
    },
    {
        name: "Gamma Wormhole Token",
        nsid: "token.wormhole.creuss:pok/gamma",
        count: 1,
        triggerNsids: [
            "card.technology.blue.creuss:base/wormhole_generator",
            "card.technology.blue.creuss:codex.ordinian/wormhole_generator.omega",
            "card.promissory.creuss:base/creuss_iff",
        ],
    },

    {
        name: "Custodia Vigilia Token",
        nsid: "token.keleres:codex.vigil/custodia_vigilia",
        count: 1,
        triggerNsid:
            "card.technology.yellow.keleres:codex.vigil/iihq_modernization",
    },

    {
        name: "Tear Token",
        nsid: "token.vuilraith:pok/dimensional_tear",
        count: 3,
        triggerNsids: [
            "card.technology.unit_upgrade.vuilraith:franken.pok/dimensional_tear",
            "card.technology.unit_upgrade.vuilraith:pok/dimensional_tear_2",
        ],
    },
    {
        name: "Ul Sleeper Token",
        nsid: "token.ul:pok/sleeper",
        count: 5,
        triggerAbility: "Terragenesis",
    },
    {
        name: "Ul Geoform Token",
        nsid: "token.attachment.ul:pok/geoform",
        count: 5,
        triggerNsid: "card.leader.hero.ul:pok/ul_the_progenitor",
    },
    {
        name: "Ul Terraform Token",
        nsid: "token.attachment.ul:pok/terraform",
        count: 5,
        triggerNsid: "card.promissory.ul:pok/terraform",
    },
    {
        name: "Zero Strategy Token",
        nsid: "token.naalu:base/zero",
        count: 1,
        triggerAbility: "Telepathic",
    },

    // Base version of units.
    {
        name: "Super Dreadnought I",
        nsid: "card.technology.unit_upgrade.l1z1x:franken.base/superdreadnought",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.l1z1x:base/superdreadnought_2",
    },
    {
        name: "Exotrireme I",
        nsid: "card.technology.unit_upgrade.norr:franken.base/exotrireme",
        count: 1,
        triggerNsid: "card.technology.unit_upgrade.norr:base/exotrireme_2",
    },
    {
        name: "Dimensional Tear I",
        nsid: "card.technology.unit_upgrade.vuilraith:franken.pok/dimensional_tear",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.vuilraith:pok/dimensional_tear_2",
    },
    {
        name: "Prototype War Sun I",
        nsid: "card.technology.unit_upgrade.muaat:franken.base/prototype_war_sun",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.muaat:base/prototype_war_sun_2",
    },
    {
        name: "Spec Ops I",
        nsid: "card.technology.unit_upgrade.sol:franken.base/spec_ops",
        count: 1,
        triggerNsid: "card.technology.unit_upgrade.sol:base/spec_ops_2",
    },
    {
        name: "Advanced Carrier I",
        nsid: "card.technology.unit_upgrade.sol:franken.base/advanced_carrier",
        count: 1,
        triggerNsid: "card.technology.unit_upgrade.sol:base/advanced_carrier_2",
    },
    {
        name: "Letani Warrior I",
        nsid: "card.technology.unit_upgrade.arborec:franken.base/letani_warrior",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.arborec:base/letani_warrior_2",
    },
    {
        name: "Crimson Legionnaire I",
        nsid: "card.technology.unit_upgrade.mahact:franken.pok/crimson_legionnaire",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.mahact:pok/crimson_legionnaire_2",
    },
    {
        name: "Hel Tital I",
        nsid: "card.technology.unit_upgrade.ul:franken.pok/heltitan",
        count: 1,
        triggerNsid: "card.technology.unit_upgrade.ul:pok/heltitan_2",
    },
    {
        name: "Saturn Engine I",
        nsid: "card.technology.unit_upgrade.ul:franken.pok/saturn_engine",
        count: 1,
        triggerNsid: "card.technology.unit_upgrade.ul:pok/saturn_engine_2",
    },
    {
        name: "Strike Wing Alpha I",
        nsid: "card.technology.unit_upgrade.argent:franken.pok/strike_wing_alpha",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.argent:pok/strike_wing_alpha_2",
    },
    {
        name: "Hybrid Crystal Fighter I",
        nsid: "card.technology.unit_upgrade.naalu:franken.base/hybrid_crystal_fighter",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.naalu:base/hybrid_crystal_fighter_2",
    },
    {
        name: "Floating Factory I",
        nsid: "card.technology.unit_upgrade.saar:franken.base/floating_factory",
        count: 1,
        triggerNsid:
            "card.technology.unit_upgrade.saar:base/floating_factory_2",
    },
];

// Keleres is regsitered as several flavors, keep the argent one
// where things are duplicated.
const REMOVE_CARDS = [
    "card.promissory.keleres_xxcha:codex.vigil/keleres_rider",
    "card.promissory.keleres_mentak:codex.vigil/keleres_rider",
    "card.leader.mech.keleres_xxcha:codex.vigil/omniopiares",
    "card.leader.mech.keleres_mentak:codex.vigil/omniopiares",
    "card.leader.agent.keleres_xxcha:codex.vigil/xander_alexin_victori_iii",
    "card.leader.agent.keleres_mentak:codex.vigil/xander_alexin_victori_iii",
    "card.leader.commander.keleres_xxcha:codex.vigil/suffi_an",
    "card.leader.commander.keleres_mentak:codex.vigil/suffi_an",
    "card.alliance:codex.vigil/keleres_argent",
    "card.alliance:codex.vigil/keleres_xxcha",
];

module.exports = { FACTION_ABILITIES, UNDRAFTABLE, REMOVE_CARDS };
