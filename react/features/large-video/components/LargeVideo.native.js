// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { ParticipantView } from '../../base/participants';
import { DimensionsDetector } from '../../base/responsive-ui';

import styles, { AVATAR_SIZE } from './styles';

type Props = {

    /**
     * The ID of the participant (to be) depicted by LargeVideo.
     *
     * @private
     */
    _participantId: string
};

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
    constructor(props) {
        super(props);

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

        let newState;

        if (size < AVATAR_SIZE * 1.5) {
            newState = {
                avatarSize: size - 15, // Leave some margin.
                useConnectivityInfoLabel: false
            };
        } else {
            newState = DEFAULT_STATE;
        }

        this.setState(newState);
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

        return (
            <DimensionsDetector
                onDimensionsChanged = { this._onDimensionsChanged } >
                <ParticipantView
                    avatarSize = { avatarSize }
                    participantId = { this.props._participantId }
                    style = { styles.largeVideo }
                    useConnectivityInfoLabel = { useConnectivityInfoLabel }
                    zOrder = { 0 } />
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
 *     _participantId: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _participantId: state['features/large-video'].participantId
    };
}

export default connect(_mapStateToProps)(LargeVideo);
