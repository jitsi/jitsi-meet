import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState } from '../../app/types';
import { JitsiRecordingConstants } from '../../base/lib-jitsi-meet';
import { getSessionStatusToShow } from '../functions';


interface IProps extends WithTranslation {

    /**
     * Whether this is the Jibri recorder participant.
     */
    _iAmRecorder: boolean;

    /**
     * Whether this meeting is being transcribed.
     */
    _isTranscribing: boolean;

    /**
     * The status of the higher priority session.
     */
    _status?: string;

    /**
     * An object containing the CSS classes.
     */
    classes?: { [ key: string]: string; };

    /**
     * The recording mode this indicator should display.
     */
    mode: string;
}

/**
 * State of the component.
 */
interface IState {

    /**
     * True if the label status is stale, so it needs to be removed.
     */
    staleLabel: boolean;
}

/**
 * The timeout after a label is considered stale. See {@code _updateStaleStatus}
 * for more details.
 */
const STALE_TIMEOUT = 10 * 1000;

/**
 * Abstract class for the {@code RecordingLabel} component.
 */
export default class AbstractRecordingLabel extends Component<IProps, IState> {
    _mounted: boolean;

    /**
     * Implements {@code Component#getDerivedStateFromProps}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps, prevState: IState) {
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
    constructor(props: IProps) {
        super(props);

        this.state = {
            staleLabel: true
        };

        this._updateStaleStatus(undefined, props);
    }

    /**
     * Implements React {@code Component}'s componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._mounted = true;
    }

    /**
     * Implements React {@code Component}'s componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._mounted = false;
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: IProps) {
        this._updateStaleStatus(prevProps, this.props);
    }

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        return (this.props._status || this.props._isTranscribing) && !this.state.staleLabel && !this.props._iAmRecorder
            ? this._renderLabel() : null;
    }

    /**
     * Renders the platform specific label component.
     *
     * @protected
     * @returns {React$Element}
     */
    _renderLabel(): React.ReactNode | null {
        return null;
    }

    /**
     * Updates the stale status of the label on a prop change. A label is stale
     * if it's in a {@code _status} that doesn't need to be rendered anymore.
     *
     * @param {IProps} oldProps - The previous props of the component.
     * @param {IProps} newProps - The new props of the component.
     * @returns {void}
     */
    _updateStaleStatus(oldProps: IProps | undefined, newProps: IProps) {
        if (newProps._status === JitsiRecordingConstants.status.OFF) {
            if (oldProps?._status !== JitsiRecordingConstants.status.OFF) {
                setTimeout(() => {
                    if (!this._mounted) {
                        return;
                    }

                    // Only if it's still OFF.
                    if (this.props._status === JitsiRecordingConstants.status.OFF) {
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
 * @param {IProps} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _status: ?string
 * }}
 */
export function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { mode } = ownProps;

    return {
        _iAmRecorder: Boolean(state['features/base/config'].iAmRecorder),
        _isTranscribing: state['features/transcribing'].isTranscribing,
        _status: getSessionStatusToShow(state, mode)
    };
}
