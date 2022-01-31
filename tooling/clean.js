const chalk = require("colorette");
const fs = require("fs-extra");

console.log(chalk.yellow("Good Morning, Captain"));

if (!fs.existsSync("./config/local.json")) {
    console.error("this workspace has not yet been set up");
    console.error("run 'yarn setup' to begin");
    process.exit(1);
}

return Promise.all([
    fs.readJson("./config/local.json"),
    fs.readJson("./config/project.json"),
])
    .then(([localConfig, projectConfig]) => {
        return Promise.all([
            fs.remove(
                `${localConfig.ttpg_folder}/${
                    projectConfig.variants[projectConfig.defaultVariant].slug
                }_dev`
            ),
            fs.remove("./prd"),
            fs.remove("./dev"),
            fs.remove("./build"),
        ]);
    })
    .then(() => {
        console.log(chalk.green("All cleaned up"));
    })
    .catch((e) => {
        console.log(chalk.red("Something went wrong"));
        console.error(e);
    });
