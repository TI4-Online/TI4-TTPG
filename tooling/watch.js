const fs = require("fs-extra");
const chalk = require("colorette");
const spawn = require("cross-spawn");
const chokidar = require("chokidar");

console.log(chalk.yellow("Good Morning, Captain"));

if (!fs.existsSync("./config/local.json")) {
    console.error("this workspace has not yet been set up");
    console.error("run 'yarn setup' to begin");
    process.exit(1);
}

const buildLangFile = (config) => {
    return Promise.all(
        config.variants[config.defaultVariant].lang.map((lang) =>
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
                `module.exports = ${JSON.stringify(langDef, null, "\t")}`
            );
        });
};

const spawnWatcher = (config) => {
    if (config.transpile) {
        return new Promise((resolve, reject) => {
            const child = spawn.spawn(
                "yarn",
                [
                    "babel",
                    "src",
                    "--watch",
                    "--out-dir",
                    `dev/${
                        config.variants[config.defaultVariant].slug
                    }_dev/Scripts`,
                ],
                { stdio: "pipe" }
            );
            child.on("close", (code) => (code > 0 ? reject(code) : resolve()));
        });
    } else {
        return new Promise((resolve, reject) => {
            const watcher = chokidar.watch("./**", {
                cwd: "./src",
                ignored: /(^|[/\\])\../,
            });

            const doCopy = (path) => {
                if (path) {
                    fs.copy(
                        `./src/${path}`,
                        `./dev/${
                            config.variants[config.defaultVariant].slug
                        }_dev/Scripts/${path}`
                    ).catch((e) => {
                        console.error(e);
                    });
                }
            };

            watcher.on("addDir", doCopy);
            watcher.on("add", doCopy);
            watcher.on("change", doCopy);
            watcher.on("error", (e) => {
                reject(e);
            });
        });
    }
};

fs.readJson("./config/project.json")
    .then((config) => {
        console.log(chalk.green("Who watches the watchman"));
        return buildLangFile(config).then(() => {
            return spawnWatcher(config);
        });
    })
    .then((e) => {
        console.log(chalk.green("Signing off"));
    })
    .catch((e) => {
        console.log(chalk.red("something went wrong"));
        console.error(e);
    });
