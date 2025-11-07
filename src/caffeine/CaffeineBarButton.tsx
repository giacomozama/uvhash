import { execAsync } from "ags/process";
import { CURSOR_POINTER } from "../utils/gtk";
import config from "../config";
import { isInhibited, setIsInhibited } from "./caffeine_state";

export default function CaffeineBarButton() {
    return (
        <box class="bar-chip">
            <togglebutton
                active={isInhibited}
                cursor={CURSOR_POINTER}
                onClicked={() => {
                    setIsInhibited(!isInhibited.get());
                    execAsync(config.caffeine.toggleCommand);
                }}
                iconName={isInhibited.as((i) => (i ? "my-caffeine-on-symbolic" : "my-caffeine-off-symbolic"))}
            />
        </box>
    );
}
