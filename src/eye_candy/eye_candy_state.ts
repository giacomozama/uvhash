import { createState, State } from "gnim";
import { EyeCandyMode } from "./types";
import { storage } from "../storage/storage_state";
import { createStorageBackedState } from "../utils/gnim";

function getEyeCandyConfig(mode: EyeCandyMode) {
    switch (mode) {
        case EyeCandyMode.Off:
            return {
                eyeCandyMode: EyeCandyMode.Off,
                musicVisualizerEnabled: false,
                musicVisualizerMinInterval: Infinity,
                polyhedronToyEnabled: false,
                polyhedronToyCavaEnabled: false,
                polyhedronToyMinInterval: Infinity,
                animateBorders: false,
            };
        case EyeCandyMode.Performance:
            return {
                eyeCandyMode: EyeCandyMode.Performance,
                musicVisualizerEnabled: true,
                musicVisualizerMinInterval: 25_000,
                polyhedronToyEnabled: true,
                polyhedronToyCavaEnabled: false,
                polyhedronToyMinInterval: 40_000,
                animateBorders: true,
            };
        case EyeCandyMode.Balanced:
            return {
                eyeCandyMode: EyeCandyMode.Balanced,
                musicVisualizerEnabled: true,
                musicVisualizerMinInterval: 15_000,
                polyhedronToyEnabled: true,
                polyhedronToyCavaEnabled: true,
                polyhedronToyMinInterval: 18_000,
                animateBorders: true,
            };
        case EyeCandyMode.Cranked:
            return {
                eyeCandyMode: EyeCandyMode.Cranked,
                musicVisualizerEnabled: true,
                musicVisualizerMinInterval: 0,
                polyhedronToyEnabled: true,
                polyhedronToyCavaEnabled: true,
                polyhedronToyMinInterval: 0,
                animateBorders: true,
            };
    }
}

const [eyeCandyMode, setEyeCandyMode]: State<EyeCandyMode> = createStorageBackedState("eyeCandyMode");

const eyeCandyConfig = eyeCandyMode.as(getEyeCandyConfig);

export { eyeCandyConfig, setEyeCandyMode };
