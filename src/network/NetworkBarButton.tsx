import { With } from "gnim";
import { nmAppletItem } from "../system_tray/system_tray_state";
import { MenuTrayItem } from "../system_tray/SystemTray";

export default function NetworkBarButton() {
    return (
        <box cssClasses={["bar-chip", "system-tray"]}>
            <With value={nmAppletItem}>{(nmItem) => nmItem && <MenuTrayItem item={nmItem} />}</With>
        </box>
    );
}
