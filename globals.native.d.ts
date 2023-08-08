import { IConfig } from "./react/features/base/config/configType";

export {};

interface ILocation extends URL {
    assign(url: string);
    replace(url: string);
    reload();
};

interface IWindow {
    JITSI_MEET_LITE_SDK: boolean;
    JitsiMeetJS: any;
    config: IConfig;
    document: any;
    innerHeight: number;
    innerWidth: number;
    interfaceConfig: any;
    location: ILocation;
    PressureObserver?: any;
    PressureRecord?: any;
    self: any;
    top: any;

    onerror: (event: string, source: any, lineno: any, colno: any, e: Error) => void;
    onunhandledrejection: (event: any) => void;

    setInterval: typeof setInterval;
    clearInterval: typeof clearInterval;
    setTimeout: typeof setTimeout;
    clearTimeout: typeof clearTimeout;
    setImmediate: typeof setImmediate;
    clearImmediate: typeof clearImmediate;
    addEventListener: Function;
    removeEventListener: Function;
}

interface INavigator {
    product: string;
}

declare global {
    const APP: any;
    const document: any;
    const interfaceConfig: any;
    const navigator: INavigator;
    const window: IWindow;
}
