import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";

type DeviceDbusObjectOuter = {
    [key: string]: {
        "org.gnome.Shell.Extensions.GSConnect.Device": DeviceDbusObject;
    };
};

export type DeviceDbusObject = {
    Connected: boolean;
    EncryptionInfo: string;
    Id: string;
    Name: string;
    Paired: boolean;
    IconName: string;
    Type: string;
};

function getGSConnectDevices() {
    try {
        const dbusManagedObjects = Gio.DBus.session
            .call_sync(
                "org.gnome.Shell.Extensions.GSConnect",
                "/org/gnome/Shell/Extensions/GSConnect",
                "org.freedesktop.DBus.ObjectManager",
                "GetManagedObjects",
                null,
                new GLib.VariantType("(a{oa{sa{sv}}})"),
                Gio.DBusCallFlags.NONE,
                -1,
                null
            )
            .recursiveUnpack() as DeviceDbusObjectOuter[];

        return dbusManagedObjects.map((d) => Object.values(d)[0]["org.gnome.Shell.Extensions.GSConnect.Device"]);
    } catch {
        printerr("GSConnect doesn't seem to be working.");
        return [];
    }
}

export const gsConnectDevices = getGSConnectDevices();

export function getDBusActionGroup(device: DeviceDbusObject) {
    return Gio.DBusActionGroup.get(
        Gio.DBus.session,
        "org.gnome.Shell.Extensions.GSConnect",
        `/org/gnome/Shell/Extensions/GSConnect/Device/${device.Id}`
    );
}

export function getDBusMenu() {
    const menu = new Gio.Menu();
    menu.append_item(Gio.MenuItem.new("GSConnect", "dummy.xdummyx"));

    for (const device of gsConnectDevices) {
        const deviceMenu = Gio.DBusMenuModel.get(
            Gio.DBus.session,
            "org.gnome.Shell.Extensions.GSConnect",
            `/org/gnome/Shell/Extensions/GSConnect/Device/${device.Id}`
        );

        menu.append_submenu(device.Name, deviceMenu);
    }

    menu.append("Preferences", "activate.preferences");

    return menu;
}
