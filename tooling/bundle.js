const fs = require('fs-extra');
const chalk = require('colorette');
const archiver = require('archiver');
const spawn = require('cross-spawn');

console.log(chalk.yellow("Good Morning, Captain"));

// const variants = process.argv.length > 2 ? process.argv.splice(2) : ["primary"];

const spawnDependencyDeploy = (config) => {
    return new Promise((resolve, reject) => {
        const child = spawn.spawn("yarn", [
            "install",
            "--modules-folder",
            `build/Scripts/node_modules`,
            "--prod"
        ], { stdio: "pipe" });
        child.on('close', code => code > 0 ? reject(code) : resolve())
    })
}

const buildZip = (config) => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(`./bundles/${config.slug}_${config.version}.zip`);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        const manifest = {
            Name: config.name,
            Version: config.version,
            GUID: config.guid.prd
        }
        output.on("close", () => {
            console.log(chalk.white("Zip Compiled"))
            resolve();
        });
        archive.on('warning', function(err) {
            if (err.code === 'ENOENT') {
                console.log(err);
            } else {
                reject(err);
            }
        });
        archive.pipe(output);
        archive.glob('**', {cwd: './assets/'});
        archive.glob('**', {cwd: './build/'});
        archive.append(Buffer.from(JSON.stringify(manifest)), { name: "Manifest.json" })
        archive.finalize();
    })
}

const spawnBuilder = (config) => {
    if (config.transpile) {
        return new Promise((resolve, reject) => {
            const child = spawn.spawn("babel", [
                "src",
                "-d",
                `build/Scripts`
            ], { stdio: "pipe" });
            child.on('close', code => code > 0 ? reject(code) : resolve())
        });
    } else {
        return fs.copy("./src", `build/Scripts`);
    }
}

Promise.all([
    fs.readJson("./config/project.json"),
    fs.ensureDir("./bundles"),
    fs.remove("./build")
]).then(([config]) => {
    return spawnBuilder(config).then(() => {
        return spawnDependencyDeploy(config).then(() => {
            return buildZip(config).then(() => {
                console.log(chalk.white(`Done bundling: ${config.name} (Production)`))
            })
        })
    });
}).catch((e) => {
    console.log(chalk.red("Something went wrong"));
    console.error(chalk.red(e));
})
