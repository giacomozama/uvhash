export type GameLauncherEntry = {
    title: string;
    command: string;
    image: string;
};

export type BottlesLibrary = {
    [id: string]: {
        bottle: {
            name: string;
            path: string;
        };
        name: string;
        thumbnail: string;
    };
};
