import config from "../config";
import { createPollState } from "../utils/gnim";

export const [isInhibited, setIsInhibited] = createPollState(
    false,
    config.caffeine.pollingInterval,
    config.caffeine.checkCommand,
    (o) => o === "1"
);
