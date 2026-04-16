import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER, popdownParentWindow } from "../utils/gtk";
import { createBinding, For, createState, createEffect, createComputed } from "gnim";
import Pango from "gi://Pango?version=1.0";
import { execAsync } from "ags/process";
import config from "../config";
import { networkState } from "./network_state";
import NM from "gi://NM?version=1.0";
import AstalNetwork from "gi://AstalNetwork?version=0.1";

function NetworkToggle() {
    const client = networkState().client;
    return (
        <switch
            active={createBinding(client, "networking_enabled")}
            cursor={CURSOR_POINTER}
            valign={Gtk.Align.CENTER}
            halign={Gtk.Align.END}
        >
            <Gtk.GestureClick
                button={1}
                onBegin={() => {
                    client.networking_enabled = !client.networking_enabled;
                }}
            />
        </switch>
    );
}

function NetworkConnectionItem({ connection }: { connection: NM.Connection }) {
    const client = networkState().client;

    const connectionState = createComputed(() => {
        const activeConns = createBinding(client, "active_connections")();
        for (const conn of activeConns) {
            if (conn.get_uuid() === connection.get_uuid()) {
                return createBinding(conn, "state")();
            }
        }
        return undefined;
    });

    const isConnected = connectionState.as((s) => s === NM.ActiveConnectionState.ACTIVATED);
    const isSwitchEnabled = connectionState.as((s) => s !== NM.ActiveConnectionState.ACTIVATING && s !== NM.ActiveConnectionState.DEACTIVATING);

    return (
        <box class="popover-control-list-item" orientation={Gtk.Orientation.HORIZONTAL} valign={Gtk.Align.CENTER}>
            <image class="popover-control-list-item-icon" iconName="network-vpn-symbolic" />
            <label
                label={connection.get_id()}
                hexpand={true}
                maxWidthChars={0}
                wrap={true}
                wrapMode={Gtk.WrapMode.CHAR}
                lines={1}
                xalign={0}
                ellipsize={Pango.EllipsizeMode.END}
            />
            <switch
                active={isConnected}
                sensitive={isSwitchEnabled}
                valign={Gtk.Align.CENTER}
                halign={Gtk.Align.END}
                cursor={CURSOR_POINTER}
            >
                <Gtk.GestureClick
                    button={1}
                    onBegin={() => {
                        const activeConn = client
                            .get_active_connections()
                            .find((ac) => ac.get_uuid() === connection.get_uuid());

                        if (activeConn?.state === NM.ActiveConnectionState.ACTIVATED) {
                            client.deactivate_connection_async(activeConn, null, (source, res) => {
                                source?.deactivate_connection_finish(res);
                            });
                        } else {
                            client.activate_connection_async(connection, null, null, null, (source, res) => {
                                source?.activate_connection_finish(res);
                            });
                        }
                    }}
                />
            </switch>
        </box>
    );
}

export function NetworkPopoverWindow() {
    return (
        <contrapshellpopoverwindow name="network" widthRequest={420}>
            <box
                orientation={Gtk.Orientation.VERTICAL}
                cssClasses={["popover-standard-inner"]}
                overflow={Gtk.Overflow.HIDDEN}
            >
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={networkState().iconName} halign={Gtk.Align.START} />
                    <label label={"Network"} xalign={0} hexpand={true} />
                    <button
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={(self) => {
                            execAsync(config.network.networkSettingsCommand);
                            popdownParentWindow(self);
                        }}
                    >
                        <box spacing={12}>
                            <image iconName="settings-symbolic" />
                            <label label="Network settings" />
                        </box>
                    </button>
                </box>
                <box
                    orientation={Gtk.Orientation.VERTICAL}
                    cssClasses={["popover-control-list"]}
                    overflow={Gtk.Overflow.HIDDEN}
                >
                    <box
                        class="popover-control-list-item"
                        orientation={Gtk.Orientation.HORIZONTAL}
                        valign={Gtk.Align.CENTER}
                    >
                        <label label="Enabled" hexpand={true} xalign={0} />
                        <NetworkToggle />
                    </box>
                    <label
                        label="VPN Connections"
                        cssClasses={["popover-control-list-item", "header"]}
                        hexpand={true}
                        xalign={0}
                    />
                    <For each={networkState().vpns}>
                        {(connection) => <NetworkConnectionItem connection={connection} />}
                    </For>
                </box>
            </box>
        </contrapshellpopoverwindow>
    );
}
