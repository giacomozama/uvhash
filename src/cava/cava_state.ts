import AstalCava from "gi://AstalCava?version=0.1";
import config from "../config";

export const cava = AstalCava.get_default();

if (cava) {
    cava.set_bars(config.mediaControls.visualizerBars);
    cava.set_framerate(config.mediaControls.visualizerFramerate);
    cava.set_input(config.mediaControls.visualizerInput);
}
