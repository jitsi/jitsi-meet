import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { openHighlightDialog } from '../../../recording/actions.native';
import HighlightButton from '../../../recording/components/Recording/native/HighlightButton';
import RecordingLabel from '../../../recording/components/native/RecordingLabel';
import { isLiveStreamingRunning } from '../../../recording/functions';
import VisitorsCountLabel from '../../../visitors/components/native/VisitorsCountLabel';

import RaisedHandsCountLabel from './RaisedHandsCountLabel';
import {
    LABEL_ID_RAISED_HANDS_COUNT,
    LABEL_ID_RECORDING,
    LABEL_ID_STREAMING,
    LABEL_ID_VISITORS_COUNT,
    LabelHitSlop
} from './constants';

interface IProps {

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     */
    createOnPress: Function;
}

const AlwaysOnLabels = ({ createOnPress }: IProps) => {
    const dispatch = useDispatch();
    const isStreaming = useSelector(isLiveStreamingRunning);
    const openHighlightDialogCallback = useCallback(() =>
        dispatch(openHighlightDialog()), [ dispatch ]);

    return (<>
        <TouchableOpacity
            hitSlop = { LabelHitSlop }
            onPress = { createOnPress(LABEL_ID_RECORDING) } >
            <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
        </TouchableOpacity>
        {
            isStreaming
            && <TouchableOpacity
                hitSlop = { LabelHitSlop }
                onPress = { createOnPress(LABEL_ID_STREAMING) } >
                <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
            </TouchableOpacity>
        }
        <TouchableOpacity
            hitSlop = { LabelHitSlop }
            onPress = { openHighlightDialogCallback }>
            <HighlightButton />
        </TouchableOpacity>
        <TouchableOpacity
            hitSlop = { LabelHitSlop }
            onPress = { createOnPress(LABEL_ID_RAISED_HANDS_COUNT) } >
            <RaisedHandsCountLabel />
        </TouchableOpacity>
        <TouchableOpacity
            hitSlop = { LabelHitSlop }
            onPress = { createOnPress(LABEL_ID_VISITORS_COUNT) } >
            <VisitorsCountLabel />
        </TouchableOpacity>
    </>);
};

export default AlwaysOnLabels;
