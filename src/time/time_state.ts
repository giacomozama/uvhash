import { createPoll } from "ags/time";

const FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
};

function getDateString() {
    return new Date().toLocaleString("en-US", FORMAT_OPTIONS);
}

export const currentDateString = createPoll(getDateString(), 1000, getDateString);
