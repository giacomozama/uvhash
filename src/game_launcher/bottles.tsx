import { exec } from "ags/process";
import config from "../config";
import { BottlesLibrary, GameLauncherEntry } from "./types";

export const bottlesEntries: GameLauncherEntry[] = (() => {
    const bottlesLibraryRaw = exec(`/bin/bash -c "${config.path.yaml2json} < \"${config.gameLaunchers.bottles.libraryFilePath}\""`);
    const bottlesLibrary = JSON.parse(bottlesLibraryRaw) as BottlesLibrary;
    const entries: GameLauncherEntry[] = [];

    for (const program of Object.values(bottlesLibrary)) {
        const image = `${program.bottle.path}/grids/${program.thumbnail.slice(5)}`;

        entries.push({
            title: program.name,
            command: `${config.path.bottlesCli} run -b ${program.bottle.name} -p "${program.name}"`,
            image,
        });
    }

    entries.sort((a, b) => a.title.localeCompare(b.title));

    return entries;
})();
