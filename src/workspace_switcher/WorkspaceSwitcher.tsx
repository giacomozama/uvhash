import { Gtk } from "ags/gtk4";
import { Accessor } from "gnim";
import { setupWorkspacesGrid } from "../compositor/compositor";
import { WorkspaceDelegate } from "../compositor/base";

function updateWorkspacesGrid(grid: Gtk.Grid, workspaces: WorkspaceDelegate[]) {
    const tilesPerRow = Math.ceil(workspaces.length / 2);

    let child = grid.get_first_child();
    while (child) {
        grid.remove(child);
        child = grid.get_first_child();
    }

    for (let i = 0; i < workspaces.length; i++) {
        const workspace = workspaces[i];
        const button = (<WorkspaceButton delegate={workspace} />) as Gtk.Button;
        grid.attach(button, i % tilesPerRow, Math.floor(i / tilesPerRow), 1, 1);
    }
}

function WorkspaceButton({ delegate }: { delegate: WorkspaceDelegate }) {
    const { focusWorkspace, moveFocusedClientToWorkspace, clientCount, tooltip, isActiveWorkspace } = delegate;

    return (
        <button
            label={clientCount.as((c) => `${c || ""}`)}
            cssClasses={isActiveWorkspace.as((a) => (a ? ["active"] : []))}
            onClicked={() => {
                if (!isActiveWorkspace.peek()) {
                    focusWorkspace();
                }
            }}
            widthRequest={40}
            tooltipText={tooltip}
            vexpand={true}
            halign={Gtk.Align.START}
        >
            <Gtk.GestureSingle
                button={2}
                onBegin={(source) => {
                    moveFocusedClientToWorkspace();
                    source.set_state(Gtk.EventSequenceState.CLAIMED);
                }}
            />
        </button>
    );
}

export function WorkspaceSwitcher({ monitorId }: { monitorId: string }) {
    return (
        <box>
            <box class="workspace-switcher-border-l" vexpand={true} />
            <Gtk.Grid
                orientation={Gtk.Orientation.HORIZONTAL}
                cssClasses={["workspace-switcher"]}
                rowSpacing={1}
                columnSpacing={1}
                vexpand={true}
                overflow={Gtk.Overflow.HIDDEN}
                $={(self) => {
                    setupWorkspacesGrid(monitorId, (d) => updateWorkspacesGrid(self, d));
                }}
            />
            <box class="workspace-switcher-border-r" vexpand={true} />
        </box>
    );
}
