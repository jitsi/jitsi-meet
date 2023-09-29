import { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createRecordingDialogEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { IJitsiConference } from '../../../base/conference/reducer';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { updateDropboxToken } from '../../../dropbox/actions';
import { getDropboxData, getNewAccessToken, isEnabled as isDropboxEnabled } from '../../../dropbox/functions.any';
import { showErrorNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { toggleRequestingSubtitles } from '../../../subtitles/actions';
import { setSelectedRecordingService, startLocalVideoRecording } from '../../actions';
import { RECORDING_TYPES } from '../../constants';
import { supportsLocalRecording } from '../../functions';

export interface IProps extends WithTranslation {

    /**
     * The app key for the dropbox authentication.
     */
    _appKey: string;

    /**
     * Requests subtitles when recording is turned on.
     */
    _autoCaptionOnRecord: boolean;

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference?: IJitsiConference;

    /**
     * Whether to show file recordings service, even if integrations
     * are enabled.
     */
    _fileRecordingsServiceEnabled: boolean;

    /**
     * Whether to show the possibility to share file recording with other people (e.g. Meeting participants), based on
     * the actual implementation on the backend.
     */
    _fileRecordingsServiceSharingEnabled: boolean;

    /**
     * If true the dropbox integration is enabled, otherwise - disabled.
     */
    _isDropboxEnabled: boolean;

    /**
     * Whether or not local recording is enabled.
     */
    _localRecordingEnabled: boolean;

    /**
     * The dropbox refresh token.
     */
    _rToken: string;

    /**
     * Whether or not the local participant is screensharing.
     */
    _screensharing: boolean;

    /**
     * Whether or not the screenshot capture feature is enabled.
     */
    _screenshotCaptureEnabled: boolean;

    /**
     * The dropbox access token.
     */
    _token: string;

    /**
     * Access token's expiration date as UNIX timestamp.
     */
    _tokenExpireDate?: number;

    /**
     * The redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    navigation: any;
}

interface IState {

    /**
     * <tt>true</tt> if we have valid oauth token.
     */
    isTokenValid: boolean;

    /**
     * <tt>true</tt> if we are in process of validating the oauth token.
     */
    isValidating: boolean;

    /**
     * Whether the local recording should record just the local user streams.
     */
    localRecordingOnlySelf: boolean;

    /**
     * The currently selected recording service of type: RECORDING_TYPES.
     */
    selectedRecordingService: string;

    /**
     * True if the user requested the service to share the recording with others.
     */
    sharingEnabled: boolean;

    /**
     * Number of MiB of available space in user's Dropbox account.
     */
    spaceLeft?: number;

    /**
     * The display name of the user's Dropbox account.
     */
    userName?: string;
}

/**
 * Component for the recording start dialog.
 */
class AbstractStartRecordingDialog extends Component<IProps, IState> {
    /**
     * Initializes a new {@code StartRecordingDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
        this._onSelectedRecordingServiceChanged
            = this._onSelectedRecordingServiceChanged.bind(this);
        this._onSharingSettingChanged = this._onSharingSettingChanged.bind(this);
        this._toggleScreenshotCapture = this._toggleScreenshotCapture.bind(this);
        this._onLocalRecordingSelfChange = this._onLocalRecordingSelfChange.bind(this);

        let selectedRecordingService = '';

        // TODO: Potentially check if we need to handle changes of
        // _fileRecordingsServiceEnabled and _areIntegrationsEnabled()
        if (this.props._fileRecordingsServiceEnabled
                || !this._areIntegrationsEnabled()) {
            selectedRecordingService = RECORDING_TYPES.JITSI_REC_SERVICE;
        } else if (this._areIntegrationsEnabled()) {
            if (props._localRecordingEnabled && supportsLocalRecording()) {
                selectedRecordingService = RECORDING_TYPES.LOCAL;
            } else {
                selectedRecordingService = RECORDING_TYPES.DROPBOX;
            }
        }

        this.state = {
            isTokenValid: false,
            isValidating: false,
            userName: undefined,
            sharingEnabled: true,
            spaceLeft: undefined,
            selectedRecordingService,
            localRecordingOnlySelf: false
        };
    }

    /**
     * Validates the oauth access token.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (typeof this.props._token !== 'undefined') {
            this._onTokenUpdated();
        }
    }

    /**
     * Validates the oauth access token.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        if (this.props._token !== prevProps._token) {
            this._onTokenUpdated();
        }
    }

    /**
     * Returns true if the integrations with third party services are enabled
     * and false otherwise.
     *
     * @returns {boolean} - True if the integrations with third party services
     * are enabled and false otherwise.
     */
    _areIntegrationsEnabled() {
        return this.props._isDropboxEnabled;
    }

    /**
     * Callback to handle sharing setting change from the dialog.
     *
     * @returns {void}
     */
    _onSharingSettingChanged() {
        this.setState({
            sharingEnabled: !this.state.sharingEnabled
        });
    }

    /**
     * Callback to handle local recording only self setting change.
     *
     * @returns {void}
     */
    _onLocalRecordingSelfChange() {
        this.setState({
            localRecordingOnlySelf: !this.state.localRecordingOnlySelf
        });
    }

    /**
     * Handles selected recording service changes.
     *
     * @param {string} selectedRecordingService - The new selected recording
     * service.
     * @returns {void}
     */
    _onSelectedRecordingServiceChanged(selectedRecordingService: string) {
        this.setState({ selectedRecordingService }, () => {
            this.props.dispatch(setSelectedRecordingService(selectedRecordingService));
        });
    }

    /**
     * Validates the dropbox access token and fetches account information.
     *
     * @returns {void}
     */
    _onTokenUpdated() {
        const { _appKey, _isDropboxEnabled, _token, _rToken, _tokenExpireDate, dispatch } = this.props;

        if (!_isDropboxEnabled) {
            return;
        }

        if (typeof _token === 'undefined') {
            this.setState({
                isTokenValid: false,
                isValidating: false
            });
        } else { // @ts-ignore
            if (_tokenExpireDate && Date.now() > new Date(_tokenExpireDate)) {
                getNewAccessToken(_appKey, _rToken)
                    .then((resp: { expireDate: number; rToken: string; token: string; }) =>
                        dispatch(updateDropboxToken(resp.token, resp.rToken, resp.expireDate)));

                return;
            }

            this.setState({
                isTokenValid: false,
                isValidating: true
            });
            getDropboxData(_token, _appKey).then(data => {
                if (typeof data === 'undefined') {
                    this.setState({
                        isTokenValid: false,
                        isValidating: false
                    });
                } else {
                    this.setState({
                        isTokenValid: true,
                        isValidating: false,
                        ...data
                    });
                }
            });
        }
    }

    /**
     * Starts a file recording session.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        const {
            _appKey,
            _autoCaptionOnRecord,
            _conference,
            _isDropboxEnabled,
            _rToken,
            _token,
            dispatch
        } = this.props;
        let appData;
        const attributes: {
            type?: string;
        } = {};

        switch (this.state.selectedRecordingService) {
        case RECORDING_TYPES.DROPBOX: {
            if (_isDropboxEnabled && _token) {
                appData = JSON.stringify({
                    'file_recording_metadata': {
                        'upload_credentials': {
                            'service_name': RECORDING_TYPES.DROPBOX,
                            'token': _token,
                            'r_token': _rToken,
                            'app_key': _appKey
                        }
                    }
                });
                attributes.type = RECORDING_TYPES.DROPBOX;
            } else {
                dispatch(showErrorNotification({
                    titleKey: 'dialog.noDropboxToken'
                }, NOTIFICATION_TIMEOUT_TYPE.LONG));

                return;
            }
            break;
        }
        case RECORDING_TYPES.JITSI_REC_SERVICE: {
            appData = JSON.stringify({
                'file_recording_metadata': {
                    'share': this.state.sharingEnabled
                }
            });
            attributes.type = RECORDING_TYPES.JITSI_REC_SERVICE;
            break;
        }
        case RECORDING_TYPES.LOCAL: {
            dispatch(startLocalVideoRecording(this.state.localRecordingOnlySelf));

            return true;
        }
        }

        sendAnalytics(
            createRecordingDialogEvent('start', 'confirm.button', attributes)
        );

        this._toggleScreenshotCapture();
        _conference?.startRecording({
            mode: JitsiRecordingConstants.mode.FILE,
            appData
        });

        if (_autoCaptionOnRecord) {
            dispatch(toggleRequestingSubtitles());
        }

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

    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderDialogContent: () => React.Component;
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StartRecordingDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @param {any} _ownProps - Component's own props.
 * @private
 * @returns {{
 *     _appKey: string,
 *     _autoCaptionOnRecord: boolean,
 *     _conference: JitsiConference,
 *     _fileRecordingsServiceEnabled: boolean,
 *     _fileRecordingsServiceSharingEnabled: boolean,
 *     _isDropboxEnabled: boolean,
 *     _rToken:string,
 *     _tokenExpireDate: number,
 *     _token: string
 * }}
 */
export function mapStateToProps(state: IReduxState, _ownProps: any) {
    const {
        transcription,
        recordingService,
        dropbox = { appKey: undefined },
        localRecording
    } = state['features/base/config'];

    return {
        _appKey: dropbox.appKey ?? '',
        _autoCaptionOnRecord: transcription?.autoCaptionOnRecord ?? false,
        _conference: state['features/base/conference'].conference,
        _fileRecordingsServiceEnabled: recordingService?.enabled ?? false,
        _fileRecordingsServiceSharingEnabled: recordingService?.sharingEnabled ?? false,
        _isDropboxEnabled: isDropboxEnabled(state),
        _localRecordingEnabled: !localRecording?.disable,
        _rToken: state['features/dropbox'].rToken ?? '',
        _tokenExpireDate: state['features/dropbox'].expireDate,
        _token: state['features/dropbox'].token ?? ''
    };
}

export default AbstractStartRecordingDialog;
