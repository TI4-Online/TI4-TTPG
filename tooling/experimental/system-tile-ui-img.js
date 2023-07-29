const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const MASK_PATH = path.normalize(
    "/Users/darrell/TI4-Online/TI4-TTPG/assets/Textures/global/ui/tiles/blank.png"
);

class SystemTileUiImg {
    static async writeUiTile(srcPath, dstPath) {
        console.log(`loading mask`);
        const mask = await sharp(MASK_PATH)
            .resize(512, 512, { fit: "fill" })
            .extractChannel("alpha")
            .toBuffer();

        console.log(`loading src "${srcPath}"`);
        const img = await sharp(srcPath)
            .extract({
                left: 70,
                top: 70,
                width: 884,
                height: 884,
            })
            .resize(512, 512, { fit: "fill" })
            .joinChannel(mask);

        console.log(`writing dst "${dstPath}"`);
        await img.toFile(dstPath);
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length !== 2) {
        console.log("call with input, output filenames");
        return;
    }

    const [srcPath, dstPath] = args;
    if (!fs.existsSync(srcPath)) {
        console.log("src does not exist");
        return;
    }
    if (fs.existsSync(dstPath)) {
        console.log("dst already exists");
        return;
    }

    await SystemTileUiImg.writeUiTile(srcPath, dstPath).catch((e) => {
        console.log(e);
    });
}

main();

//SystemTileUiImg.writeUiTile(
//   "/Users/darrell/TI4-Online/TI4-Homebrew/assets/Textures/discordant-stars/tiles/regular/tile_4243.jpg",
// "/Users/darrell/t.png"
//);
