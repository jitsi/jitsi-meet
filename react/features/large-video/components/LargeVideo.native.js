// @flow

import React, { Component } from 'react';

import { ColorSchemeRegistry } from '../../base/color-scheme';
import { ParticipantView } from '../../base/participants';
import { connect } from '../../base/redux';
import { DimensionsDetector } from '../../base/responsive-ui';
import { StyleType } from '../../base/styles';

import { AVATAR_SIZE } from './styles';

/**
 * The type of the React {@link Component} props of {@link LargeVideo}.
 */
type Props = {

    /**
     * The ID of the participant (to be) depicted by LargeVideo.
     *
     * @private
     */
    _participantId: string,

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * Callback to invoke when the {@code LargeVideo} is clicked/pressed.
     */
    onClick: Function,
};

/**
 * The type of the React {@link Component} state of {@link LargeVideo}.
 */
type State = {

    /**
     * Size for the Avatar. It will be dynamically adjusted based on the
     * available size.
     */
    avatarSize: number,

    /**
     * Whether the connectivity indicator will be shown or not. It will be true
     * by default, but it may be turned off if there is not enough space.
     */
    useConnectivityInfoLabel: boolean
};

const DEFAULT_STATE = {
    avatarSize: AVATAR_SIZE,
    useConnectivityInfoLabel: true
};

/**
 * Implements a React {@link Component} which represents the large video (a.k.a.
 * the conference participant who is on the local stage) on mobile/React Native.
 *
 * @extends Component
 */
class LargeVideo extends Component<Props, State> {
    state = {
        ...DEFAULT_STATE
    };

    /** Initializes a new {@code LargeVideo} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onDimensionsChanged = this._onDimensionsChanged.bind(this);
    }

    _onDimensionsChanged: (width: number, height: number) => void;

    /**
     * Handle this component's dimension changes. In case we deem it's too
     * small, the connectivity indicator won't be rendered and the avatar
     * will occupy the entirety of the available screen state.
     *
     * @param {number} width - The component's current width.
     * @param {number} height - The component's current height.
     * @private
     * @returns {void}
     */
    _onDimensionsChanged(width: number, height: number) {
        // Get the size, rounded to the nearest even number.
        const size = 2 * Math.round(Math.min(height, width) / 2);
        let nextState;

        if (size < AVATAR_SIZE * 1.5) {
            nextState = {
                avatarSize: size - 15, // Leave some margin.
                useConnectivityInfoLabel: false
            };
        } else {
            nextState = DEFAULT_STATE;
        }

        this.setState(nextState);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            avatarSize,
            useConnectivityInfoLabel
        } = this.state;
        const {
            _participantId,
            _styles,
            onClick
        } = this.props;

        return (
            <DimensionsDetector
                onDimensionsChanged = { this._onDimensionsChanged }>
                <ParticipantView
                    avatarSize = { avatarSize }
                    onPress = { onClick }
                    participantId = { _participantId }
                    style = { _styles.largeVideo }
                    testHintId = 'org.jitsi.meet.LargeVideo'
                    useConnectivityInfoLabel = { useConnectivityInfoLabel }
                    zOrder = { 0 }
                    zoomEnabled = { true } />
            </DimensionsDetector>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated LargeVideo's props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _participantId: string,
 *     _styles: StyleType
 * }}
 */
function _mapStateToProps(state) {
    return {
        _participantId: state['features/large-video'].participantId,
        _styles: ColorSchemeRegistry.get(state, 'LargeVideo')
    };
}

export default connect(_mapStateToProps)(LargeVideo);
