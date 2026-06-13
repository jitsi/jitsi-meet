import { RefObject, useEffect } from 'react';

import { ITrack } from '../../base/tracks/types';

/**
 * Attaches a video track to a {@code <video>} element and keeps it in sync:
 * detaches the previous track when it changes and on unmount, and clears the
 * element ({@code srcObject = null}) when there is no track so a stale frame is
 * never left on screen.
 *
 * Shared by the active-speaker stage and each gallery tile so the attach/detach
 * lifecycle lives in one place. The Active Speaker and Gallery views mount fresh
 * on a layout switch, so a remounted element re-runs this effect and re-attaches
 * on its own — no explicit reset key is needed.
 *
 * @param {RefObject<HTMLVideoElement>} videoRef - Ref to the target video element.
 * @param {ITrack} [videoTrack] - The track to display, if any.
 * @returns {void}
 */
export function useAttachTrack(
        videoRef: RefObject<HTMLVideoElement>,
        videoTrack?: ITrack
): void {
    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        const jitsiTrack = videoTrack?.jitsiTrack;

        if (jitsiTrack) {
            jitsiTrack.attach(videoElement);
        } else {
            // Prevent stale frames when there is nothing to show.
            videoElement.srcObject = null;
        }

        // Detaching lives only here: React runs this cleanup before the next
        // effect (on a videoTrack change) and on unmount, so the element is
        // detached exactly once before any re-attach — detaching in the effect
        // body too would detach the same track twice.
        return () => {
            if (jitsiTrack) {
                jitsiTrack.detach(videoElement);
            }
        };
    }, [ videoTrack ]);
}
