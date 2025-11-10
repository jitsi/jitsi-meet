export interface ILoaderState {
    isVisible: boolean;
    text?: string;
    textKey?: string;
    id?: string;
}

export interface IShowLoaderAction {
    type: string;
    text?: string;
    textKey?: string;
    id?: string;
}

export interface IHideLoaderAction {
    type: string;
    id?: string;
}
