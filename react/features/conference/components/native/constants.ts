import React from 'react';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import RecordingExpandedLabel from '../../../recording/components/native/RecordingExpandedLabel';
import TranscribingExpandedLabel from '../../../transcribing/components/TranscribingExpandedLabel.native';
import VideoQualityExpandedLabel from '../../../video-quality/components/VideoQualityExpandedLabel.native';

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
export const LABEL_ID_VISITORS_COUNT = 'visitors-count';

interface IExpandedLabel {
    alwaysOn?: boolean;
    component: React.ComponentType<any>;
    props?: any;
}

/**
 * The {@code ExpandedLabel} components to be rendered for the individual
 * {@code Label}s.
 */
export const EXPANDED_LABELS: {
    [key: string]: IExpandedLabel;
} = {
    [LABEL_ID_QUALITY]: {
        component: VideoQualityExpandedLabel
    },
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
    [LABEL_ID_TRANSCRIBING]: {
        component: TranscribingExpandedLabel
    },
    [LABEL_ID_INSECURE_ROOM_NAME]: {
        component: InsecureRoomNameExpandedLabel
    },
    [LABEL_ID_RAISED_HANDS_COUNT]: {
        component: RaisedHandsCountExpandedLabel,
        alwaysOn: true
    }
};
