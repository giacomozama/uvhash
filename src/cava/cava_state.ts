import AstalCava from "gi://AstalCava?version=0.1";
import config from "../config";

export const cava = AstalCava.get_default();

if (cava) {
    config.mediaControls.configureCava(cava);
}
