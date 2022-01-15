const fs = require('fs-extra');
const chalk = require('colorette');
const spawn = require('cross-spawn');

console.log(chalk.yellow("Good Morning, Captain"));

const setupWorkspace = (config) => {
    console.log("setting up production build...");

    return fs.readJson("./config/local.json").then((localConfig) => {

        const manifest = {
            Name: `${config.name}`,
            Version: config.version,
            GUID: config.guid.prd
        }

        console.log("building 'prd' folder");
        return Promise.all([
            fs.remove(`${localConfig.ttpg_folder}/${config.slug}`),
            fs.remove(`./prd/${config.slug}`)
        ]).then(() => {
            return fs.ensureDir(`./prd/${config.slug}`).then(() => {
                return fs.ensureFile(`./prd/${config.slug}/Manifest.json`).then(() => {
                    fs.writeJson(`./prd/${config.slug}/Manifest.json`, manifest).then(() => {
                        console.log("'prd' folder built");
                    })
                })
            }).then(() => {
                console.log("symlinking assets to prd folder");
                return Promise.all([
                    fs.createSymlink("./assets/Fonts", `./prd/${config.slug}/Fonts`, "junction"),
                    fs.createSymlink("./assets/Models", `./prd/${config.slug}/Models`, "junction"),
                    fs.createSymlink("./assets/Sounds", `./prd/${config.slug}/Sounds`, "junction"),
                    fs.createSymlink("./assets/States", `./prd/${config.slug}/States`, "junction"),
                    fs.createSymlink("./assets/Templates", `./prd/${config.slug}/Templates`, "junction"),
                    fs.createSymlink("./assets/Textures", `./prd/${config.slug}/Textures`, "junction"),
                    fs.createSymlink("./assets/Thumbnails", `./prd/${config.slug}/Thumbnails`, "junction"),
                    fs.ensureDir(`./prd/${config.slug}/Scripts/node_modules`)
                ])
            }).then(() => {
                console.log("symlinking to Tabletop Playground");
                return fs.createSymlink(`./prd/${config.slug}`, `${localConfig.ttpg_folder}/${config.slug}`, "junction").then(() => {
                    console.log("Tabletop Playground is now aware of this production bundle. Huzzah.");
                })
            })
        })
    })
};

const spawnDependencyDeploy = (config) => {
    return new Promise((resolve, reject) => {
        const child = spawn.spawn("yarn", [
            "install",
            "--modules-folder",
            `prd/${config.slug}/Scripts/node_modules`,
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
                `prd/${config.slug}/Scripts`
            ], { stdio: "pipe" });
            child.on('close', code => code > 0 ? reject(code) : resolve())
        });
    } else {
        return fs.copy("./src", `prd/${config.slug}/Scripts`);
    }
}

fs.readJson("./config/project.json").then((config) => {
    return setupWorkspace(config).then(() => {
        return spawnBuilder(config).then(() => {
            return spawnDependencyDeploy(config).then(() => {
                console.log(chalk.white(`Done building: ${config.name}`))
            })
        });
    })
}).then(() => {
    console.log(chalk.green("Good Hunting"));
}).catch((e) => {
    console.log(chalk.red("Something went wrong"));
    console.error(e);
})
