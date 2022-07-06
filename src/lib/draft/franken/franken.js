/**
 * Custom components:
 * - Starting units
 * - Starting tech
 * - Commodity tiles
 * - Flagships
 * - Faction abilities
 * - Base units
 *
 * Pulled from elsewhere:
 * - Promissory notes
 * - Faction tech
 * - Agents
 * - Commanders
 * - Heroes
 * - Mech
 * - Home systems
 * - Blue systems
 * - Red systems
 *
 * Non-draft parts
 */

const UNDRAFTABLE = [
    "token.wormhole.creuss:base/alpha",
    "token.wormhole.creuss:base/beta",
    "token.wormhole.creuss:pok/gamma",
    "token.naalu:base/zero",
    "token.nekro:base/valefar_assimilator_x",
    "token.nekro:base/valefar_assimilator_y",
    "token.nekro:pok/dimensional_tear",
    "token.ul:pok/sleeper",
    "token.vuilraith:pok/dimensional_tear",
    "token.attachment.ul:pok/geoform",
    "token.attachment.ul:pok/terraform",
    "tile.system:base/17", // creuss gate
    "tile.system:pok/81", // muaat hero supernova

    // ['Antivirus'] = {
    //     prereq = { name = 'Technological Singularity', type = TYPE.ABILITY },
    //     faction = 'Nekro',
    // },
    // ['Artuno the Betrayer'] = {
    //     prereq = { name = 'The Company', type = TYPE.ABILITY },
    //     faction = 'Nomad',
    // },
    // ['Blackshade Infiltrator'] = {
    //     prereq = { name = 'Stall Tactics', type = TYPE.ABILITY },
    //     faction = 'Yssaril',
    // },
    // ['Brother Omar'] = {
    //     prereq = { name = 'Indoctrination', type = TYPE.ABILITY },
    //     faction = 'Yin',
    // },
    // ['Creuss Gate'] = {  -- XXX MISSING
    //     prereq = { name = 'Creuss', type = TYPE.HOME_SYSTEM },
    //     faction = 'Creuss',
    // },
    // ['Dark Pact'] = {
    //     prereq = { name = 'Dark Whispers', type = TYPE.ABILITY },
    //     faction = 'Empyrean',
    // },
    // ['Ember Colossus'] = {
    //     prereq = { name = 'Star Forge', type = TYPE.ABILITY },
    //     faction = 'Muaat',
    // },
    // ['Gift of Prescience'] = {
    //     prereq = { name = 'Telepathic', type = TYPE.ABILITY },
    //     faction = 'Naalu',
    // },
    // ['Hil Colish'] = {
    //     prereq = { name = 'Creuss', type = TYPE.HOME_SYSTEM },
    //     faction = 'Creuss',
    // },
    // ['It Feeds on Carrion'] = {
    //     prereq = { name = 'Dimensional Tear', type = TYPE.ABILITY },
    //     faction = 'Cabal',
    // },
    // ['Memoria II'] = {
    //     prereq = { name = 'Memoria I', type = TYPE.FLAGSHIP },
    //     faction = 'Nomad',
    // },
    // ["Moyin's Ashes"] = {
    //     prereq = { name = 'Indoctrination', type = TYPE.ABILITY },
    //     faction = 'Yin',
    // },
    // ['Promise of Protection'] = {
    //     prereq = { name = 'Pillage', type = TYPE.ABILITY },
    //     faction = 'Mentak',
    // },
    // ['Suffi An'] = {
    //     prereq = { name = 'Pillage', type = TYPE.ABILITY },
    //     faction = 'Mentak',
    // },
    // ['That Which Molds Flesh'] = {
    //     prereq = { name = 'Dimensional Tear', type = TYPE.ABILITY },
    //     faction = 'Cabal',
    // },
    // ['The Thundarian'] = {
    //     prereq = { name = 'The Company', type = TYPE.ABILITY },
    //     faction = 'Nomad',
    // },
    // ['Valefar Assimilator X'] = {
    //     prereq = { name = 'Technological Singularity', type = TYPE.ABILITY },
    //     faction = 'Nekro',
    // },
    // ['Valefar Assimilator Y'] = {
    //     prereq = { name = 'Technological Singularity', type = TYPE.ABILITY },
    //     faction = 'Nekro',
    // },
    // ['ZS Thunderbolt M2'] = {
    //     prereq = { name = 'Orbital Drop', type = TYPE.ABILITY },
    //     faction = 'Sol',
    // },

    // -- Discordant Stars
    // ['Atropha'] = {},
    // ['Auberon Elyrin'] = {},
    // ['Autofabricator'] = {},
    // ['Automatons Token'] = {},
    // ['Axis Order - Carrier'] = {},
    // ['Axis Order - Cruiser'] = {},
    // ['Axis Order - Destroyers'] = {},
    // ['Axis Order - Dreadnought'] = {},
    // ['Branch Office - Broadcast Hub Token'] = {},
    // ['Branch Office - Broadcast Hub'] = {},
    // ['Branch Office - Orbital Shipyard'] = {},
    // ['Branch Office - Reserve Bank Token'] = {},
    // ['Branch Office - Reserve Bank'] = {},
    // ['Branch Office - Tax Haven'] = {},
    // ['Branch Office'] = {},
    // ['Demi-Queen MdcKssK'] = {},
    // ['Designer TckVsk'] = {},
    // ['Dume Tathu'] = {},
    // ['Heart of Rebellion Token'] = {},
    // ['Jarl Vel & Jarl Jotrun'] = {},
    // ['Kantrus, The Lord'] = {},
    // ['Khaz-Rin Li-Zho'] = {},
    // ['Lactarious Indigo'] = {},
    // ['Liberator'] = {},
    // ['Myko-Mentori Commodity Token'] = {},
    // ['Omen Dice'] = {},
    // ['Omen Die'] = {},
    // ['Oro-Zhin Elite'] = {},
    // ['Read the Fates'] = {},
    // ['Singularity Point'] = {},
    // ['The Lord Flagship Card'] = {},
    // ['Trap: Account Siphon'] = {},
    // ['Trap: Feint'] = {},
    // ['Trap: Gravitic Inhibitor'] = {},
    // ['Trap: Interference Grid'] = {},
    // ['Trap: Minefields'] = {},
    // ['Traps'] = {},
    // ['Vera Khage'] = {},
    // ['Wound Token'] = {},
    // ['Zelian Asteroid Tile'] = {},
];

const REMOVE = [
    // Keleres is regsitered as several flavors, keep the argent one
    // where things are duplicated.
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

module.exports = { UNDRAFTABLE, REMOVE };
