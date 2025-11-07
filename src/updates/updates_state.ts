import { execAsync } from "ags/process";
import config from "../config";
import { createPollState } from "../utils/gnim";

function parseAndSortUpdates(stdout: string) {
    return stdout
        .split("\n")
        .filter((l) => !!l.length)
        .sort((a, b) => a.localeCompare(b));
}

const [sortedUpdates, setSortedUpdates] = createPollState(
    [],
    config.updates.checkUpdatesInterval,
    config.updates.checkUpdatesCommand,
    parseAndSortUpdates
);

export { sortedUpdates }

export function onInstallClicked() {
    execAsync(config.updates.launchCommand).then(
        () => {
            execAsync(config.updates.checkUpdatesCommand).then(
                (o) => setSortedUpdates(parseAndSortUpdates(o)),
                () => {}
            );
        },
        () => {}
    );
}
