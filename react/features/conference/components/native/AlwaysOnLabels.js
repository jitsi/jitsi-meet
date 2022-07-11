// @flow

import React, { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { RecordingLabel } from '../../../recording';
import { openHighlightDialog } from '../../../recording/actions.native';
import HighlightButton from '../../../recording/components/Recording/native/HighlightButton';

import RaisedHandsCountLabel from './RaisedHandsCountLabel';
import {
    LabelHitSlop,
    LABEL_ID_RAISED_HANDS_COUNT,
    LABEL_ID_RECORDING,
    LABEL_ID_STREAMING
} from './constants';

type Props = {

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     */
    createOnPress: Function
}

const AlwaysOnLabels = ({ createOnPress }: Props) => {
    const dispatch = useDispatch();
    const openHighlightDialogCallback = useCallback(() => dispatch(openHighlightDialog()), [ dispatch ]);

    return (<>
        <TouchableOpacity
            hitSlop = { LabelHitSlop }
            onPress = { createOnPress(LABEL_ID_RECORDING) } >
            <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
        </TouchableOpacity>
        <TouchableOpacity
            hitSlop = { LabelHitSlop }
            onPress = { createOnPress(LABEL_ID_STREAMING) } >
            <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
        </TouchableOpacity>
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
    </>);
};

export default AlwaysOnLabels;
