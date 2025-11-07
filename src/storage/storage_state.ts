import { readFile, writeFileAsync } from "ags/file";
import config from "../config";
import Gio from "gi://Gio?version=2.0";
import { EyeCandyMode } from "../eye_candy/types";
import { Storage } from "./types";
import { createState } from "gnim";
import { exec } from "ags/process";

exec(`mkdir -p ${config.path.storageDir}`);

const STORAGE_FILE_PATH = `${config.path.storageDir}/storage.json`;

(() => {
    const storageFile = Gio.File.new_for_path(STORAGE_FILE_PATH);

    if (storageFile.query_exists(null)) return;

    const defaultStorage: Storage = {
        eyeCandyMode: EyeCandyMode.Balanced,
    };

    const stream = storageFile.create(null, null);
    stream.write(JSON.stringify(defaultStorage), null);
    stream.close(null);
})();

const [storage, _setStorage] = createState(JSON.parse(readFile(STORAGE_FILE_PATH)) as Storage);
export { storage };

export function setStorage(value: Storage) {
    writeFileAsync(STORAGE_FILE_PATH, JSON.stringify(value));
    _setStorage(value);
}
