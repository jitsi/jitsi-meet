import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { IJitsiConference } from '../../../base/conference/reducer';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { setVideoMuted } from '../../../base/media/actions';
import { setRequestingSubtitles } from '../../../subtitles/actions.any';
import { stopLocalVideoRecording } from '../../actions';
import { RECORDING_METADATA_ID } from '../../constants';
import { getActiveSession } from '../../functions';
import { ISessionData } from '../../reducer';

import LocalRecordingManager from './LocalRecordingManager';

/**
 * The type of the React {@code Component} props of
 * {@link AbstractStopRecordingDialog}.
 */
export interface IProps extends WithTranslation {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference?: IJitsiConference;

    /**
     * Whether subtitles should be displayed or not.
     */
    _displaySubtitles?: boolean;

    /**
     * The redux representation of the recording session to be stopped.
     */
    _fileRecordingSession?: ISessionData;

    /**
     * Whether the recording is a local recording or not.
     */
    _localRecording: boolean;

    /**
     * The selected language for subtitles.
     */
    _subtitlesLanguage: string | null;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The user trying to stop the video while local recording is running.
     */
    localRecordingVideoStop?: boolean;
}

/**
 * Abstract React Component for getting confirmation to stop a file recording
 * session in progress.
 *
 * @augments Component
 */
export default class AbstractStopRecordingDialog<P extends IProps>
    extends Component<P> {
    /**
     * Initializes a new {@code AbstrStopRecordingDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._toggleScreenshotCapture = this._toggleScreenshotCapture.bind(this);
    }

    /**
     * Stops the recording session.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        sendAnalytics(createRecordingDialogEvent('stop', 'confirm.button'));

        const {
            _conference,
            _displaySubtitles,
            _fileRecordingSession,
            _localRecording,
            _subtitlesLanguage,
            dispatch,
            localRecordingVideoStop
        } = this.props;

        if (_localRecording) {
            dispatch(stopLocalVideoRecording());
            if (localRecordingVideoStop) {
                dispatch(setVideoMuted(true));
            }
        } else if (_fileRecordingSession) {
            _conference?.stopRecording(_fileRecordingSession.id);
            this._toggleScreenshotCapture();
        }

        // TODO: this should be an action in transcribing. -saghul
        this.props.dispatch(setRequestingSubtitles(Boolean(_displaySubtitles), _displaySubtitles, _subtitlesLanguage));

        this.props._conference?.getMetadataHandler().setMetadata(RECORDING_METADATA_ID, {
            isTranscribingEnabled: false
        });

        return true;
    }

    /**
     * Toggles screenshot capture feature.
     *
     * @returns {void}
     */
    _toggleScreenshotCapture() {
        // To be implemented by subclass.
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StopRecordingDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    const {
        _displaySubtitles,
        _language: _subtitlesLanguage
    } = state['features/subtitles'];

    return {
        _conference: state['features/base/conference'].conference,
        _displaySubtitles,
        _fileRecordingSession:
            getActiveSession(state, JitsiRecordingConstants.mode.FILE),
        _localRecording: LocalRecordingManager.isRecordingLocally(),
        _subtitlesLanguage
    };
}
