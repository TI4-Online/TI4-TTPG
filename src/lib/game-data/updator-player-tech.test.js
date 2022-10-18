require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-tech");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("player.tech", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    world.__clear();
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.technology.red:base/plasma_scoring",
                }),
            ],
            position: playerDesks[0].center,
        })
    );
    // dup
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.technology.red:base/plasma_scoring",
                }),
            ],
            position: playerDesks[0].center,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].technologies, ["Plasma Scoring"]);
});

it("all tech including omega nsids", () => {
    const nsids = [
        "card.technology.blue.creuss:base/wormhole_generator",
        "card.technology.blue.creuss:base/wormhole_generator.omega",
        "card.technology.blue.empyrean:pok/aetherstream",
        "card.technology.blue.jolnar:base/spacial_conduit_cylinder",
        "card.technology.blue.saar:base/chaos_mapping",
        "card.technology.blue.winnu:base/lazax_gate_folding",
        "card.technology.blue:base/antimass_deflectors",
        "card.technology.blue:base/fleet_logistics",
        "card.technology.blue:base/gravity_drive",
        "card.technology.blue:base/lightwave_deflector",
        "card.technology.blue:pok/dark_energy_tap",
        "card.technology.blue:pok/sling_relay",
        "card.technology.green.arborec:base/bioplasmosis",
        "card.technology.green.empyrean:pok/voidwatch",
        "card.technology.green.hacan:base/production_biomes",
        "card.technology.green.mahact:pok/genetic_recombination",
        "card.technology.green.naalu:base/neuroglaive",
        "card.technology.green.naazrokha:pok/prefab_arcologies",
        "card.technology.green.xxcha:base/instinct_training",
        "card.technology.green.yin:base/yin_spinner",
        "card.technology.green.yin:base/yin_spinner.omega",
        "card.technology.green.yssaril:base/mageon_implants",
        "card.technology.green.yssaril:base/transparasteel_plating",
        "card.technology.green:base/dacxive_animators",
        "card.technology.green:base/hyper_metabolism",
        "card.technology.green:base/neural_motivator",
        "card.technology.green:base/x89_bacterial_weapon",
        "card.technology.green:base/x89_bacterial_weapon.omega",
        "card.technology.green:pok/biostims",
        "card.technology.green:pok/psychoarchaeology",
        "card.technology.red.creuss:base/dimensional_splicer",
        "card.technology.red.letnev:base/noneuclidean_shielding",
        "card.technology.red.muaat:base/magmus_reactor",
        "card.technology.red.muaat:base/magmus_reactor.omega",
        "card.technology.red.naazrokha:pok/supercharge",
        "card.technology.red.norr:base/valkyrie_particle_weave",
        "card.technology.red.vuilraith:pok/vortex",
        "card.technology.red:base/assault_cannon",
        "card.technology.red:base/duranium_armor",
        "card.technology.red:base/magen_defense_grid",
        "card.technology.red:base/plasma_scoring",
        "card.technology.red:pok/ai_development_algorithm",
        "card.technology.red:pok/self_assembly_routines",
        "card.technology.unit_upgrade.arborec:base/letani_warrior_2",
        "card.technology.unit_upgrade.argent:pok/strike_wing_alpha_2",
        "card.technology.unit_upgrade.l1z1x:base/superdreadnought_2",
        "card.technology.unit_upgrade.mahact:pok/crimson_legionnaire_2",
        "card.technology.unit_upgrade.muaat:base/prototype_war_sun_2",
        "card.technology.unit_upgrade.naalu:base/hybrid_crystal_fighter_2",
        "card.technology.unit_upgrade.nekro:codex.ordinian/redacted",
        "card.technology.unit_upgrade.nomad:pok/memoria_2",
        "card.technology.unit_upgrade.norr:base/exotrireme_2",
        "card.technology.unit_upgrade.saar:base/floating_factory_2",
        "card.technology.unit_upgrade.sol:base/advanced_carrier_2",
        "card.technology.unit_upgrade.sol:base/spec_ops_2",
        "card.technology.unit_upgrade.ul:pok/heltitan_2",
        "card.technology.unit_upgrade.ul:pok/saturn_engine_2",
        "card.technology.unit_upgrade.vuilraith:pok/dimensional_tear_2",
        "card.technology.unit_upgrade:base/carrier_2",
        "card.technology.unit_upgrade:base/cruiser_2",
        "card.technology.unit_upgrade:base/destroyer_2",
        "card.technology.unit_upgrade:base/dreadnought_2",
        "card.technology.unit_upgrade:base/fighter_2",
        "card.technology.unit_upgrade:base/infantry_2",
        "card.technology.unit_upgrade:base/pds_2",
        "card.technology.unit_upgrade:base/space_dock_2",
        "card.technology.unit_upgrade:base/war_sun",
        "card.technology.unknown.nekro:base/valefar_assimilator_x",
        "card.technology.unknown.nekro:base/valefar_assimilator_y",
        "card.technology.yellow.argent:pok/aerie_hololattice",
        "card.technology.yellow.hacan:base/quantum_datahub_node",
        "card.technology.yellow.jolnar:base/eres_siphons",
        "card.technology.yellow.keleres:codex.vigil/agency_supply_network",
        "card.technology.yellow.keleres:codex.vigil/iihq_modernization",
        "card.technology.yellow.l1z1x:base/inheritance_systems",
        "card.technology.yellow.letnev:base/l4_disruptors",
        "card.technology.yellow.mentak:base/mirror_computing",
        "card.technology.yellow.mentak:base/salvage_operations",
        "card.technology.yellow.nekro:codex.ordinian/exception_no_id",
        "card.technology.yellow.nomad:pok/temporal_command_suite",
        "card.technology.yellow.winnu:base/hegemonic_trade_policy",
        "card.technology.yellow.xxcha:base/nullification_field",
        "card.technology.yellow.yin:base/impulse_core",
        "card.technology.yellow:base/graviton_laser_system",
        "card.technology.yellow:base/integrated_economy",
        "card.technology.yellow:base/sarween_tools",
        "card.technology.yellow:base/transit_diodes",
        "card.technology.yellow:pok/predictive_intelligence",
        "card.technology.yellow:pok/scanlink_drone_network",
    ];

    world.__clear();

    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const pos = playerDesks[0].center;
    for (const nsid of nsids) {
        const card = MockCard.__create(nsid, pos);
        world.__addObject(card);
    }
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].technologies, [
        "Wormhole Generator",
        "Aetherstream",
        "Spacial Conduit Cylinder",
        "Chaos Mapping",
        "Lazax Gate Folding",
        "Antimass Deflectors",
        "Fleet Logistics",
        "Gravity Drive",
        "Light-Wave Deflector",
        "Dark Energy Tap",
        "Sling Relay",
        "Bioplasmosis",
        "Voidwatch",
        "Production Biomes",
        "Genetic Recombination",
        "Neuroglaive",
        "Pre-Fab Arcologies",
        "Instinct Training",
        "Yin Spinner",
        "Mageon Implants",
        "Transparasteel Plating",
        "Dacxive Animators",
        "Hyper Metabolism",
        "Neural Motivator",
        "X-89 Bacterial Weapon",
        "Bio-Stims",
        "Psychoarchaeology",
        "Dimensional Splicer",
        "Non-Euclidean Shielding",
        "Magmus Reactor",
        "Supercharge",
        "Valkyrie Particle Weave",
        "Vortex",
        "Assault Cannon",
        "Duranium Armor",
        "Magen Defense Grid",
        "Plasma Scoring",
        "AI Development Algorithm",
        "Self Assembly Routines",
        "Letani Warrior II",
        "Strike Wing Alpha II",
        "Super-Dreadnought II",
        "Crimson Legionnaire II",
        "Prototype War Sun II",
        "Hybrid Crystal Fighter II",
        "????_REDACTED_????",
        "Memoria II",
        "Exotrireme II",
        "Floating Factory II",
        "Advanced Carrier II",
        "Spec Ops II",
        "Hel-Titan II",
        "Saturn Engine II",
        "Dimensional Tear II",
        "Carrier II",
        "Cruiser II",
        "Destroyer II",
        "Dreadnought II",
        "Fighter II",
        "Infantry II",
        "PDS II",
        "Space Dock II",
        "War Sun",
        "Valefar Assimilator X",
        "Valefar Assimilator Y",
        "Aerie Hololattice",
        "Quantum Datahub Node",
        "E-res Siphons",
        "Agency Supply Network",
        "I.I.H.Q. Modernization",
        "Inheritance Systems",
        "L4 Disruptors",
        "Mirror Computing",
        "Salvage Operations",
        "???_EXCEPTION_NO_ID_???",
        "Temporal Command Suite",
        "Hegemonic Trade Policy",
        "Nullification Field",
        "Impulse Core",
        "Graviton Laser System",
        "Integrated Economy",
        "Sarween Tools",
        "Transit Diodes",
        "Predictive Intelligence",
        "Scanlink Drone Network",
    ]);
});
