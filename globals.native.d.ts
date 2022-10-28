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
    interfaceConfig: any;
    location: ILocation;
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
