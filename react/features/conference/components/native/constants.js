// @flow

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { RecordingExpandedLabel } from '../../../recording';
import { TranscribingExpandedLabel } from '../../../transcribing';
import { VideoQualityExpandedLabel } from '../../../video-quality';

import InsecureRoomNameExpandedLabel from './InsecureRoomNameExpandedLabel';
import RaisedHandsCountExpandedLabel from './RaisedHandsCountExpandedLabel';

export const LabelHitSlop = {
    top: 10,
    bottom: 10,
    left: 0,
    right: 0
};

/**
 * Timeout to hide the {@ExpandedLabel}.
 */
export const EXPANDED_LABEL_TIMEOUT = 5000;

export const LABEL_ID_QUALITY = 'quality';
export const LABEL_ID_RECORDING = 'recording';
export const LABEL_ID_STREAMING = 'streaming';
export const LABEL_ID_TRANSCRIBING = 'transcribing';
export const LABEL_ID_INSECURE_ROOM_NAME = 'insecure-room-name';
export const LABEL_ID_RAISED_HANDS_COUNT = 'raised-hands-count';

/**
 * The {@code ExpandedLabel} components to be rendered for the individual
 * {@code Label}s.
 */
export const EXPANDED_LABELS = {
    [LABEL_ID_QUALITY]: VideoQualityExpandedLabel,
    [LABEL_ID_RECORDING]: {
        component: RecordingExpandedLabel,
        props: {
            mode: JitsiRecordingConstants.mode.FILE
        },
        alwaysOn: true
    },
    [LABEL_ID_STREAMING]: {
        component: RecordingExpandedLabel,
        props: {
            mode: JitsiRecordingConstants.mode.STREAM
        },
        alwaysOn: true
    },
    [LABEL_ID_TRANSCRIBING]: TranscribingExpandedLabel,
    [LABEL_ID_INSECURE_ROOM_NAME]: InsecureRoomNameExpandedLabel,
    [LABEL_ID_RAISED_HANDS_COUNT]: {
        component: RaisedHandsCountExpandedLabel,
        alwaysOn: true
    }
};
