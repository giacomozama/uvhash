import { CURSOR_POINTER } from "../utils/gtk";
import { NotificationsBarPopover } from "./NotificationsPopover";

export default function NotificationsBarButton() {
    return (
        <menubutton cssClasses={["notif-bar-button", "bar-button"]} cursor={CURSOR_POINTER}>
            <image iconName="notification-inactive-symbolic" />
            <NotificationsBarPopover />
        </menubutton>
    );
}
