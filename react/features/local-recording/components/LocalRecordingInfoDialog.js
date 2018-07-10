/* @flow */

import moment from 'moment';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import {
    PARTICIPANT_ROLE,
    getLocalParticipant
} from '../../base/participants';

import { statsUpdate } from '../actions';
import { recordingController } from '../controller';


/**
 * The type of the React {@code Component} props of
 * {@link LocalRecordingInfoDialog}.
 */
type Props = {

    /**
     * Redux store dispatch function.
     */
    dispatch: Dispatch<*>,

    /**
     * Current encoding format.
     */
    encodingFormat: string,

    /**
     * Whether the local user is the moderator.
     */
    isModerator: boolean,

    /**
     * Whether local recording is engaged.
     */
    isOn: boolean,

    /**
     * The start time of the current local recording session.
     * Used to calculate the duration of recording.
     */
    recordingStartedAt: Date,

    /**
     * Stats of all the participant.
     */
    stats: Object,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * The type of the React {@code Component} state of
 * {@link LocalRecordingInfoDialog}.
 */
type State = {

    /**
     * The recording duration string to be displayed on the UI.
     */
    durationString: string
}

/**
 * A React Component with the contents for a dialog that shows information about
 * local recording. For users with moderator rights, this is also the "control
 * panel" for starting/stopping local recording on all clients.
 *
 * @extends Component
 */
class LocalRecordingInfoDialog extends Component<Props, State> {

    /**
     * Saves a handle to the timer for UI updates,
     * so that it can be cancelled when the component unmounts.
     */
    _timer: ?IntervalID;

    /**
     * Constructor.
     */
    constructor() {
        super();
        this.state = {
            durationString: 'N/A'
        };
    }

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @returns {void}
     */
    componentDidMount() {
        this._timer = setInterval(
            () => {
                this.setState((_prevState, props) => {
                    const nowTime = new Date(Date.now());

                    return {
                        durationString: this._getDuration(nowTime,
                            props.recordingStartedAt)
                    };
                });
                try {
                    this.props.dispatch(
                        statsUpdate(recordingController
                            .getParticipantsStats()));
                } catch (e) {
                    // do nothing
                }
            },
            1000
        );
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @returns {void}
     */
    componentWillUnmount() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }


    /**
     * Returns React elements for displaying the local recording stats of
     * each participant.
     *
     * @returns {ReactElement}
     */
    renderStats() {
        const { stats, t } = this.props;

        if (stats === undefined) {
            return <ul />;
        }
        const ids = Object.keys(stats);

        return (
            <ul>
                {ids.map((id, i) =>

                    // FIXME: a workaround, as arrow functions without `return`
                    // keyword need to be wrapped in parenthesis.
                    /* eslint-disable no-extra-parens */
                    (<li key = { i }>
                        <span>{stats[id].displayName || id}: </span>
                        <span>{stats[id].recordingStats
                            ? `${stats[id].recordingStats.isRecording
                                ? t('localRecording.clientState.on')
                                : t('localRecording.clientState.off')} `
                            + `(${stats[id]
                                .recordingStats.currentSessionToken})`
                            : t('localRecording.clientState.unknown')}</span>
                    </li>)
                    /* eslint-enable no-extra-parens */
                )}
            </ul>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isModerator, encodingFormat, isOn, t } = this.props;
        const { durationString } = this.state;

        return (
            <div
                className = 'info-dialog' >
                <div className = 'info-dialog-column'>
                    <h4 className = 'info-dialog-icon'>
                        <i className = 'icon-info' />
                    </h4>
                </div>
                <div className = 'info-dialog-column'>
                    <div className = 'info-dialog-title'>
                        { t('localRecording.localRecording') }
                    </div>
                    <div>
                        <span className = 'info-label'>
                            {`${t('localRecording.moderator')}:`}
                        </span>
                        <span className = 'spacer'>&nbsp;</span>
                        <span className = 'info-value'>
                            { isModerator
                                ? t('localRecording.yes')
                                : t('localRecording.no') }
                        </span>
                    </div>
                    { isOn && <div>
                        <span className = 'info-label'>
                            {`${t('localRecording.duration')}:`}
                        </span>
                        <span className = 'spacer'>&nbsp;</span>
                        <span className = 'info-value'>
                            { durationString }
                        </span>
                    </div>
                    }
                    {isOn
                    && <div>
                        <span className = 'info-label'>
                            {`${t('localRecording.encoding')}:`}
                        </span>
                        <span className = 'spacer'>&nbsp;</span>
                        <span className = 'info-value'>
                            { encodingFormat }
                        </span>
                    </div>
                    }
                    {
                        isModerator
                        && <div>
                            <div>
                                <span className = 'info-label'>
                                    {`${t('localRecording.participantStats')}:`}
                                </span>
                            </div>
                            { this.renderStats() }
                        </div>
                    }
                    {
                        isModerator
                            && <div className = 'info-dialog-action-links'>
                                <div className = 'info-dialog-action-link'>
                                    {isOn ? <a
                                        onClick = { this._onStop }>
                                        { t('localRecording.stop') }
                                    </a>
                                        : <a
                                            onClick = { this._onStart }>
                                            { t('localRecording.start') }
                                        </a>

                                    }
                                </div>
                            </div>
                    }
                </div>
            </div>
        );
    }

    /**
     * Creates a duration string "HH:MM:SS" from two Date objects.
     *
     * @param {Date} now - Current time.
     * @param {Date} prev - Previous time, the time to be subtracted.
     * @returns {string}
     */
    _getDuration(now, prev) {
        // Still a hack, as moment.js does not support formatting of duration
        // (i.e. TimeDelta). Only works if total duration < 24 hours.
        // But who is going to have a 24-hour long conference?
        return moment(now - prev).utc()
            .format('HH:mm:ss');
    }

    /**
     * Callback function for the Start UI action.
     *
     * @private
     * @returns {void}
     */
    _onStart() {
        recordingController.startRecording();
    }

    /**
     * Callback function for the Stop UI action.
     *
     * @private
     * @returns {void}
     */
    _onStop() {
        recordingController.stopRecording();
    }

}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LocalRecordingInfoDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     encodingFormat: string,
 *     isModerator: boolean,
 *     isOn: boolean,
 *     recordingStartedAt: Date,
 *     stats: Object
 * }}
 */
function _mapStateToProps(state) {
    const {
        encodingFormat,
        isEngaged: isOn,
        recordingStartedAt,
        stats
    } = state['features/local-recording'];
    const isModerator
        = getLocalParticipant(state).role === PARTICIPANT_ROLE.MODERATOR;

    return {
        encodingFormat,
        isModerator,
        isOn,
        recordingStartedAt,
        stats
    };
}

export default translate(connect(_mapStateToProps)(LocalRecordingInfoDialog));
