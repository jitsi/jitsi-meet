// @flow

import { Component } from 'react';

import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';

import { getSessionStatusToShow } from '../functions';

/**
 * NOTE: Web currently renders multiple indicators if multiple recording
 * sessions are running. This is however may not be a good UX as it's not
 * obvious why there are multiple similar 'REC' indicators rendered. Mobile
 * only renders one indicator if there is at least one recording session
 * running. These boolean are shared across the two components to make it
 * easier to align web's behaviour to mobile's later if necessary.
 */
type Props = {

    /**
     * The status of the highermost priority session.
     */
    _status: ?string,

    /**
     * The recording mode this indicator should display.
     */
    mode: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * State of the component.
 */
type State = {

    /**
     * True if the label status is stale, so it needs to be removed.
     */
    staleLabel: boolean
};

/**
 * The timeout after a label is considered stale. See {@code _updateStaleStatus}
 * for more details.
 */
const STALE_TIMEOUT = 10 * 1000;

/**
 * Abstract class for the {@code RecordingLabel} component.
 */
export default class AbstractRecordingLabel
    extends Component<Props, State> {
    /**
     * Implements {@code Component#getDerivedStateFromProps}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, prevState: State) {
        return {
            staleLabel: props._status !== JitsiRecordingConstants.status.OFF
                && prevState.staleLabel ? false : prevState.staleLabel
        };
    }

    /**
     * Initializes a new {@code AbstractRecordingLabel} component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            staleLabel: false
        };

        this._updateStaleStatus({}, props);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        this._updateStaleStatus(prevProps, this.props);
    }

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return this.props._status && !this.state.staleLabel
            ? this._renderLabel() : null;
    }

    _getLabelKey: () => ?string

    /**
     * Returns the label key that this indicator should render.
     *
     * @protected
     * @returns {?string}
     */
    _getLabelKey() {
        switch (this.props.mode) {
        case JitsiRecordingConstants.mode.STREAM:
            return 'recording.live';
        case JitsiRecordingConstants.mode.FILE:
            return 'recording.rec';
        default:
            // Invalid mode is passed to the component.
            return undefined;
        }
    }

    /**
     * Renders the platform specific label component.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderLabel: () => React$Element<*>

    /**
     * Updates the stale status of the label on a prop change. A label is stale
     * if it's in a {@code _status} that doesn't need to be rendered anymore.
     *
     * @param {Props} oldProps - The previous props of the component.
     * @param {Props} newProps - The new props of the component.
     * @returns {void}
     */
    _updateStaleStatus(oldProps, newProps) {
        if (newProps._status === JitsiRecordingConstants.status.OFF) {
            if (oldProps._status !== JitsiRecordingConstants.status.OFF) {
                setTimeout(() => {
                    // Only if it's still OFF.
                    if (this.props._status
                            === JitsiRecordingConstants.status.OFF) {
                        this.setState({
                            staleLabel: true
                        });
                    }
                }, STALE_TIMEOUT);
            }
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractRecordingLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _status: ?string
 * }}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { mode } = ownProps;

    return {
        _status: getSessionStatusToShow(state, mode)
    };
}
