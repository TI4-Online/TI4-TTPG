const fs = require('fs-extra');
const chalk = require('colorette');
const spawn = require('cross-spawn');

console.log(chalk.yellow("Good Morning, Captain"));

if (!(fs.existsSync('./config/local.json'))) {
    console.error("this workspace has not yet been set up");
    console.error("run 'yarn setup' to begin");
    process.exit(1);
}

const buildLangFile = (config) => {
    return Promise.all(
        config.variants[config.defaultVariant].lang.map((lang) => fs.readJson(`lang/${lang}.json`))
    ).then((langs) => {
        return langs.reduce((acc, thisLang) => {
            return {...acc, ...thisLang}
        }, {})
    }).then((langDef) => {
        return fs.writeFile(`src/lib/langdef.js`, `// System-generated file - do not edit. see lang/x.json\n\nmodule.exports = ${JSON.stringify(langDef, null, "\t")}`)
    })
}

const spawnDependencyDeploy = (config) => {
    return new Promise((resolve, reject) => {
        const child = spawn.spawn("yarn", [
            "install",
            "--modules-folder",
            `dev/${config.variants[config.defaultVariant].slug}_dev/Scripts/node_modules`,
            "--prod"
        ], { stdio: "pipe" });
        child.on('close', code => code > 0 ? reject(code) : resolve())
    })
}

const spawnBuilder = (config) => {
    if (config.transpile) {
        return new Promise((resolve, reject) => {
            const child = spawn.spawn("babel", [
                "src",
                "-d",
                `dev/${config.variants[config.defaultVariant].slug}_dev/Scripts`
            ], { stdio: "pipe" });
            child.on('close', code => code > 0 ? reject(code) : resolve())
        });
    } else {
        return fs.copy("./src", `dev/${config.variants[config.defaultVariant].slug}_dev/Scripts`);
    }
}

fs.readJson("./config/project.json").then((config) => {
    return buildLangFile(config).then(() => {
        return spawnBuilder(config).then(() => {
            return spawnDependencyDeploy(config).then(() => {
                console.log(chalk.white(`Done building: ${config.variants[config.defaultVariant].name} (Dev)`))
            })
        });
    })
}).then(() => {
    console.log(chalk.green("Good Hunting"));
}).catch((e) => {
    console.log(chalk.red("Something went wrong"));
    console.error(e);
})
