import AstalBluetooth from "gi://AstalBluetooth?version=0.1";
import { createBinding } from "gnim";

export const astalBluetooth = AstalBluetooth.get_default();

export const bluetoothDevices = createBinding(astalBluetooth, "devices");
