export type ElectronWindowType = {
    JitsiMeetElectron?: {
        obtainDesktopStreams: Function;
    } ;
} & typeof window;
