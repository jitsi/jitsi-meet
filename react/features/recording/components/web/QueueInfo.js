// @flow

import React, { Component } from 'react';

import { getLocalizedDurationFormatter, translate } from '../../../base/i18n';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux';
import { getActiveSession } from '../../functions';


type Props = {

    /**
     * The current position of the participant in the queue.
     */
    _position: ?string,

    /**
     * The recording mode.
     */
    _mode: string,

    /**
     * The ID of the queue.
     */
    _queueID: string,

    /**
     * The time when the recording is expected to start.
     */
    _estimatedTimeOfStart: number,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link QueueInfo}.
 */
type State = {

    /**
     * The current value of the timer for estimated time left.
     */
    timerValue: ?string
};

/**
 * Implements a React {@link Component} which displays the current state of the Jibri Queue.
 *
 * @extends {Component}
 */
class QueueInfo extends Component<Props, State> {

    /**
     * Handle for setInterval timer.
     */
    _interval: IntervalID;

    /**
     * Initializes a new {@code QueueInfo} instance.
     *
     * @param {Props} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            timerValue: undefined
        };
    }

    /**
     * Stops the timer when component will be unmounted.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._stopTimer();
    }

    /**
     * Starts the timer when component will be mounted.
     *
     * @inheritdoc
     */
    componentDidMount() {
        if (typeof this.props._estimatedTimeOfStart !== 'undefined') {
            this._startTimer();
        }
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        if (this.props._estimatedTimeOfStart !== prevProps._estimatedTimeOfStart) {
            this._stopTimer(false);
            this._startTimer();
        }
    }

    /**
     * Sets the current state values that will be used to render the timer.
     *
     * @param {number} refValueUTC - The initial UTC timestamp value.
     * @param {number} currentValueUTC - The current UTC timestamp value.
     *
     * @returns {void}
     */
    _setStateFromUTC(refValueUTC, currentValueUTC) {
        if (!refValueUTC || !currentValueUTC) {
            return;
        }

        const timerMsValue = currentValueUTC > refValueUTC ? 0 : refValueUTC - currentValueUTC;
        const localizedTime = getLocalizedDurationFormatter(timerMsValue);

        this.setState({
            timerValue: localizedTime
        });
    }

    /**
     * Starts the timer.
     *
     * @returns {void}
     */
    _startTimer() {
        const { _estimatedTimeOfStart } = this.props;

        if (!this._interval && typeof _estimatedTimeOfStart !== 'undefined') {
            this._setStateFromUTC(_estimatedTimeOfStart, (new Date()).getTime());
            this._interval = setInterval(() => {
                this._setStateFromUTC(_estimatedTimeOfStart, (new Date()).getTime());
            }, 1000);
        }
    }

    /**
     * Stops the timer.
     *
     * @param {boolean} [clearState] - If true, the timer value in the state will be cleared.
     * @returns {void}
     */
    _stopTimer(clearState = true) {
        if (this._interval) {
            clearInterval(this._interval);
            delete this._interval;
        }

        if (clearState) {
            this.setState({
                timerValue: undefined
            });
        }
    }

    /**
     * Implements React {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { _estimatedTimeOfStart, _mode, _position = 0, t } = this.props;
        const { STREAM } = JitsiRecordingConstants.mode;
        const timeTextKey = `jibriQueue.${_mode === STREAM ? 'livestreaming' : 'recording'}.time`;
        const { timerValue } = this.state;
        const footerText = t(`jibriQueue.${_mode === STREAM ? 'livestreaming' : 'recording'}.footer`);
        const showFooter = typeof footerText === 'string' && footerText.length > 0;


        return (
            <div className = 'jibri-queue-info'>
                <span className = 'position'>
                    { t('jibriQueue.position', { count: _position }) }
                </span>
                {
                    typeof _estimatedTimeOfStart === 'undefined' || timerValue === 'undefined'
                        ? null : <span className = 'time'>
                            { t(timeTextKey, { time: timerValue }) }
                        </span>
                }
                {
                    showFooter ? <div className = 'footer'>{ footerText }</div> : null
                }
            </div>
        );
    }
}


/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractRecordingLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _estimatedTimeOfStart: number,
 *     _mode: string,
 *     _position: string,
 *     _queueID: string,
 *     t: Function
 * }}
 */
export function _mapStateToProps(state: Object) {
    const session = getActiveSession(state);

    if (!session) {
        return {};
    }

    const { id, mode, queueEstimatedTimeOfStart, queueID, queuePosition } = session;

    return {
        _sessionID: id,
        _mode: mode,
        _queueID: queueID,
        _position: queuePosition,
        _estimatedTimeOfStart: queueEstimatedTimeOfStart
    };
}

export default translate(connect(_mapStateToProps)(QueueInfo));
