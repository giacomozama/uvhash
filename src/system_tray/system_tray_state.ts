import AstalTray from "gi://AstalTray?version=0.1";
import { createBinding } from "gnim";

const tray = AstalTray.get_default();

const EXCLUDED_APPS = ["nm-applet"];

export const trayItems = createBinding(tray, "items").as((ti) =>
    ti.filter((i) => !EXCLUDED_APPS.includes(i.id)).sort((a, b) => a.id.localeCompare(b.id))
);

export const nmAppletItem = createBinding(AstalTray.get_default(), "items").as((ti) => ti.find((i) => i.id === "nm-applet"));
