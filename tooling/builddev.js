const fs = require('fs-extra');
const chalk = require('colorette');
const spawn = require('cross-spawn');

console.log(chalk.yellow("Good Morning, Captain"));

const spawnDependencyDeploy = (config) => {
    return new Promise((resolve, reject) => {
        const child = spawn.spawn("yarn", [
            "install",
            "--modules-folder",
            `dev/${config.slug}_dev/Scripts/node_modules`,
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
                `dev/${config.slug}_dev/Scripts`
            ], { stdio: "pipe" });
            child.on('close', code => code > 0 ? reject(code) : resolve())
        });
    } else {
        return fs.copy("./src", `dev/${config.slug}_dev/Scripts`);
    }
}

fs.readJson("./config/project.json").then((config) => {
    return spawnBuilder(config).then(() => {
        return spawnDependencyDeploy(config).then(() => {
            console.log(chalk.white(`Done building: ${config.name} (Dev)`))
        })
    });
}).then(() => {
    console.log(chalk.green("Good Hunting"));
}).catch((e) => {
    console.log(chalk.red("Something went wrong"));
    console.error(e);
})
