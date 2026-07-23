import i18next from 'i18next';

import { getName as getApplicationName } from '../app/functions.web';
import { IReduxState } from '../app/types';
import { getAvatarColor, getInitials } from '../base/avatar/functions';
import { IGUMPendingState } from '../base/media/types';
import { getLocalParticipant, getParticipantDisplayName } from '../base/participants/functions';
import { IParticipant } from '../base/participants/types';
import { ITrack } from '../base/tracks/types';
import { getLargeVideoParticipant } from '../large-video/functions';
import { isPrejoinPageVisible } from '../prejoin/functions.any';
import { mapStateToProps as mapAudioButtonState } from '../toolbox/components/AbstractAudioMuteButton';
import { mapStateToProps as mapVideoButtonState } from '../toolbox/components/AbstractVideoMuteButton';

import { isEmbeddedDocumentPiPEnabled } from './external-api.shared';
import { getPiPVideoTrack } from './functions';
import { EmbeddedDocumentPiPCapability } from './types';

/**
 * Serializable state for the controls rendered in the isolated iframe.
 */
export interface IEmbeddedDocumentPiPControlsViewModel {
    audioDisabled: boolean;
    audioMuted: boolean;
    audioPending: boolean;
    audioVisible: boolean;
    labels: {
        hangup: string;
        muteAudio: string;
        muteVideo: string;
        pendingAudio: string;
        pendingVideo: string;
        unmuteAudio: string;
        unmuteVideo: string;
    };
    videoDisabled: boolean;
    videoMuted: boolean;
    videoPending: boolean;
    videoVisible: boolean;
}

/**
 * Serializable Redux projection consumed by the isolated iframe renderer.
 */
export interface IEmbeddedDocumentPiPViewModel {
    avatar: {
        color: string;
        initials: string;
        url?: string;
        useCORS?: boolean;
    };
    controls: IEmbeddedDocumentPiPControlsViewModel;
    displayName: string;
    videoAvailable: boolean;
    videoMuted: boolean;
}

/**
 * Non-serializable Redux projection used only by the iframe WebRTC bridge.
 */
export interface IEmbeddedDocumentPiPVideoBridge {
    browserTrack: MediaStreamTrack | null;
    jitsiTrack?: any;
    muted: boolean;
    participantId?: string;
    ready: boolean;
    reduxTrack?: ITrack;
}

export function getEmbeddedDocumentPiPParticipant(state: IReduxState): IParticipant | undefined {
    if (isPrejoinPageVisible(state)) {
        return getLocalParticipant(state);
    }

    return getLargeVideoParticipant(state) || getLocalParticipant(state);
}

export function isEmbeddedDocumentPiPConfigured(state: IReduxState): boolean {
    return isEmbeddedDocumentPiPEnabled(state['features/base/config'].pip);
}

export function isEmbeddedDocumentPiPAvailable(state: IReduxState): boolean {
    return isEmbeddedDocumentPiPConfigured(state)
        && state['features/pip']?.embeddedDocumentPiPCapability === EmbeddedDocumentPiPCapability.AVAILABLE;
}

export function isEmbeddedDocumentPiPCapabilityPending(state: IReduxState): boolean {
    return isEmbeddedDocumentPiPConfigured(state)
        && state['features/pip']?.embeddedDocumentPiPCapability === EmbeddedDocumentPiPCapability.UNKNOWN;
}

function getEmbeddedDocumentPiPControlsViewModel(
        state: IReduxState): IEmbeddedDocumentPiPControlsViewModel {
    const audio = mapAudioButtonState(state);
    const video = mapVideoButtonState(state);
    const media = state['features/base/media'];

    return {
        audioDisabled: audio._disabled,
        audioMuted: audio._audioMuted,
        audioPending: media.audio.gumPending !== IGUMPendingState.NONE,
        audioVisible: audio.visible !== false,
        labels: {
            hangup: i18next.t('toolbar.accessibilityLabel.hangup'),
            muteAudio: i18next.t('toolbar.accessibilityLabel.mute'),
            muteVideo: i18next.t('toolbar.accessibilityLabel.videomute'),
            pendingAudio: i18next.t('toolbar.accessibilityLabel.muteGUMPending'),
            pendingVideo: i18next.t('toolbar.accessibilityLabel.videomuteGUMPending'),
            unmuteAudio: i18next.t('toolbar.accessibilityLabel.unmute'),
            unmuteVideo: i18next.t('toolbar.accessibilityLabel.videounmute')
        },
        videoDisabled: video._videoDisabled,
        videoMuted: video._videoMuted,
        videoPending: media.video.gumPending !== IGUMPendingState.NONE,
        videoVisible: video.visible !== false
    };
}

export function getEmbeddedDocumentPiPViewModel(state: IReduxState): IEmbeddedDocumentPiPViewModel {
    const participant = getEmbeddedDocumentPiPParticipant(state);
    const videoTrack = getPiPVideoTrack(state, participant);
    const displayName = (participant?.id
        ? getParticipantDisplayName(state, participant.id)
        : participant?.name) || i18next.t('welcomepage.headerTitle') || getApplicationName();
    const customAvatarBackgrounds = state['features/dynamic-branding']?.avatarBackgrounds || [];

    return {
        avatar: {
            color: getAvatarColor(displayName, customAvatarBackgrounds),
            initials: getInitials(displayName) || '',
            useCORS: participant?.loadableAvatarUrlUseCORS,
            url: participant?.loadableAvatarUrl
        },
        controls: getEmbeddedDocumentPiPControlsViewModel(state),
        displayName,
        videoAvailable: Boolean(videoTrack?.jitsiTrack),
        videoMuted: Boolean(videoTrack?.muted)
    };
}

export function getEmbeddedDocumentPiPVideoBridge(state: IReduxState): IEmbeddedDocumentPiPVideoBridge {
    const participant = getEmbeddedDocumentPiPParticipant(state);
    const reduxTrack = getPiPVideoTrack(state, participant);
    const jitsiTrack = reduxTrack?.jitsiTrack;
    const stream = jitsiTrack?.getOriginalStream?.() || null;
    const browserTrack = stream?.getVideoTracks?.()[0] || null;
    const muted = Boolean(reduxTrack?.muted);
    const ready = Boolean(browserTrack && browserTrack.readyState === 'live' && !muted);

    return {
        browserTrack,
        jitsiTrack,
        muted,
        participantId: participant?.id,
        ready,
        reduxTrack
    };
}
