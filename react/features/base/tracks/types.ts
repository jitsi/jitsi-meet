import { MediaType } from '../media/constants';

export interface ITrackOptions {
    cameraDeviceId?: string | null;
    constraints?: {
        video?: {
            height?: {
                ideal?: number;
                max?: number;
                min?: number;
            };
        };
    };
    desktopSharingSourceDevice?: string;
    desktopSharingSources?: Array<DesktopSharingSourceType>;
    devices?: string[];
    facingMode?: string;
    micDeviceId?: string | null;
    timeout?: number;
}

/**
 * Track type.
 *
 * @typedef {object} Track
 * @property {JitsiLocalTrack|JitsiRemoteTrack} jitsiTrack - The associated
 * {@code JitsiTrack} instance. Optional for local tracks if those are still
 * being created (ie {@code getUserMedia} is still in progress).
 * @property {Promise} [gumProcess] - If a local track is still being created,
 * it will have no {@code JitsiTrack}, but a {@code gumProcess} set to a
 * {@code Promise} with and extra {@code cancel()}.
 * @property {boolean} local=false - If the track is local.
 * @property {MEDIA_TYPE} mediaType=false - The media type of the track.
 * @property {boolean} mirror=false - The indicator which determines whether the
 * display/rendering of the track should be mirrored. It only makes sense in the
 * context of video (at least at the time of this writing).
 * @property {boolean} muted=false - If the track is muted.
 * @property {(string|undefined)} participantId - The ID of the participant whom
 * the track belongs to.
 * @property {boolean} videoStarted=false - If the video track has already
 * started to play.
 * @property {(VIDEO_TYPE|undefined)} videoType - The type of video track if
 * any.
 */
export interface ITrack {
    codec: string;
    getOriginalStream: Function;
    isReceivingData: boolean;
    jitsiTrack: any;
    local: boolean;
    mediaType: MediaType;
    mirror: boolean;
    muted: boolean;
    noDataFromSourceNotificationInfo?: {
        timeout?: number;
        uid?: string;
    };
    participantId: string;
    streamingStatus?: string;
    videoStarted: boolean;
    videoType?: string | null;
}

export interface IToggleScreenSharingOptions {
    audioOnly: boolean;
    enabled?: boolean;
    shareOptions: IShareOptions;
}

export type DesktopSharingSourceType = 'screen' | 'window';

export interface IShareOptions {
    desktopSharingSourceDevice?: string;
    desktopSharingSources?: Array<DesktopSharingSourceType>;
    desktopStream?: any;
}

export interface ICreateInitialTracksOptions {
    devices: Array<MediaType>;
    timeout?: number;
}

export interface IInitialTracksErrors {
    audioAndVideoError?: Error;
    audioOnlyError: Error;
    screenSharingError: Error;
    videoOnlyError: Error;
}
