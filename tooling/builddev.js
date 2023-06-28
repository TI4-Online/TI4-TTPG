const fs = require("fs-extra");
const chalk = require("colorette");
const spawn = require("cross-spawn");
const { minimatch } = require("minimatch");

console.log(chalk.yellow("Good Morning, Captain"));

const EXCLUDE_MOCK = (src, dest) => {
    if (minimatch(src, "src/mock") || minimatch(src, "**/*.test.js")) {
        return false;
    }
    return true;
};

if (!fs.existsSync("./config/local.json")) {
    console.error("this workspace has not yet been set up");
    console.error("run 'yarn setup' to begin");
    process.exit(1);
}

const buildLangFile = (config, variant) => {
    return Promise.all(
        config.variants[variant].lang.map((lang) =>
            fs.readJson(`lang/${lang}.json`)
        )
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

const spawnDependencyDeploy = (config, variant) => {
    return new Promise((resolve, reject) => {
        const child = spawn.spawn(
            "yarn",
            [
                "install",
                "--modules-folder",
                `dev/${config.variants[variant].slug}_dev/Scripts/node_modules`,
                "--prod",
            ],
            { stdio: "pipe" }
        );
        child.on("close", (code) => (code > 0 ? reject(code) : resolve()));
    });
};

const spawnBuilder = (config, variant) => {
    if (config.transpile) {
        return new Promise((resolve, reject) => {
            const child = spawn.spawn(
                "babel",
                [
                    "src",
                    "-d",
                    `dev/${config.variants[variant].slug}_dev/Scripts`,
                ],
                { stdio: "pipe" }
            );
            child.on("close", (code) => (code > 0 ? reject(code) : resolve()));
        });
    } else {
        return fs.copy(
            "./src",
            `dev/${config.variants[variant].slug}_dev/Scripts`,
            {
                filter: EXCLUDE_MOCK,
            }
        );
    }
};

fs.readJson("./config/project.json")
    .then((config) => {
        console.log(process.argv[2] ?? config.defaultVariant);
        const theVariant = process.argv[2] ?? config.defaultVariant;
        if (!(theVariant in config.variants)) {
            return Promise.reject(`No such variant '${theVariant}' found`);
        }
        return buildLangFile(config, theVariant).then(() => {
            return spawnBuilder(config, theVariant).then(() => {
                return spawnDependencyDeploy(config, theVariant).then(() => {
                    console.log(
                        chalk.white(
                            `Done building: ${config.variants[theVariant].name} (Dev)`
                        )
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
