import { AnyAction } from 'redux';

import { IReduxState, IStore } from '../app/types';
import { CONFERENCE_FAILED, CONFERENCE_LEFT, CONFERENCE_WILL_LEAVE } from '../base/conference/actionTypes';
import { browser } from '../base/lib-jitsi-meet';
import MediaCastSender from '../base/media-cast/MediaCastSender';
import type { MediaCastSignal } from '../base/media-cast/types.web';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { isEmbedded } from '../base/util/embedUtils';
import { getLargeVideoParticipant } from '../large-video/functions';

import {
    HOST_DOCUMENT_PIP_CLOSED,
    HOST_DOCUMENT_PIP_OPENED,
    HOST_DOCUMENT_PIP_SIGNAL_RECEIVED
} from './actionTypes';
import { clearHostDocumentPiPPendingState, exitPiP } from './actions';
import { getPiPVideoTrack, isDocumentPiPRequestPending, setDocumentPiPRequestPending } from './functions';
import logger from './logger';

import './subscriber';

/**
 * Sender associated with the currently open host-owned Document PiP window.
 */
let mediaCastSender: MediaCastSender | undefined;

/**
 * Returns the live native video track selected for PiP without taking ownership of it.
 *
 * @param {IReduxState} state - Current Redux state.
 * @returns {MediaStreamTrack|null}
 */
function getNativePiPTrack(state: IReduxState): MediaStreamTrack | null {
    const videoTrack = getPiPVideoTrack(state, getLargeVideoParticipant(state));
    const nativeTrack = videoTrack?.jitsiTrack?.getTrack();

    return videoTrack?.muted || nativeTrack?.readyState !== 'live' ? null : nativeTrack;
}

/**
 * Stops and releases the media-cast sender without stopping its conference-owned source track.
 *
 * @returns {void}
 */
function stopSender() {
    mediaCastSender?.stop();
    mediaCastSender = undefined;
}

/**
 * Starts the media-cast sender or updates its current source track.
 *
 * @param {IStore} store - Redux store used to select the initial track.
 * @returns {void}
 */
function startSender(store: IStore) {
    if (mediaCastSender) {
        void mediaCastSender.setTrack(getNativePiPTrack(store.getState()));

        return;
    }

    mediaCastSender = new MediaCastSender({
        onError: error => logger.error('Embedded Document PiP media sender failed:', error),
        onSignal: signal => APP.API.notifyDocumentPiPSignal(signal)
    });
    mediaCastSender.start(getNativePiPTrack(store.getState()));
}

StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => {
        const pipState = state['features/pip'];

        return isEmbedded() && pipState?.isPiPActive
            ? getNativePiPTrack(state)
            : undefined;
    },
    /* listener */ (track: MediaStreamTrack | null | undefined) => {
        if (track !== undefined) {
            mediaCastSender?.setTrack(track)
                .catch(error => logger.error('Failed to update embedded Document PiP track:', error));
        }
    }
);

MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
    case HOST_DOCUMENT_PIP_OPENED:
        // Electron stays on Video PiP and never has a host receiver, so no sender is started.
        if (!browser.isElectron()) {
            startSender(store);
        }
        break;
    case HOST_DOCUMENT_PIP_CLOSED:
        stopSender();
        break;
    case HOST_DOCUMENT_PIP_SIGNAL_RECEIVED:
        mediaCastSender?.handleSignal(action.signal as MediaCastSignal);
        break;
    case CONFERENCE_WILL_LEAVE:
    case CONFERENCE_FAILED:
    case CONFERENCE_LEFT:
        clearHostDocumentPiPPendingState();
        if (store.getState()['features/pip']?.isPiPActive) {
            store.dispatch(exitPiP());
        } else if (isDocumentPiPRequestPending()) {
            setDocumentPiPRequestPending(false);
            APP.API.notifyDocumentPiPClose();
        }
        stopSender();
        break;
    }

    return result;
});
