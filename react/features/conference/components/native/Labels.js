// @flow

import React, { Component } from 'react';
import { TouchableOpacity, View } from 'react-native';

import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { RecordingLabel, RecordingExpandedLabel } from '../../../recording';
import { TranscribingExpandedLabel, TranscribingLabel } from '../../../transcribing';
import { VideoQualityExpandedLabel, VideoQualityLabel } from '../../../video-quality';

import InsecureRoomNameExpandedLabel from './InsecureRoomNameExpandedLabel';
import styles from './styles';

import { InsecureRoomNameLabel } from '.';

type Props = {}

type State = {

    /**
     * String to show which {@code ExpandedLabel} to be shown. (Equals to the
     * label IDs below.)
     */
    visibleExpandedLabel: ?string
}

const LABEL_ID_QUALITY = 'quality';
const LABEL_ID_RECORDING = 'recording';
const LABEL_ID_STREAMING = 'streaming';
const LABEL_ID_TRANSCRIBING = 'transcribing';
const LABEL_ID_INSECURE_ROOM_NAME = 'insecure-room-name';

const LabelHitSlop = {
    top: 10,
    bottom: 10,
    left: 0,
    right: 0
};

/**
 * The {@code ExpandedLabel} components to be rendered for the individual
 * {@code Label}s.
 */
const EXPANDED_LABELS = {
    [LABEL_ID_QUALITY]: VideoQualityExpandedLabel,
    [LABEL_ID_RECORDING]: {
        component: RecordingExpandedLabel,
        props: {
            mode: JitsiRecordingConstants.mode.FILE
        }
    },
    [LABEL_ID_STREAMING]: {
        component: RecordingExpandedLabel,
        props: {
            mode: JitsiRecordingConstants.mode.STREAM
        }
    },
    [LABEL_ID_TRANSCRIBING]: TranscribingExpandedLabel,
    [LABEL_ID_INSECURE_ROOM_NAME]: InsecureRoomNameExpandedLabel
};

/**
 * Timeout to hide the {@ExpandedLabel}.
 */
const EXPANDED_LABEL_TIMEOUT = 5000;

/**
 * A container that renders the conference indicators, if any.
 */
class Labels extends Component<Props, State> {
    /**
     * Timeout for the expanded labels to disappear.
     */
    expandedLabelTimeout: TimeoutID;

    /**
     * Instantiates a new instance of {@code Labels}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);
        this.state = {
            visibleExpandedLabel: undefined
        };
    }

    /**
     * Implements React {@code Component}'s componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        clearTimeout(this.expandedLabelTimeout);
    }

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return (
            <>
                <View pointerEvents = 'box-none'>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.indicatorContainer }>
                        <TouchableOpacity
                            hitSlop = { LabelHitSlop }
                            onPress = { this._createOnPress(LABEL_ID_RECORDING) } >
                            <RecordingLabel mode = { JitsiRecordingConstants.mode.FILE } />
                        </TouchableOpacity>
                        <TouchableOpacity
                            hitSlop = { LabelHitSlop }
                            onPress = { this._createOnPress(LABEL_ID_STREAMING) } >
                            <RecordingLabel mode = { JitsiRecordingConstants.mode.STREAM } />
                        </TouchableOpacity>
                        <TouchableOpacity
                            hitSlop = { LabelHitSlop }
                            onPress = {
                                this._createOnPress(LABEL_ID_TRANSCRIBING)
                            } >
                            <TranscribingLabel />
                        </TouchableOpacity>
                        <TouchableOpacity
                            hitSlop = { LabelHitSlop }
                            onPress = {
                                this._createOnPress(LABEL_ID_INSECURE_ROOM_NAME)
                            } >
                            <InsecureRoomNameLabel />
                        </TouchableOpacity>
                        <TouchableOpacity
                            hitSlop = { LabelHitSlop }
                            onPress = {
                                this._createOnPress(LABEL_ID_QUALITY) } >
                            <VideoQualityLabel />
                        </TouchableOpacity>
                    </View>
                </View>
                { this._renderExpandedLabel() }
            </>
        );
    }

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     *
     * @param {string} label - The identifier of the label that's onLayout is
     * triggered.
     * @returns {Function}
     */
    _createOnPress(label) {
        return () => {
            let { visibleExpandedLabel } = this.state;

            visibleExpandedLabel
                = visibleExpandedLabel === label ? undefined : label;

            clearTimeout(this.expandedLabelTimeout);
            this.setState({
                visibleExpandedLabel
            });

            if (visibleExpandedLabel) {
                this.expandedLabelTimeout = setTimeout(() => {
                    this.setState({
                        visibleExpandedLabel: undefined
                    });
                }, EXPANDED_LABEL_TIMEOUT);
            }
        };
    }

    /**
     * Rendes the expanded (explaining) label for the label that was touched.
     *
     * @returns {React$Element}
     */
    _renderExpandedLabel() {
        const { visibleExpandedLabel } = this.state;

        if (visibleExpandedLabel) {
            const expandedLabel = EXPANDED_LABELS[visibleExpandedLabel];

            if (expandedLabel) {
                const LabelComponent = expandedLabel.component || expandedLabel;
                const { props } = expandedLabel || {};

                return <LabelComponent { ...props } />;
            }
        }

        return null;
    }
}

export default Labels;
