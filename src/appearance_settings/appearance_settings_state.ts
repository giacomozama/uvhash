import Gio from "gi://Gio?version=2.0";
import config from "../config";
import { generatePalette, parseRGB, rgbaToHex, rgbaWithAlpha, rgbToHex } from "../utils/colors";
import { Accessor, createRoot, createState } from "gnim";
import { createStorageBackedState } from "../utils/gnim";
import { storage } from "../storage/storage_state";
import { execAsync } from "ags/process";

export type AppearanceSettingsState = {
    wallpaper: Accessor<string>;
    setWallpaper: (wallpaper: string) => void;
    generatedPalette: Accessor<string[]>;
    setGeneratedPalette: (generatedPalette: string[]) => void;
    accent1: Accessor<string>;
    setAccent1: (accent1: string) => void;
    accent2: Accessor<string>;
    setAccent2: (accent2: string) => void;
    useScrim: Accessor<boolean>;
    setUseScrim: (useScrim: boolean) => void;
    useDarkPanels: Accessor<boolean>;
    setUseDarkPanels: (useDarkPanels: boolean) => void;
    applyAppearance: (onComplete: () => void) => void;
    updatePalette: () => void;
};

let appearanceSettingsStateInstance: AppearanceSettingsState | null = null;

function createAppearanceSettingsState(): AppearanceSettingsState {
    const [wallpaper, setWallpaper] = createState(config.appearance.wallpaperPath);
    const [generatedPalette, setGeneratedPalette] = createState<string[]>([]);
    const [accent1, setAccent1] = createState(rgbToHex(config.colors.accent1));
    const [accent2, setAccent2] = createState(rgbToHex(config.colors.accent2));
    const [useScrim, setUseScrim] = createState(storage.peek().useScrim ?? false);
    const [useDarkPanels, setUseDarkPanels] = createState(storage.peek().useDarkPanels ?? false);

    function applyAppearance(onComplete: () => void) {
        const newAccent1 = accent1.peek();
        const newAccent2 = accent2.peek();

        if (newAccent1 !== rgbToHex(config.colors.accent1) || newAccent2 !== rgbToHex(config.colors.accent2)) {
            const accentsFile = Gio.File.new_for_path(config.appearance.accentsFilePath);
            const fileIOStream = accentsFile.open_readwrite(null);

            const accent1rgb = parseRGB(newAccent1);
            const accent2rgb = parseRGB(newAccent2);

            fileIOStream.outputStream.write(
                `
local shell_accents = {
    accent_1 = "${newAccent1.slice(1)}",
    accent_1_10 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.1)).slice(1)}",
    accent_1_20 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.2)).slice(1)}",
    accent_1_30 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.3)).slice(1)}",
    accent_1_40 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.4)).slice(1)}",
    accent_1_50 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.5)).slice(1)}",
    accent_1_60 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.6)).slice(1)}",
    accent_1_70 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.7)).slice(1)}",
    accent_1_80 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.8)).slice(1)}",
    accent_1_90 = "${rgbaToHex(rgbaWithAlpha(accent1rgb, 0.9)).slice(1)}",

    accent_2 = "${newAccent2.slice(1)}",
    accent_2_10 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.1)).slice(1)}",
    accent_2_20 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.2)).slice(1)}",
    accent_2_30 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.3)).slice(1)}",
    accent_2_40 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.4)).slice(1)}",
    accent_2_50 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.5)).slice(1)}",
    accent_2_60 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.6)).slice(1)}",
    accent_2_70 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.7)).slice(1)}",
    accent_2_80 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.8)).slice(1)}",
    accent_2_90 = "${rgbaToHex(rgbaWithAlpha(accent2rgb, 0.9)).slice(1)}"
}

return shell_accents
`,
                null,
            );
            fileIOStream.close(null);
        }

        const [, setUseScrim] = createStorageBackedState("useScrim");
        setUseScrim(useScrim.peek());

        const [, setUseDarkPanels] = createStorageBackedState("useDarkPanels");
        setUseDarkPanels(useDarkPanels.peek());

        const wallpaperPath = wallpaper.peek();
        if (wallpaperPath === config.appearance.wallpaperPath) {
            onComplete();
            return;
        }

        // const newWallpaperFile = Gio.File.new_for_path(wallpaperPath);
        // const wallpaperFile = Gio.File.new_for_path(config.appearance.wallpaperPath);
        execAsync([config.path.magick, wallpaperPath, config.appearance.wallpaperPath])
            .then(() => {
                onComplete();
            })
            .catch((err) => console.log(err));
        // newWallpaperFile.copy(wallpaperFile, Gio.FileCopyFlags.OVERWRITE, null, (cur, tot) => {
        //     if (cur === tot) {
        //         onComplete();
        //     }
        // });
    }

    function updatePalette() {
        const wp = wallpaper();
        console.log(wp);
        generatePalette(wallpaper(), 5, undefined, "dbscan").then((p) => {
            if (p) {
                console.log("cuck");
                setGeneratedPalette(p.map((c) => rgbToHex(c!)));
            } else {
                console.log("fag");
                setGeneratedPalette([]);
            }
        });
    }

    appearanceSettingsStateInstance = {
        wallpaper,
        setWallpaper,
        generatedPalette,
        setGeneratedPalette,
        accent1,
        setAccent1,
        accent2,
        setAccent2,
        useScrim,
        setUseScrim,
        useDarkPanels,
        setUseDarkPanels,
        applyAppearance,
        updatePalette,
    };

    return appearanceSettingsStateInstance;
}

export function appearanceSettingsState(): AppearanceSettingsState {
    return appearanceSettingsStateInstance ?? createRoot(createAppearanceSettingsState);
}
