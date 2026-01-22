import AstalNetwork from "gi://AstalNetwork?version=0.1";
import NM from "gi://NM?version=1.0";
import { Accessor, createBinding, createRoot } from "gnim";

export type NetworkState = {
    iconName: Accessor<string>;
    client: NM.Client;
    vpns: Accessor<NM.Connection[]>;
};

let networkStateInstance: NetworkState | null = null;

function createNetworkState(): NetworkState {
    const network = AstalNetwork.get_default();
    const icon = createBinding(network.wired, "iconName");
    const client = network.client;

    const vpns = createBinding(client, "connections").as((connections) => {
        return connections.filter((c) => c.get_setting_vpn() !== null || c.get_connection_type() === "wireguard");
    });

    networkStateInstance = {
        iconName: icon,
        client,
        vpns,
    };

    return networkStateInstance;
}

export function networkState(): NetworkState {
    return networkStateInstance ?? createRoot(createNetworkState);
}
