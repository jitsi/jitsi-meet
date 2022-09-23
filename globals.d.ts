import { IStore } from "./react/features/app/types";

export {};

declare global {
    const APP: {
        store: IStore;
        UI: any;
        API: any;
        conference: any;
    };
    const interfaceConfig: any;
}
