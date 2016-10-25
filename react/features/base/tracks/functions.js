import { MEDIA_TYPE } from '../media';

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
    if (track.isMuted() === muted) {
        return Promise.resolve();
    }

    const f = muted ? 'mute' : 'unmute';

    return track[f]()
        .catch(err => {
            console.warn(`Track ${f} was rejected:`, err);
            throw err;
        });
}
