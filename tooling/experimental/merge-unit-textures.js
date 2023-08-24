"use strict";

/**
 * Combine unit textures into a single, shared image.
 * Rewrite UVs to correspond to the merged image.
 */

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const OBJ_DIR = path.join(__dirname, "/../../assets/Models/units");
const IMG_DIR = path.join(__dirname, "/../../assets/Textures/global/units");
const UNITS = [
    { obj: "base/carrier.obj", img: "base/carrier.png" },
    { obj: "base/cruiser.obj", img: "base/cruiser.png" },
    { obj: "base/destroyer.obj", img: "base/destroyer.png" },
    { obj: "base/dreadnought.obj", img: "base/dreadnought.png" },
    { obj: "base/fighter.obj", img: "base/fighter.png" },
    { obj: "base/flagship.obj", img: "base/flagship.png" },
    { obj: "base/infantry.obj", img: "base/infantry.png" },
    { obj: "base/pds.obj", img: "base/pds.png" },
    { obj: "base/spacedock.obj", img: "base/spacedock.png" },
    { obj: "base/warsun.obj", img: "base/warsun.png" },
    { obj: "pok/mech.obj", img: "pok/mech.png" },
];

// 2k shared image with 11 units means 512x512 per unit.
const NUM_CHUNKS = Math.ceil(Math.sqrt(UNITS.length));
const SHARED_TEXTURE_SIZE = 2048;
const UNIT_TEXTURE_SIZE = Math.floor(SHARED_TEXTURE_SIZE / NUM_CHUNKS);
const IMG_OUTPUT = "units-shared.png";

console.log(JSON.stringify({ NUM_CHUNKS, UNIT_TEXTURE_SIZE }));

async function createUnitsMergedPng() {
    const composite = [];
    for (let index = 0; index < UNITS.length; index++) {
        const unit = UNITS[index];
        const row = Math.floor(index / NUM_CHUNKS);
        const col = index % NUM_CHUNKS;

        const left = col * UNIT_TEXTURE_SIZE;
        let top = row * UNIT_TEXTURE_SIZE;

        // V is flipped.
        top = SHARED_TEXTURE_SIZE - UNIT_TEXTURE_SIZE - top;

        console.log(`reading ${unit.img}`);
        composite.push({
            input: await sharp(path.join(IMG_DIR, unit.img))
                .resize({
                    width: UNIT_TEXTURE_SIZE,
                    height: UNIT_TEXTURE_SIZE,
                })
                .toBuffer(),
            left,
            top,
        });
    }

    console.log(`writing ${IMG_OUTPUT}`);
    await sharp({
        create: {
            width: SHARED_TEXTURE_SIZE,
            height: SHARED_TEXTURE_SIZE,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 1 },
        },
    })
        .composite(composite)
        .toFile(path.join(IMG_DIR, IMG_OUTPUT));
}

function rewriteUVs() {
    for (let index = 0; index < UNITS.length; index++) {
        const unit = UNITS[index];
        const row = Math.floor(index / NUM_CHUNKS);
        const col = index % NUM_CHUNKS;

        const u0 = col / NUM_CHUNKS;
        const v0 = row / NUM_CHUNKS;

        console.log(`reading ${unit.obj}`);
        const lines = fs
            .readFileSync(path.join(OBJ_DIR, unit.obj), "utf-8")
            .split(/\r?\n/);

        // Look for UVs lines.
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (!line.startsWith("vt ")) {
                continue;
            }

            line = line.trim();

            // Extract the UVs from the comment (NOT the real one, might have been rewritten already!).
            const m = line.match(/vt (\d+\.?\d*) (\d+\.?\d*) (\d+\.?\d*)/);
            if (!m) {
                throw new Error(`vt mismatch "${line}"`);
            }
            let u = parseFloat(m[1]);
            let v = parseFloat(m[2]);
            let w = parseFloat(m[3]);

            u = u0 + u / NUM_CHUNKS;
            v = v0 + v / NUM_CHUNKS;

            u = u.toFixed(4);
            v = v.toFixed(4);
            w = w.toFixed(4);

            line = `vt ${u} ${v} ${w}`;
            lines[i] = line;
        }

        const filename = path
            .join(OBJ_DIR, unit.obj)
            .replace(".obj", "-shared.obj");
        const data = lines.join("\r\n") + "\r\n"; // 3ds does 0x0a0d \r\n newlines
        console.log(`writing ${filename}`);
        fs.writeFileSync(filename, data);
    }
}

rewriteUVs();
createUnitsMergedPng();
