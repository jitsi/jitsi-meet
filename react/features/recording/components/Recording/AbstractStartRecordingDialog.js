// @flow

import { Component } from 'react';

import {
    createRecordingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import {
    getDropboxData,
    isEnabled as isDropboxEnabled
} from '../../../dropbox';

type Props = {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * The app key for the dropbox authentication.
     */
    _appKey: string,

    /**
     * If true the dropbox integration is enabled, otherwise - disabled.
     */
    _isDropboxEnabled: boolean,

    /**
     * The dropbox access token.
     */
    _token: string,

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

type State = {

    /**
     * <tt>true</tt> if we have valid oauth token.
     */
    isTokenValid: boolean,

    /**
     * <tt>true</tt> if we are in process of validating the oauth token.
     */
    isValidating: boolean,

    /**
     * Number of MiB of available space in user's Dropbox account.
     */
    spaceLeft: ?number,

    /**
     * The display name of the user's Dropbox account.
     */
    userName: ?string
};

/**
 * Component for the recording start dialog.
 */
class AbstractStartRecordingDialog extends Component<Props, State> {
    /**
     * Initializes a new {@code StartRecordingDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);

        this.state = {
            isTokenValid: false,
            isValidating: false,
            userName: undefined,
            spaceLeft: undefined
        };

        this._onSubmit = this._onSubmit.bind(this);
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
    componentDidUpdate(prevProps: Props) {
        if (this.props._token !== prevProps._token) {
            this._onTokenUpdated();
        }
    }

    /**
     * Validates the dropbox access token and fetches account information.
     *
     * @returns {void}
     */
    _onTokenUpdated() {
        const { _appKey, _isDropboxEnabled, _token } = this.props;

        if (!_isDropboxEnabled) {
            return;
        }

        if (typeof _token === 'undefined') {
            this.setState({
                isTokenValid: false,
                isValidating: false
            });
        } else {
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

    _onSubmit: () => boolean;

    /**
     * Starts a file recording session.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        sendAnalytics(
            createRecordingDialogEvent('start', 'confirm.button')
        );
        const { _conference, _isDropboxEnabled, _token } = this.props;
        let appData;

        if (_isDropboxEnabled) {
            appData = JSON.stringify({
                'file_recording_metadata': {
                    'upload_credentials': {
                        'service_name': 'dropbox',
                        'token': _token
                    }
                }
            });
        }

        _conference.startRecording({
            mode: JitsiRecordingConstants.mode.FILE,
            appData
        });

        return true;
    }

    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    _renderDialogContent: () => React$Component<*>
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StartRecordingDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _appKey: string,
 *     _conference: JitsiConference,
 *     _token: string
 * }}
 */
export function mapStateToProps(state: Object) {
    const { dropbox = {} } = state['features/base/config'];

    return {
        _appKey: dropbox.appKey,
        _conference: state['features/base/conference'].conference,
        _isDropboxEnabled: isDropboxEnabled(state),
        _token: state['features/dropbox'].token
    };
}

export default AbstractStartRecordingDialog;
