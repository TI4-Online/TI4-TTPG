const fs = require("fs-extra");
const chalk = require("colorette");
const spawn = require("cross-spawn");

console.log(chalk.yellow("Good Morning, Captain"));

if (!fs.existsSync("./config/local.json")) {
    console.error("this workspace has not yet been set up");
    console.error("run 'yarn setup' to begin");
    process.exit(1);
}

const projectConfig = fs.readJsonSync("./config/project.json");
const localConfig = fs.readJsonSync("./config/local.json");

const variant =
    process.argv.length > 2 ? process.argv[2] : projectConfig.defaultVariant;

if (!(variant in projectConfig.variants)) {
    console.error("I'm not familiar with that variant");
    process.exit(1);
}

const variantConfig = projectConfig.variants[variant];

const setupWorkspace = () => {
    console.log("setting up production build...");
    const manifest = {
        Name: variantConfig.name,
        Version: variantConfig.version,
        GUID: variantConfig.guid.prd,
        ModID: variantConfig.modId.prd,
    };

    console.log("building 'prd' folder");
    return Promise.all([
        fs.remove(`${localConfig.ttpg_folder}/${variantConfig.slug}`),
        fs.remove(`./prd/${variantConfig.slug}`),
    ]).then(() => {
        // make sure all the directories we need exist.
        return fs
            .ensureDir(`./prd/${variantConfig.slug}`, 0o2775)
            .then(() => {
                return fs
                    .ensureFile(`./prd/${variantConfig.slug}/Manifest.json`)
                    .then(() => {
                        fs.writeJson(
                            `./prd/${variantConfig.slug}/Manifest.json`,
                            manifest
                        ).then(() => {
                            fs.ensureDir(
                                `./prd/${variantConfig.slug}/Scripts/node_modules`,
                                0o2775
                            ).then(() => {
                                console.log("'prd' folder built");
                            });
                        });
                    });
            })
            .then(() => {
                console.log("copying contents...");

                const assetListing = [
                    ...projectConfig.assets,
                    ...("assets" in variantConfig ? variantConfig.assets : []),
                ];

                return Promise.all(
                    assetListing.map(({ from, to }) => {
                        console.log(
                            `./assets/${from}`,
                            "->",
                            `./prd/${variantConfig.slug}/${to}`
                        );
                        return fs.copy(
                            `./assets/${from}`,
                            `./prd/${variantConfig.slug}/${to}`
                        );
                    })
                );
            })
            .then(() => {
                console.log("symlinking to Tabletop Playground");
                console.log(localConfig.ttpg_folder);
                return fs
                    .createSymlink(
                        `./prd/${variantConfig.slug}`,
                        `${localConfig.ttpg_folder}/${variantConfig.slug}`,
                        "junction"
                    )
                    .then(() => {
                        console.log(
                            "Tabletop Playground is now aware of this production bundle. Huzzah."
                        );
                    });
            });
    });
};

const buildLangFile = () => {
    return Promise.all(
        variantConfig.lang.map((lang) => fs.readJson(`lang/${lang}.json`))
    )
        .then((langs) => {
            return langs.reduce((acc, thisLang) => {
                return { ...acc, ...thisLang };
            }, {});
        })
        .then((langDef) => {
            return fs.writeFile(
                `src/lib/langdef.js`,
                `// System-generated file - do not edit. see lang/x.json\n\nmodule.exports = ${JSON.stringify(
                    langDef,
                    null,
                    "\t"
                )}`
            );
        });
};

const spawnDependencyDeploy = () => {
    return new Promise((resolve, reject) => {
        const child = spawn.spawn(
            "yarn",
            [
                "install",
                "--modules-folder",
                `./prd/${variantConfig.slug}/Scripts/node_modules`,
                "--prod",
            ],
            { stdio: "pipe" }
        );
        child.on("close", (code) => (code > 0 ? reject(code) : resolve()));
    });
};

const spawnBuilder = () => {
    if (variantConfig.transpile) {
        return new Promise((resolve, reject) => {
            const child = spawn.spawn(
                "babel",
                ["src", "-d", `./prd/${variantConfig.slug}/Scripts`],
                { stdio: "pipe" }
            );
            child.on("close", (code) => (code > 0 ? reject(code) : resolve()));
        });
    } else {
        return fs.copy("./src", `./prd/${variantConfig.slug}/Scripts`);
    }
};

setupWorkspace()
    .then(() => {
        return buildLangFile().then(() => {
            return spawnBuilder().then(() => {
                return spawnDependencyDeploy().then(() => {
                    console.log(
                        chalk.white(`Done building: ${variantConfig.name}`)
                    );
                });
            });
        });
    })
    .then(() => {
        console.log(chalk.green("Good Hunting"));
    })
    .catch((e) => {
        console.log(chalk.red("Something went wrong"));
        console.error(e);
    });
