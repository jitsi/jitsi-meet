/* global APP */

import JitsiMeetJS, { JitsiTrackEvents } from '../lib-jitsi-meet';
import { MEDIA_TYPE } from '../media';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Create local tracks of specific types.
 *
 * @param {Object} options - The options with which the local tracks are to be
 * created.
 * @param {string|null} [options.cameraDeviceId] - Camera device id or
 * {@code undefined} to use app's settings.
 * @param {string[]} options.devices - Required track types such as 'audio'
 * and/or 'video'.
 * @param {string|null} [options.micDeviceId] - Microphone device id or
 * {@code undefined} to use app's settings.
 * @param {boolean} [firePermissionPromptIsShownEvent] - Whether lib-jitsi-meet
 * should check for a {@code getUserMedia} permission prompt and fire a
 * corresponding event.
 * @param {Object} store - The redux store in the context of which the function
 * is to execute and from which state such as {@code config} is to be retrieved.
 * @returns {Promise<JitsiLocalTrack[]>}
 */
export function createLocalTracksF(
        options,
        firePermissionPromptIsShownEvent,
        store) {
    options || (options = {}); // eslint-disable-line no-param-reassign

    let { cameraDeviceId, micDeviceId } = options;

    if (typeof APP !== 'undefined') {
        // TODO The app's settings should go in the redux store and then the
        // reliance on the global variable APP will go away.
        if (typeof cameraDeviceId === 'undefined' || cameraDeviceId === null) {
            cameraDeviceId = APP.settings.getCameraDeviceId();
        }
        if (typeof micDeviceId === 'undefined' || micDeviceId === null) {
            micDeviceId = APP.settings.getMicDeviceId();
        }

        store || (store = APP.store); // eslint-disable-line no-param-reassign
    }

    const {
        firefox_fake_device, // eslint-disable-line camelcase
        resolution
    } = store.getState()['features/base/config'];

    return (
        JitsiMeetJS.createLocalTracks(
            {
                cameraDeviceId,
                desktopSharingExtensionExternalInstallation:
                    options.desktopSharingExtensionExternalInstallation,
                desktopSharingSources: options.desktopSharingSources,

                // Copy array to avoid mutations inside library.
                devices: options.devices.slice(0),
                firefox_fake_device, // eslint-disable-line camelcase
                micDeviceId,
                resolution
            },
            firePermissionPromptIsShownEvent)
        .then(tracks => {
            // TODO JitsiTrackEvents.NO_DATA_FROM_SOURCE should probably be
            // dispatched in the redux store here and then
            // APP.UI.showTrackNotWorkingDialog should be in a middleware
            // somewhere else.
            if (typeof APP !== 'undefined') {
                tracks.forEach(track =>
                    track.on(
                        JitsiTrackEvents.NO_DATA_FROM_SOURCE,
                        APP.UI.showTrackNotWorkingDialog.bind(null, track)));
            }

            return tracks;
        })
        .catch(err => {
            logger.error('Failed to create local tracks', options.devices, err);

            return Promise.reject(err);
        }));
}

/**
 * Returns local audio track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalAudioTrack(tracks) {
    return getLocalTrack(tracks, MEDIA_TYPE.AUDIO);
}

/**
 * Returns local track by media type.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @returns {(Track|undefined)}
 */
export function getLocalTrack(tracks, mediaType) {
    return tracks.find(t => t.local && t.mediaType === mediaType);
}

/**
 * Returns local video track.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @returns {(Track|undefined)}
 */
export function getLocalVideoTrack(tracks) {
    return getLocalTrack(tracks, MEDIA_TYPE.VIDEO);
}

/**
 * Returns track of specified media type for specified participant id.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @param {string} participantId - Participant ID.
 * @returns {(Track|undefined)}
 */
export function getTrackByMediaTypeAndParticipant(
        tracks,
        mediaType,
        participantId) {
    return tracks.find(
        t => t.participantId === participantId && t.mediaType === mediaType
    );
}

/**
 * Returns the track if any which corresponds to a specific instance
 * of JitsiLocalTrack or JitsiRemoteTrack.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)} jitsiTrack - JitsiTrack instance.
 * @returns {(Track|undefined)}
 */
export function getTrackByJitsiTrack(tracks, jitsiTrack) {
    return tracks.find(t => t.jitsiTrack === jitsiTrack);
}

/**
 * Returns tracks of specified media type.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - Media type.
 * @returns {Track[]}
 */
export function getTracksByMediaType(tracks, mediaType) {
    return tracks.filter(t => t.mediaType === mediaType);
}

/**
 * Checks if the first local track in the given tracks set is muted.
 *
 * @param {Track[]} tracks - List of all tracks.
 * @param {MEDIA_TYPE} mediaType - The media type of tracks to be checked.
 * @returns {boolean} True if local track is muted or false if the track is
 * unmuted or if there are no local tracks of the given media type in the given
 * set of tracks.
 */
export function isLocalTrackMuted(tracks, mediaType) {
    const track = getLocalTrack(tracks, mediaType);

    return !track || track.muted;
}

/**
 * Mutes or unmutes a specific <tt>JitsiLocalTrack</tt>. If the muted state of
 * the specified <tt>track</tt> is already in accord with the specified
 * <tt>muted</tt> value, then does nothing.
 *
 * @param {JitsiLocalTrack} track - The <tt>JitsiLocalTrack</tt> to mute or
 * unmute.
 * @param {boolean} muted - If the specified <tt>track</tt> is to be muted, then
 * <tt>true</tt>; otherwise, <tt>false</tt>.
 * @returns {Promise}
 */
export function setTrackMuted(track, muted) {
    muted = Boolean(muted); // eslint-disable-line no-param-reassign

    if (track.isMuted() === muted) {
        return Promise.resolve();
    }

    const f = muted ? 'mute' : 'unmute';

    return track[f]().catch(error => {

        // FIXME emit mute failed, so that the app can show error dialog
        console.error(`set track ${f} failed`, error);
    });
}
