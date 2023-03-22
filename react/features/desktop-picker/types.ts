export const EVENT_TYPE = {
    INIT_DESKTOP_SOURCES: 'INIT_DESKTOP_SOURCES',
    DELETE_DESKTOP_SOURCES: 'DELETE_DESKTOP_SOURCES'
};

export interface IDesktopSources {
    sources: ISourcesByType;
}

export interface ISourcesByType {
    screen: [];
    window: [];
}
