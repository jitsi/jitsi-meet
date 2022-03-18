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

export type Props = {

    /**
     * Whether or not the conference is in audio only mode.
     */
    _audioOnly: boolean,

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
     * Initializes a new AbstractVideoTrack instance.
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
        const { _disabled, dispatch } = this.props;

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
 * {@code AbstractVideoQualityLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioOnly: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object) {
    const isRecordingRunning = getActiveSession(state, JitsiRecordingConstants.mode.FILE);
    const isButtonDisabled = isHighlightMeetingMomentDisabled(state);
    const { webhookProxyUrl } = state['features/base/config'];

    return {
        _disabled: !isRecordingRunning || isButtonDisabled,
        _visible: Boolean(webhookProxyUrl)
    };
}
