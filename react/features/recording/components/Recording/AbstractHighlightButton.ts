import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IReduxState, IStore } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import { MEET_FEATURES } from '../../../base/jwt/constants';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { maybeShowPremiumFeatureDialog } from '../../../jaas/actions';
import { hideNotification, showNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE, NOTIFICATION_TYPE } from '../../../notifications/constants';
import { iAmVisitor } from '../../../visitors/functions';
import { highlightMeetingMoment } from '../../actions.any';
import { PROMPT_RECORDING_NOTIFICATION_ID } from '../../constants';
import { getActiveSession, getRecordButtonProps, isHighlightMeetingMomentDisabled } from '../../functions';

import { StartRecordingDialog } from './index';

export interface IProps extends WithTranslation {

    /**
     * Indicates whether or not the button is disabled.
     */
    _disabled: boolean;

    /**
     * Indicates whether or not a highlight request is in progress.
     */
    _isHighlightInProgress: boolean;

    /**
     * Indicates whether or not the button should be visible.
     */
    _visible: boolean;

    /**
     * Redux dispatch function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Abstract class for the {@code AbstractHighlightButton} component.
 */
export default class AbstractHighlightButton<P extends IProps, S={}> extends Component<P, S> {
    /**
     * Initializes a new AbstractHighlightButton instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: P) {
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
                customActionHandler: [ async () => {
                    dispatch(hideNotification(PROMPT_RECORDING_NOTIFICATION_ID));
                    const dialogShown = await dispatch(maybeShowPremiumFeatureDialog(MEET_FEATURES.RECORDING));

                    if (!dialogShown) {
                        dispatch(openDialog(StartRecordingDialog));
                    }
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
export function _abstractMapStateToProps(state: IReduxState) {
    const isRecordingRunning = getActiveSession(state, JitsiRecordingConstants.mode.FILE);
    const isButtonDisabled = isHighlightMeetingMomentDisabled(state);
    const { webhookProxyUrl } = state['features/base/config'];
    const _iAmVisitor = iAmVisitor(state);
    const {
        disabled: isRecordButtonDisabled,
        visible: isRecordButtonVisible
    } = getRecordButtonProps(state);

    const canStartRecording = isRecordButtonVisible && !isRecordButtonDisabled;
    const _visible = Boolean((canStartRecording || isRecordingRunning) && Boolean(webhookProxyUrl) && !_iAmVisitor);

    return {
        _disabled: !isRecordingRunning,
        _isHighlightInProgress: isButtonDisabled,
        _visible
    };
}
