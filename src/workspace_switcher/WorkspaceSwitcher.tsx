import { Gtk } from "ags/gtk4";
import { Accessor, onCleanup } from "gnim";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import { createBinding } from "gnim";
import { CURSOR_POINTER } from "../utils/gtk";
import { Monitor } from "../utils/monitors";

const hyprland = AstalHyprland.get_default();

export const workspacesBinding = createBinding(hyprland, "workspaces");

export function updateWorkspacesGrid(grid: Gtk.Grid, monitor: Monitor) {
    const workspaces = hyprland.workspaces.filter((w) => w.monitor.id === monitor.hyprlandMonitor.id);
    workspaces.sort((a, b) => a.id - b.id);
    const tilesPerRow = Math.ceil(workspaces.length / 2);

    const activeWorkspace = createBinding(monitor.hyprlandMonitor, "activeWorkspace");

    let child = grid.get_first_child();
    while (child) {
        grid.remove(child);
        child = grid.get_first_child();
    }

    for (let i = 0; i < workspaces.length; i++) {
        const workspace = workspaces[i];
        const workspaceClients = createBinding(workspace, "clients");
        const button = (
            <WorkspaceButton
                workspace={workspace}
                workspaceClients={workspaceClients}
                activeWorkspace={activeWorkspace}
            />
        ) as Gtk.Button;
        grid.attach(button, i % tilesPerRow, Math.floor(i / tilesPerRow), 1, 1);
    }
}

function WorkspaceButton({
    workspace,
    workspaceClients,
    activeWorkspace,
}: {
    workspace: AstalHyprland.Workspace;
    workspaceClients: Accessor<AstalHyprland.Client[]>;
    activeWorkspace: Accessor<AstalHyprland.Workspace>;
}) {
    const isNotActiveWorkspace = activeWorkspace.as((w) => w.id !== workspace.id);

    return (
        <button
            label={workspaceClients.as((c) => `${c.length || ""}`)}
            cssClasses={isNotActiveWorkspace.as((a) => (a ? [] : ["active"]))}
            onClicked={() => {
                workspace.focus();
            }}
            widthRequest={40}
            canTarget={isNotActiveWorkspace}
            canFocus={isNotActiveWorkspace}
            tooltip_text={workspaceClients.as((cc) => cc.map((c) => c.initialTitle).join("\n"))}
            cursor={CURSOR_POINTER}
            vexpand={true}
            halign={Gtk.Align.START}
        >
            <Gtk.GestureSingle
                button={2}
                onBegin={(source) => {
                    hyprland.get_focused_client().move_to(workspace);
                    source.set_state(Gtk.EventSequenceState.CLAIMED);
                }}
            />
        </button>
    );
}

export function WorkspaceSwitcher({ monitor }: { monitor: Monitor }) {
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
                    onCleanup(workspacesBinding.subscribe(() => updateWorkspacesGrid(self, monitor)));
                    updateWorkspacesGrid(self, monitor);
                }}
            />
            <box class="workspace-switcher-border-r" vexpand={true} />
        </box>
    );
}
