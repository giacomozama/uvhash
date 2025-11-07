
export enum EyeCandyMode {
    Off,
    Performance,
    Balanced,
    Cranked
}

export type EyeCandyConfig = {
    eyeCandyMode: EyeCandyMode,
    musicVisualizerEnabled: boolean,
    musicVisualizerMinInterval: number,
    polyhedronToyEnabled: boolean,
    polyhedronToyCavaEnabled: boolean,
    polyhedronToyMinInterval: number,
    animateBorders: boolean
}
