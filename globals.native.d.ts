import { IConfig } from "./react/features/base/config/configType";

export {};

interface IWindow {
    JITSI_MEET_LITE_SDK: boolean;
    config: IConfig;
    interfaceConfig: any;
    location: URL;
}

interface INavigator {
    product: string;
}

declare global {
    const APP: any;
    const interfaceConfig: any;
    const navigator: INavigator;
    const window: IWindow;
}
