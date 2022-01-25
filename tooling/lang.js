const fs = require("fs-extra");
const chalk = require("colorette");

// TODO: make this configurable for different variants
// TODO: clear out all the *massive* duplication between all the tooling scripts

const buildLangFile = async (config) => {
    const langs = await Promise.all(
        config.variants[config.defaultVariant].lang.map((lang) =>
            fs.readJson(`lang/${lang}.json`)
        )
    );
    const langDef = langs.reduce(
        (acc, thisLang) => ({ ...acc, ...thisLang }),
        {}
    );
    await fs.writeFile(
        `src/lib/langdef.js`,
        `module.exports = ${JSON.stringify(langDef, null, "\t")}`
    );
};

(async () => {
    const config = await fs.readJSON("./config/project.json");
    console.log(chalk.green("Building languages file for default variant"));
    await buildLangFile(config);
})();
