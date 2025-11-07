import { Gdk } from "ags/gtk4";
import { execAsync } from "ags/process";
import config from "../config";

export function parseRGBA(raw: string): Gdk.RGBA {
    if (raw.startsWith("#")) {
        raw = raw.slice(1);
    }
    if (raw.startsWith("0x")) {
        raw = raw.slice(2);
    }
    const red = Number(`0x${raw.slice(0, 2)}`) / 255;
    const green = Number(`0x${raw.slice(2, 4)}`) / 255;
    const blue = Number(`0x${raw.slice(4, 6)}`) / 255;
    const alpha = Number(`0x${raw.slice(6, 8)}`) / 255;
    return new Gdk.RGBA({ red, green, blue, alpha });
}

export function parseRGB(raw: string): Gdk.RGBA {
    return parseRGBA(`${raw}FF`);
}

export function rgbaToHex({ red, green, blue, alpha }: Gdk.RGBA) {
    const hr = Math.floor(red * 255)
        .toString(16)
        .padStart(2, "0");
    const hg = Math.floor(green * 255)
        .toString(16)
        .padStart(2, "0");
    const hb = Math.floor(blue * 255)
        .toString(16)
        .padStart(2, "0");
    const ha = Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${hr}${hg}${hb}${ha}`;
}

export function rgbToHex({ red, green, blue }: Gdk.RGBA) {
    const hr = Math.floor(red * 255)
        .toString(16)
        .padStart(2, "0");
    const hg = Math.floor(green * 255)
        .toString(16)
        .padStart(2, "0");
    const hb = Math.floor(blue * 255)
        .toString(16)
        .padStart(2, "0");
    return `#${hr}${hg}${hb}ff`;
}

export function rgbToComponents({ red, green, blue }: Gdk.RGBA) {
    const hr = Math.floor(red * 255);
    const hg = Math.floor(green * 255);
    const hb = Math.floor(blue * 255);
    return `${hr}, ${hg}, ${hb}`;
}

export function rgbaWithAlpha({ red, green, blue }: Gdk.RGBA, alpha: number) {
    return new Gdk.RGBA({ red, green, blue, alpha });
}

export async function generatePalette(imagePath: string, colors: number, theme?: string) {
    const themeArg = theme ? `-t ${theme} ` : "";
    return execAsync(`${config.path.autoPaletteCli} ${themeArg} -n ${colors} -o json ${imagePath}`)
        .then((cmdOutput) => {
            const cleanCmdOutput = cmdOutput.slice(0, cmdOutput.lastIndexOf("\n"));
            const { swatches } = JSON.parse(cleanCmdOutput) as { swatches: { color: string }[] };
            return swatches.map((s) => parseRGBA(`${s.color}FF`));
        })
        .catch(() => [...Array(colors)].map(() => null));
}
