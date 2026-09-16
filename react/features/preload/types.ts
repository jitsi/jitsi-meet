import { IConfig } from '../base/config/configType';

/**
 * A resource that the preload script started downloading before the app bundle was loaded.
 */
export interface IPreloadedResource<T> {

    /**
     * Resolves with the downloaded resource, or rejects if the download failed. After a rejection
     * the app downloads the resource itself.
     */
    promise: Promise<T>;

    /**
     * The URL the resource was requested from. The app reuses the resource only when this is
     * exactly the URL it would have requested itself.
     */
    url: string;
}

/**
 * The resources published by the preload script on {@code window.JitsiMeetPreload}. Every entry
 * is optional: it is missing when the preload script was not loaded at all, when the resource was
 * not needed (e.g. config.js was inlined in the page) or once the app has consumed it.
 */
export interface IJitsiMeetPreload {

    /**
     * The dynamic branding data.
     */
    branding?: IPreloadedResource<Object>;

    /**
     * The parsed config.js. Only present when config.js had to be downloaded.
     */
    config?: IPreloadedResource<IConfig>;

    /**
     * Raw SVG markup of the custom icons that were given as URLs in the branding data, keyed by
     * icon name. The URL is the one of the branding data the icons belong to.
     */
    icons?: IPreloadedResource<Record<string, string>>;
}
