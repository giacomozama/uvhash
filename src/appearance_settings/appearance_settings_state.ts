import Gio from "gi://Gio?version=2.0";
import config from "../config";
import { generatePalette, parseRGB, rgbaToHex, rgbaWithAlpha, rgbToHex } from "../utils/colors";
import { createState } from "gnim";

export const [wallpaper, setWallpaper] = createState(config.appearance.wallpaperPath);
export const [generatedPalette, setGeneratedPalette] = createState<string[]>([]);
export const [accent1, setAccent1] = createState(rgbToHex(config.colors.accent1));
export const [accent2, setAccent2] = createState(rgbToHex(config.colors.accent2));
// const [addScrim, setAddScrim] = createState(false);

// const SCRIM_HEIGHT = 64;

// const scrimGradient = new giCairo.LinearGradient(0, 0, 0, SCRIM_HEIGHT);
// scrimGradient.addColorStopRGBA(0, 0, 0, 0, 0.5);
// scrimGradient.addColorStopRGBA(1, 0, 0, 0, 0);

// function addScrimToWallpaper(path: string) {
//     const surface = giCairo.ImageSurface.createFromPNG(path);
//     const context = new giCairo.Context(surface);
//     context.rectangle(0, 0, surface.getWidth(), SCRIM_HEIGHT);
//     context.setSource(scrimGradient);
//     context.setOperator(giCairo.Operator.OVER);
//     context.fill();
//     context.$dispose();
//     return surface;
// }

export function applyAppearance(onComplete: () => void) {
    const newAccent1 = accent1.get();
    const newAccent2 = accent2.get();

    if (newAccent1 !== rgbToHex(config.colors.accent1) || newAccent2 !== rgbToHex(config.colors.accent2)) {
        const accentsFile = Gio.File.new_for_path(config.appearance.accentsFilePath);
        const fileIOStream = accentsFile.open_readwrite(null);

        const accent1rgb = parseRGB(newAccent1);
        const accent2rgb = parseRGB(newAccent2);

        fileIOStream.outputStream.write(
            `
$shell_accent_1 = ${newAccent1.slice(1)}
$shell_accent_1_10 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.1)).slice(1)}
$shell_accent_1_20 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.2)).slice(1)}
$shell_accent_1_30 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.3)).slice(1)}
$shell_accent_1_40 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.4)).slice(1)}
$shell_accent_1_50 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.5)).slice(1)}
$shell_accent_1_60 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.6)).slice(1)}
$shell_accent_1_70 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.7)).slice(1)}
$shell_accent_1_80 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.8)).slice(1)}
$shell_accent_1_90 = ${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.9)).slice(1)}

$shell_accent_2 = ${newAccent2.slice(1)}
$shell_accent_2_10 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.1)).slice(1)}
$shell_accent_2_20 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.2)).slice(1)}
$shell_accent_2_30 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.3)).slice(1)}
$shell_accent_2_40 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.4)).slice(1)}
$shell_accent_2_50 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.5)).slice(1)}
$shell_accent_2_60 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.6)).slice(1)}
$shell_accent_2_70 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.7)).slice(1)}
$shell_accent_2_80 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.8)).slice(1)}
$shell_accent_2_90 = ${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.9)).slice(1)}
`,
            null
        );
        fileIOStream.close(null);
    }

    const wallpaperPath = wallpaper.get();
    if (wallpaperPath === config.appearance.wallpaperPath) {
        onComplete();
        return;
    }

    // if (addScrim.get()) {
    //     const wallpaperSurface = addScrimToWallpaper(wallpaperPath);
    //     wallpaperSurface.writeToPNG(config.appearance.wallpaperPath);
    //     onComplete();
    //     return;
    // }

    const newWallpaperFile = Gio.File.new_for_path(wallpaperPath);
    const wallpaperFile = Gio.File.new_for_path(config.appearance.wallpaperPath);
    newWallpaperFile.copy(wallpaperFile, Gio.FileCopyFlags.OVERWRITE, null, (cur, tot) => {
        if (cur === tot) {
            onComplete();
        }
    });
}

export function updatePalette() {
    generatePalette(wallpaper.get(), 5).then((p) => {
        if (p[0]) {
            setGeneratedPalette(p.map((c) => rgbToHex(c!)));
        } else {
            setGeneratedPalette([]);
        }
    });
}
