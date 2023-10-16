export interface IDesktopSources {
    sources: ISourcesByType;
}

export interface ISourcesByType {
    screen: [];
    window: [];
}

export type ElectronWindowType = {
    JitsiMeetElectron?: {
        obtainDesktopStreams: Function;
    } ;
} & typeof window;
