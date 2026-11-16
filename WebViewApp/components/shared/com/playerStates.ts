export const PlayerState = {
    Undefined: "Undefined",
    StartPlaying: "StartPlaying",
    Playing: "Playing",
    Stopped: "Stopped",
    ConnectingToVst: "ConnectingToVst",
    ConnectedToVst: "ConnectedToVst",
    Stopping: "Stopping",
    Pausing: "Pausing",
    Paused: "Paused"
} as const;

export type PlayerStateName = typeof PlayerState[keyof typeof PlayerState];
