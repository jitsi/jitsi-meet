/**
 * Describes what a second-screen window should render. Resolved to an actual
 * media track by the feature and kept live (e.g. {@code role: 'stage'} follows
 * the active speaker). Because an iframe embedder has no access to the media
 * tracks (they live in the meeting document), an explicit selection can only
 * name a participant — never a stream — which the feature resolves internally.
 */
export interface ISecondScreenSource {

    /**
     * The media type of an explicitly pinned participant. Defaults to camera.
     */
    media?: 'camera' | 'desktop';

    /**
     * The id of an explicitly pinned participant to render.
     */
    participant?: string;

    /**
     * What the window shows: the active-speaker stage, the current screenshare,
     * or a tile grid of every participant.
     */
    role?: 'stage' | 'screenshare' | 'tile';
}

/**
 * A single second-screen entry: its configuration plus its live window handle.
 * This is the single source of truth for the feature; the middleware reconciles
 * the real windows to it.
 */
export interface ISecondScreenEntry {

    /**
     * The live, non-serializable window handle (the {@code Window}, its
     * {@code <video>} and the cloned/avatar tracks), populated by the middleware
     * once the window is open. Typed opaquely here because the shared (and
     * React Native) build has no DOM lib; its real shape is {@code ISecondScreenHandle}
     * in {@code functions.web.ts}, where it is read back with a cast.
     */
    handle?: unknown;

    /**
     * The (optional) index of the physical screen to place the window on, as
     * reported by the Window Management API.
     */
    screenId?: number;

    /**
     * What the window renders.
     */
    source: ISecondScreenSource;
}
