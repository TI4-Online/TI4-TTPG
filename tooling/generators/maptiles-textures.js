const fs = require("fs-extra");
const klawSync = require("klaw-sync"); // walk file system
const path = require("path");
const sharp = require("sharp");
const assert = require("assert");

const SRC_TEXTURES_DIR = path.normalize("prebuild/Textures/");
const DST_TEXTURES_DIR = path.normalize("assets/Textures/");

const DEFAULT_OPTIONS = {
    brightness: 0.927,
    saturation: 1.377,
    contrast: 0.844,
};

/**
 * Adjust system tile image, adjusting contrast, etc for bundling with build.
 *
 * "Brightness": overall lightness of an image.
 *
 * "Contrast": difference in brightness between light and dark areas.
 *
 * "Saturation": intensity of color, increasing saturation further separates
 * red, green and blue values.
 * Saturation = Max(R,G,B)-Min(R,G,B)/Max(R,G,B)
 *
 */
class MapTilesTextures {
    static async fuzzyMatch(ttpg, tts) {
        assert(ttpg);
        assert(tts);

        // Blur to reduce stipple effect, overall color balance reflected.
        ttpg = await ttpg.blur(4);
        tts = await tts.blur(4);

        // Crop to inside system tile image (ignore bleed area even after blur).
        // These crop values are chosen to just fit the arc lines around Sol.
        ttpg = await ttpg.extract({
            left: 268,
            top: 216,
            width: 454,
            height: 484,
        });
        tts = await tts.extract({
            left: 233,
            top: 177,
            width: 510,
            height: 549,
        });

        // Resize for a 1:1 match.  Make sure to "fill" to stretch!
        const w = 512;
        const h = 512;
        ttpg = await ttpg.resize(w, h, { fit: "fill" });
        tts = await tts.resize(w, h, { fit: "fill" });

        await ttpg.toFile("/Users/darrell/t-ttpg.jpg");
        await tts.toFile("/Users/darrell/t-tts.jpg");

        // // Write an image to eyeball they're the same region.
        // let composite = [];
        // for (let x = 0; x < w - 3; x += 3) {
        //     const src = x % 2 === 1 ? tts : ttpg;
        //     const tint = {
        //         r: x % 2 === 1 ? 64 : 0,
        //         g: x % 2 === 1 ? 0 : 64,
        //         b: 0,
        //     };
        //     const sliver = await src
        //         .extract({
        //             left: x,
        //             top: 0,
        //             width: 3,
        //             height: h,
        //         })
        //         .tint(tint);
        //     composite.push({
        //         input: await sliver.toBuffer(),
        //         top: 0,
        //         left: x,
        //     });
        // }
        // await sharp({
        //     create: {
        //         channels: 3,
        //         background: { r: 0, g: 0, b: 0 },
        //         width: w,
        //         height: h,
        //     },
        // })
        //     .composite(composite)
        //     .toFile("/Users/darrell/t-slivers-x.jpg");
        // composite = [];
        // for (let y = 0; y < h - 3; y += 3) {
        //     const src = y % 2 === 1 ? tts : ttpg;
        //     const tint = {
        //         r: y % 2 === 1 ? 64 : 0,
        //         g: y % 2 === 1 ? 0 : 64,
        //         b: 0,
        //     };
        //     const sliver = await src
        //         .extract({
        //             left: 0,
        //             top: y,
        //             width: w,
        //             height: 3,
        //         })
        //         .tint(tint);
        //     composite.push({
        //         input: await sliver.toBuffer(),
        //         top: y,
        //         left: 0,
        //     });
        // }
        // await sharp({
        //     create: {
        //         channels: 3,
        //         background: { r: 0, g: 0, b: 0 },
        //         width: w,
        //         height: h,
        //     },
        // })
        //     .composite(composite)
        //     .toFile("/Users/darrell/t-slivers-y.jpg");
        // throw new Error("STOP HERE");

        // Extract pixel RGB data.
        ttpg = await ttpg.raw().toBuffer();
        ttpg = new Uint8ClampedArray(ttpg.buffer);
        tts = await tts.raw().toBuffer();
        tts = new Uint8ClampedArray(tts.buffer);

        assert.equal(ttpg.length, tts.length);

        let delta = 0;
        for (let i = 0; i < ttpg.length; i++) {
            delta += Math.abs(ttpg[i] - tts[i]);
        }
        return delta;
    }

    static async seekImageSpace(
        srcAbsolutePath,
        matchTtsAbsolutePath,
        params,
        depth = 0
    ) {
        assert(typeof srcAbsolutePath === "string");
        assert(fs.existsSync(srcAbsolutePath));
        assert(typeof matchTtsAbsolutePath === "string");
        assert(fs.existsSync(matchTtsAbsolutePath));
        assert(params);
        assert(params.brightness.stepSize > 0);
        assert(params.saturation.stepSize > 0);
        assert(params.contrast.stepSize > 0);

        let best = undefined;
        let bestValue = Number.MAX_SAFE_INTEGER;

        for (
            let brightness = params.brightness.min;
            brightness <= params.brightness.max;
            brightness += params.brightness.stepSize
        ) {
            for (
                let saturation = params.saturation.min;
                saturation <= params.saturation.max;
                saturation += params.saturation.stepSize
            ) {
                for (
                    let contrast = params.contrast.min;
                    contrast <= params.contrast.max;
                    contrast += params.contrast.stepSize
                ) {
                    const options = { brightness, saturation, contrast };
                    let img = await sharp(srcAbsolutePath); // work with a fresh copy
                    let tts = await sharp(matchTtsAbsolutePath); // work with a fresh copy
                    img = await MapTilesTextures.processOneRaw(img, options);
                    const value = await MapTilesTextures.fuzzyMatch(img, tts);
                    console.log(
                        `test@${depth} ${value}: ${JSON.stringify(options)}`
                    );
                    if (value < bestValue) {
                        best = options;
                        bestValue = value;
                    }
                }
            }
        }

        console.log(`best@${depth} ${bestValue}: ${JSON.stringify(best)}`);

        // Stop iterating when the search space is too small.
        const stopWhen = 0.001;
        if (
            params.brightness.stepSize < stopWhen &&
            params.saturation.stepSize < stopWhen &&
            params.contrast.stepSize < stopWhen
        ) {
            return;
        }

        // Repeat with a smaller step size around the best.
        const extra = 2; // watch out for local maxima.
        params = {
            brightness: {
                min: best.brightness - params.brightness.stepSize * extra,
                max: best.brightness + params.brightness.stepSize * extra,
                stepSize: params.brightness.stepSize / 2,
            },
            saturation: {
                min: best.saturation - params.saturation.stepSize * extra,
                max: best.saturation + params.saturation.stepSize * extra,
                stepSize: params.saturation.stepSize / 2,
            },
            contrast: {
                min: best.contrast - params.contrast.stepSize * extra,
                max: best.contrast + params.contrast.stepSize * extra,
                stepSize: params.contrast.stepSize / 2,
            },
        };

        await MapTilesTextures.seekImageSpace(
            srcAbsolutePath,
            matchTtsAbsolutePath,
            params,
            depth + 1
        );
    }

    /**
     * Draw an image showing the effects of the various image manipulation
     * parameters.  Useful to eyeball what settings to use.
     *
     * @param {string} srcAbsolutePath
     * @param {string} dstAbsolutePath
     */
    static async visualizeImageSpace(
        srcAbsolutePath,
        dstAbsolutePath,
        matchTtsAbsolutePath
    ) {
        assert(typeof srcAbsolutePath === "string");
        assert(typeof dstAbsolutePath === "string");
        assert(fs.existsSync(srcAbsolutePath));
        assert(srcAbsolutePath !== dstAbsolutePath);

        const srcBuffer = await sharp(srcAbsolutePath).toBuffer();

        const brightness = {
            // float multiplier
            min: 0.76,
            max: 0.96,
            steps: 20,
        };
        const saturation = {
            // float multiplier
            min: 1.32,
            max: 1.52,
            steps: 20,
        };
        const contrast = {
            // float 0-100, 0 = off
            min: 0.7,
            max: 0.9,
            steps: 21,
        };

        const db = (brightness.max - brightness.min) / brightness.steps;
        const ds = (saturation.max - saturation.min) / saturation.steps;
        const dc = (contrast.max - contrast.min) / (contrast.steps - 1);

        const composite = [];
        for (let bi = 0; bi < brightness.steps; bi++) {
            for (let si = 0; si < saturation.steps; si++) {
                for (let ci = 0; ci < contrast.steps; ci++) {
                    const options = {
                        brightness: brightness.min + bi * db,
                        saturation: saturation.min + si * ds,
                        contrast: contrast.min + ci * dc,
                    };

                    const text = `[b:${options.brightness.toFixed(
                        3
                    )}, s:${options.saturation.toFixed(
                        3
                    )}, c:${options.contrast.toFixed(3)}]`;

                    const x = bi * 1024;
                    const y = si * 1024 * contrast.steps + ci * 1024;

                    // Generate image.
                    const src = await sharp(srcBuffer);
                    const dst = await MapTilesTextures.processOneRaw(
                        src,
                        options
                    );
                    composite.push({
                        input: await dst.toBuffer(),
                        top: y,
                        left: x,
                    });

                    // If matching, report how close.
                    let value = undefined;
                    if (matchTtsAbsolutePath) {
                        // Reload each time in case mutated.
                        // Offline search: this is allowed to be sloppy.
                        const matchTTS = await sharp(matchTtsAbsolutePath);
                        value = await MapTilesTextures.fuzzyMatch(
                            dst,
                            matchTTS
                        );
                    }

                    console.log(`${value} ${text}`);

                    // Write options on image
                    const textWidth = 1024;
                    const textHeight = 200;
                    const svgText = `
                    <svg width="${textWidth}" height="${textHeight}">
                      <style>
                        .title { fill: red; font-size: 85px}
                      </style>
                      <text x="45%" y="40%" text-anchor="middle" class="title">${text}</text>
                    </svg>`;
                    const svgBuffer = Buffer.from(svgText);
                    composite.push({
                        input: svgBuffer,
                        top: y + textHeight / 2,
                        left: x,
                    });
                }
            }
        }

        await sharp({
            create: {
                channels: 3,
                background: { r: 0, g: 0, b: 0 },
                width: 1024 * brightness.steps,
                height: 1024 * saturation.steps * contrast.steps,
            },
        })
            .composite(composite)
            .toFile(dstAbsolutePath);
    }

    /**
     * Get system tile images to process.
     *
     * @returns {Array.{string}} - relative paths (from src dir) to input files
     */
    static getAllSrcRelativePaths() {
        return klawSync(SRC_TEXTURES_DIR, {
            nodir: true,
            traverseAll: true,
            filter: (entry) => {
                // Require files (not dirs).  The 'nodir' option fails here
                // because we use 'traverseAll' to traverse all directories
                // even when this filter fails.
                if (fs.statSync(entry.path).isDirectory()) {
                    return false;
                }

                // Require files be under "${locale}/tiles/" dirs
                // (as opposed to cards, etc).
                const relative = path.relative(SRC_TEXTURES_DIR, entry.path);
                if (relative.split(path.sep)[1] !== "tiles") {
                    return false; // not a tile
                }

                // Require the file have a tile number.  Some special "mask"
                // style images exist that should not be mutated.
                const filename = path.basename(entry.path);
                const m = filename.match(/^tile_[0-9]+/);
                if (!m) {
                    return false;
                }

                // Require jpg/png.
                const ext = path.extname(entry.path).toLowerCase();
                return ext === ".jpg" || ext === ".jpeg" || ext === ".png";
            },
        }).map((entry) => {
            // Return relative paths, suitable for joining with SRC/DST dirs.
            return path.relative(SRC_TEXTURES_DIR, entry.path);
        });
    }

    static async processOneRelative(relativePath, options = DEFAULT_OPTIONS) {
        const srcAbsolutePath = path.join(SRC_TEXTURES_DIR, relativePath);
        const dstAbsolutePath = path.join(DST_TEXTURES_DIR, relativePath);
        assert(srcAbsolutePath !== dstAbsolutePath);
        assert(fs.existsSync(srcAbsolutePath));

        const src = await sharp(srcAbsolutePath);
        const dst = await MapTilesTextures.processOneRaw(src, options);
        await dst.toFile(dstAbsolutePath);
    }

    static async processOneRaw(src, options) {
        assert(src);
        assert(options);

        let img = src;

        if (options.contrast !== 1) {
            // The CLAHE "contrast limiting adaptive histogram equalization"
            // operation gives poor results (tried varying both size and slope).
            // Instead, do a linear clamp about 0.5 and let brightness shift
            // it if necessary.
            img = await img.linear(
                options.contrast,
                128 - 128 * options.contrast
            );
        }

        if (options.brightness !== 1 || options.saturation !== 2) {
            img = await img.modulate({
                brightness: options.brightness,
                saturation: options.saturation,
            });
        }

        return img;
    }
}

//const srcs = MapTilesTextures.getAllSrcRelativePaths();
//console.log(srcs.join("\n"));

const srcAbsolutePath = path.join(
    SRC_TEXTURES_DIR,
    "en/tiles/base/homeworld/tile_001.jpg"
);
const dstAbsolutePath = "/Users/darrell/test.jpg";
const matchTtsAbsolutePath = "/Users/darrell/Downloads/tts_tile_001.jpg";

const VISUALIZE = false;
if (VISUALIZE) {
    MapTilesTextures.visualizeImageSpace(
        srcAbsolutePath,
        dstAbsolutePath,
        matchTtsAbsolutePath
    );
}

const EXPLORE = false;
if (EXPLORE) {
    // best@8 4626983: {"brightness":0.92734375,"saturation":1.3773437499999992,"contrast":0.84375}
    const params = {
        brightness: {
            min: 0,
            max: 2,
            stepSize: 0.2,
        },
        saturation: {
            min: 0,
            max: 4,
            stepSize: 0.2,
        },
        contrast: {
            min: 0,
            max: 2,
            stepSize: 0.2,
        },
    };
    MapTilesTextures.seekImageSpace(
        srcAbsolutePath,
        matchTtsAbsolutePath,
        params
    );
}

const TEST_ONE = false;
if (TEST_ONE) {
    const relativePath = "en/tiles/base/homeworld/tile_001.jpg";
    MapTilesTextures.processOneRelative(relativePath);
}

const PROCESS_ALL = true;
if (PROCESS_ALL) {
    // This is the normal behavior.
    const srcs = MapTilesTextures.getAllSrcRelativePaths();
    for (const src of srcs) {
        console.log(`processing ${src}`);
        MapTilesTextures.processOneRelative(src);
    }
}
