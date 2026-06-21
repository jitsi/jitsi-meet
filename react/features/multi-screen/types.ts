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
     * A role to follow: the active-speaker stage, or the current screenshare.
     */
    role?: 'stage' | 'screenshare';
}

/**
 * The configuration of a single second-screen window.
 */
export interface ISecondScreenConfig {

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
