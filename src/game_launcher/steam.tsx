import Gio from "gi://Gio?version=2.0";
import config from "../config";
import { GameLauncherEntry } from "./types";
import { exec } from "ags/process";

export const steamEntries: GameLauncherEntry[] = (() => {
    const commandArgs = config.gameLaunchers.steam.steamappsDirs.map((d) => `"${d}"`).join(" ");
    const rawOutput = exec(`${SRC}/scripts/list_steam_games.sh ${commandArgs}`);
    const entries: GameLauncherEntry[] = [];

    for (const line of rawOutput.split("\n")) {
        const sepIdx = line.indexOf("%");
        const id = line.slice(0, sepIdx);
        const name = line.slice(sepIdx + 1);

        if (config.gameLaunchers.steam.excludePatterns.some((p) => p.test(name))) continue;

        let imgPath = `${config.gameLaunchers.steam.libraryCacheDir}/${id}/library_600x900.jpg`;
        const imgFile = Gio.File.new_for_path(imgPath);

        // if the file is not library_600x900.png, then it might
        // be library_capsule.jpg in a subdir with an unknown name
        if (!imgFile.query_exists(null)) {
            const dir = imgFile.get_parent()!;
            const en = dir.enumerate_children("standard", null, null);
            let child: Gio.FileInfo | null;
            while ((child = en.next_file(null)) != null) {
                if (child.get_file_type() !== Gio.FileType.DIRECTORY) continue;

                imgPath = `${config.gameLaunchers.steam.libraryCacheDir}/${id}/${child.get_name()}/library_capsule.jpg`;
                if (Gio.File.new_for_path(imgPath).query_exists(null)) break;

                imgPath = `${config.gameLaunchers.steam.libraryCacheDir}/${id}/${child.get_name()}/library_600x900.jpg`;
                if (Gio.File.new_for_path(imgPath).query_exists(null)) break;
            }
            en.close(null);
        }

        entries.push({
            title: name,
            command: `${config.path.xdgOpen} steam://rungameid/${id}`,
            image: imgPath,
        });
    }

    entries.sort((a, b) => a.title.localeCompare(b.title));

    return entries;
})();
