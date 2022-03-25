// @flow

import { Component } from 'react';
import { batch } from 'react-redux';

import { getActiveSession, isHighlightMeetingMomentDisabled } from '../..';
import { openDialog } from '../../../base/dialog';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import {
    hideNotification,
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    showNotification
} from '../../../notifications';
import { highlightMeetingMoment } from '../../actions.any';
import { StartRecordingDialog } from '../../components';
import { PROMPT_RECORDING_NOTIFICATION_ID } from '../../constants';
import { getRecordButtonProps } from '../../functions';

export type Props = {

    /**
     * Indicates whether or not the button is disabled.
     */
    _disabled: boolean,

    /**
     * Indicates whether or not a highlight request is in progress.
     */
    _isHighlightInProgress: boolean,

    /**
     * Indicates whether or not the button should be visible.
     */
    _visible: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Abstract class for the {@code AbstractHighlightButton} component.
 */
export default class AbstractHighlightButton<P: Props> extends Component<P> {
    /**
     * Initializes a new AbstractHighlightButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._onClick = this._onClick.bind(this);
    }

    /**
   * Handles clicking / pressing the button.
   *
   * @override
   * @protected
   * @returns {void}
   */
    _onClick() {
        const { _disabled, _isHighlightInProgress, dispatch } = this.props;

        if (_isHighlightInProgress) {
            return;
        }

        if (_disabled) {
            dispatch(showNotification({
                descriptionKey: 'recording.highlightMomentDisabled',
                titleKey: 'recording.highlightMoment',
                uid: PROMPT_RECORDING_NOTIFICATION_ID,
                customActionNameKey: [ 'localRecording.start' ],
                customActionHandler: [ () => {
                    batch(() => {
                        dispatch(hideNotification(PROMPT_RECORDING_NOTIFICATION_ID));
                        dispatch(openDialog(StartRecordingDialog));
                    });
                } ],
                appearance: NOTIFICATION_TYPE.NORMAL
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        } else {
            dispatch(highlightMeetingMoment());
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code AbstractHighlightButton}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _disabled: boolean,
 *     _isHighlightInProgress: boolean,
 *     _visible: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const isRecordingRunning = getActiveSession(state, JitsiRecordingConstants.mode.FILE);
    const isButtonDisabled = isHighlightMeetingMomentDisabled(state);
    const { webhookProxyUrl } = state['features/base/config'];

    const {
        disabled: isRecordButtonDisabled,
        visible: isRecordButtonVisible
    } = getRecordButtonProps(state);

    return {
        _disabled: !isRecordingRunning,
        _isHighlightInProgress: isButtonDisabled,
        _visible: isRecordButtonVisible && !isRecordButtonDisabled && Boolean(webhookProxyUrl)
    };
}
