const fs = require('fs-extra');
const chalk = require('colorette');
const archiver = require('archiver');
const spawn = require('cross-spawn');

console.log(chalk.yellow("Good Morning, Captain"));

if (!(fs.existsSync('./config/local.json'))) {
    console.error("this workspace has not yet been set up");
    console.error("run 'yarn setup' to begin");
    process.exit(1);
}

const projectConfig = fs.readJsonSync("./config/project.json");
const localConfig = fs.readJsonSync("./config/local.json");

const variant = process.argv.length > 2 ? process.argv[2] : projectConfig.defaultVariant;

console.log(variant);

if (!(variant in projectConfig.variants)) {
    console.error("I'm not familiar with that variant");
    process.exit(1);
}

const variantConfig = projectConfig.variants[variant];

// const variants = process.argv.length > 2 ? process.argv.splice(2) : ["primary"];

const spawnDependencyDeploy = () => {
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

const buildZip = () => {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(`./bundles/${variantConfig.slug}_${variantConfig.version}.zip`);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        const manifest = {
            Name: variantConfig.name,
            Version: variantConfig.version,
            GUID: variantConfig.guid.prd
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

        const assetListing = [
            ...projectConfig.assets,
            ...('assets' in variantConfig ? variantConfig.assets : [])
        ];

        assetListing.forEach(({ from, to }) => {
            console.log(`./assets/${from}`, "->", to);
            archive.directory(`./assets/${from}`, to);
        })
        archive.glob('**', {cwd: './build/'});
        archive.append(Buffer.from(JSON.stringify(manifest)), { name: "Manifest.json" })
        archive.finalize();
    })
}

const spawnBuilder = () => {
    if (variantConfig.transpile) {
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
    fs.ensureDir("./bundles", 0o2775),
    fs.remove("./build")
]).then(() => {
    return spawnBuilder().then(() => {
        return spawnDependencyDeploy().then(() => {
            return buildZip().then(() => {
                console.log(chalk.white(`Done bundling: ${variantConfig.name} (Production)`))
            })
        })
    });
}).catch((e) => {
    console.log(chalk.red("Something went wrong"));
    console.error(chalk.red(e));
})
