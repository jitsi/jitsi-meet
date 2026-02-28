import { IConfig } from "./react/features/base/config/configType";

export {};

declare global {
    interface URL {
        hash: string;
        host: string;
        hostname: string;
        href: string;
        readonly origin: string;
        password: string;
        pathname: string;
        port: string;
        protocol: string;
        search: string;
        readonly searchParams: URLSearchParams;
        username: string;
        toJSON(): string;
        toString(): string;
    }

    interface URLSearchParams {
        append(name: string, value: string): void;
        delete(name: string): void;
        get(name: string): string | null;
        getAll(name: string): string[];
        has(name: string): boolean;
        set(name: string, value: string): void;
        sort(): void;
        toString(): string;
        forEach(callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any): void;
    }
}

interface ILocation extends URL {
    assign(url: string): void;
    replace(url: string): void;
    reload(): void;
}

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
    ReactNativeWebView?: any;
    TextDecoder?: any;
    TextEncoder?: any;
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
    userAgent: string;
}

declare global {
    const APP: any;
    const document: any;
    const interfaceConfig: any;
    const navigator: INavigator;
    const window: IWindow;
}
