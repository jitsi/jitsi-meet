// @flow

import Spinner from '@atlaskit/spinner';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    createRecordingDialogEvent,
    sendAnalytics
} from '../../../analytics';
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';

import googleApi from '../../googleApi';

import BroadcastsDropdown from './BroadcastsDropdown';
import GoogleSignInButton from './GoogleSignInButton';
import StreamKeyForm from './StreamKeyForm';

declare var interfaceConfig: Object;

/**
 * An enumeration of the different states the Google API can be in while
 * interacting with {@code StartLiveStreamDialog}.
  *
 * @private
 * @type {Object}
 */
const GOOGLE_API_STATES = {
    /**
     * The state in which the Google API still needs to be loaded.
     */
    NEEDS_LOADING: 0,

    /**
     * The state in which the Google API is loaded and ready for use.
     */
    LOADED: 1,

    /**
     * The state in which a user has been logged in through the Google API.
     */
    SIGNED_IN: 2,

    /**
     * The state in which the Google API encountered an error either loading
     * or with an API request.
     */
    ERROR: 3
};

/**
 * The type of the React {@code Component} props of
 * {@link StartLiveStreamDialog}.
 */
type Props = {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference: Object,

    /**
     * The ID for the Google web client application used for making stream key
     * related requests.
     */
    _googleApiApplicationClientID: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of
 * {@link StartLiveStreamDialog}.
 */
type State = {

    /**
     * Details about the broadcasts available for use for the logged in Google
     * user's YouTube account.
     */
    broadcasts: ?Array<Object>,

    /**
     * The error type, as provided by Google, for the most recent error
     * encountered by the Google API.
     */
    errorType: ?string,

    /**
     * The current state of interactions with the Google API. Determines what
     * Google related UI should display.
     */
    googleAPIState: number,

    /**
     * The email of the user currently logged in to the Google web client
     * application.
     */
    googleProfileEmail: string,

    /**
     * The boundStreamID of the broadcast currently selected in the broadcast
     * dropdown.
     */
    selectedBoundStreamID: ?string,

    /**
     * The selected or entered stream key to use for YouTube live streaming.
     */
    streamKey: string
};

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 *
 * @extends Component
 */
class StartLiveStreamDialog extends Component<Props, State> {
    _isMounted: boolean;

    /**
     * Initializes a new {@code StartLiveStreamDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StartLiveStreamDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            broadcasts: undefined,
            errorType: undefined,
            googleAPIState: GOOGLE_API_STATES.NEEDS_LOADING,
            googleProfileEmail: '',
            selectedBoundStreamID: undefined,
            streamKey: ''
        };

        /**
         * Instance variable used to flag whether the component is or is not
         * mounted. Used as a hack to avoid setting state on an unmounted
         * component.
         *
         * @private
         * @type {boolean}
         */
        this._isMounted = false;

        // Bind event handlers so they are only bound once per instance.
        this._onCancel = this._onCancel.bind(this);
        this._onGetYouTubeBroadcasts = this._onGetYouTubeBroadcasts.bind(this);
        this._onInitializeGoogleApi = this._onInitializeGoogleApi.bind(this);
        this._onRequestGoogleSignIn = this._onRequestGoogleSignIn.bind(this);
        this._onStreamKeyChange = this._onStreamKeyChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onYouTubeBroadcastIDSelected
            = this._onYouTubeBroadcastIDSelected.bind(this);
    }

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._isMounted = true;

        if (this.props._googleApiApplicationClientID) {
            this._onInitializeGoogleApi();
        }
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}. Invoked
     * immediately before this component is unmounted and destroyed.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        this._isMounted = false;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _googleApiApplicationClientID } = this.props;

        return (
            <Dialog
                cancelTitleKey = 'dialog.Cancel'
                okTitleKey = 'dialog.startLiveStreaming'
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'liveStreaming.start'
                width = { 'small' }>
                <div className = 'live-stream-dialog'>
                    { _googleApiApplicationClientID
                        ? this._renderYouTubePanel() : null }
                    <StreamKeyForm
                        helpURL = { interfaceConfig.LIVE_STREAMING_HELP_LINK }
                        onChange = { this._onStreamKeyChange }
                        value = { this.state.streamKey } />
                </div>
            </Dialog>
        );
    }

    _onInitializeGoogleApi: () => Object;

    /**
     * Loads the Google web client application used for fetching stream keys.
     * If the user is already logged in, then a request for available YouTube
     * broadcasts is also made.
     *
     * @private
     * @returns {Promise}
     */
    _onInitializeGoogleApi() {
        return googleApi.get()
            .then(() => googleApi.initializeClient(
                this.props._googleApiApplicationClientID))
            .then(() => this._setStateIfMounted({
                googleAPIState: GOOGLE_API_STATES.LOADED
            }))
            .then(() => googleApi.isSignedIn())
            .then(isSignedIn => {
                if (isSignedIn) {
                    return this._onGetYouTubeBroadcasts();
                }
            })
            .catch(() => {
                this._setStateIfMounted({
                    googleAPIState: GOOGLE_API_STATES.ERROR
                });
            });
    }

    _onCancel: () => boolean;

    /**
     * Invokes the passed in {@link onCancel} callback and closes
     * {@code StartLiveStreamDialog}.
     *
     * @private
     * @returns {boolean} True is returned to close the modal.
     */
    _onCancel() {
        sendAnalytics(createRecordingDialogEvent('start', 'cancel.button'));

        return true;
    }

    _onGetYouTubeBroadcasts: () => Object;

    /**
     * Asks the user to sign in, if not already signed in, and then requests a
     * list of the user's YouTube broadcasts.
     *
     * @private
     * @returns {Promise}
     */
    _onGetYouTubeBroadcasts() {
        return googleApi.get()
            .then(() => googleApi.signInIfNotSignedIn())
            .then(() => googleApi.getCurrentUserProfile())
            .then(profile => {
                this._setStateIfMounted({
                    googleProfileEmail: profile.getEmail(),
                    googleAPIState: GOOGLE_API_STATES.SIGNED_IN
                });
            })
            .then(() => googleApi.requestAvailableYouTubeBroadcasts())
            .then(response => {
                const broadcasts = this._parseBroadcasts(response.result.items);

                this._setStateIfMounted({
                    broadcasts
                });

                if (broadcasts.length === 1 && !this.state.streamKey) {
                    const broadcast = broadcasts[0];

                    this._onYouTubeBroadcastIDSelected(broadcast.boundStreamID);
                }
            })
            .catch(response => {
                // Only show an error if an external request was made with the
                // Google api. Do not error if the login in canceled.
                if (response && response.result) {
                    this._setStateIfMounted({
                        errorType: this._parseErrorFromResponse(response),
                        googleAPIState: GOOGLE_API_STATES.ERROR
                    });
                }
            });
    }

    _onRequestGoogleSignIn: () => Object;

    /**
     * Forces the Google web client application to prompt for a sign in, such as
     * when changing account, and will then fetch available YouTube broadcasts.
     *
     * @private
     * @returns {Promise}
     */
    _onRequestGoogleSignIn() {
        return googleApi.showAccountSelection()
            .then(() => this._setStateIfMounted({ broadcasts: undefined }))
            .then(() => this._onGetYouTubeBroadcasts());
    }

    _onStreamKeyChange: () => void;

    /**
     * Callback invoked to update the {@code StartLiveStreamDialog} component's
     * display of the entered YouTube stream key.
     *
     * @param {Object} event - DOM Event for value change.
     * @private
     * @returns {void}
     */
    _onStreamKeyChange(event) {
        this._setStateIfMounted({
            streamKey: event.target.value,
            selectedBoundStreamID: undefined
        });
    }

    _onSubmit: () => boolean;

    /**
     * Invokes the passed in {@link onSubmit} callback with the entered stream
     * key, and then closes {@code StartLiveStreamDialog}.
     *
     * @private
     * @returns {boolean} False if no stream key is entered to preventing
     * closing, true to close the modal.
     */
    _onSubmit() {
        const { broadcasts, streamKey, selectedBoundStreamID } = this.state;

        if (!streamKey) {
            return false;
        }

        let selectedBroadcastID = null;

        if (selectedBoundStreamID) {
            const selectedBroadcast = broadcasts && broadcasts.find(
                broadcast => broadcast.boundStreamID === selectedBoundStreamID);

            selectedBroadcastID = selectedBroadcast && selectedBroadcast.id;
        }

        sendAnalytics(createRecordingDialogEvent('start', 'confirm.button'));

        this.props._conference.startRecording({
            broadcastId: selectedBroadcastID,
            mode: JitsiRecordingConstants.mode.STREAM,
            streamId: streamKey
        });

        return true;
    }

    _onYouTubeBroadcastIDSelected: (string) => Object;

    /**
     * Fetches the stream key for a YouTube broadcast and updates the internal
     * state to display the associated stream key as being entered.
     *
     * @param {string} boundStreamID - The bound stream ID associated with the
     * broadcast from which to get the stream key.
     * @private
     * @returns {Promise}
     */
    _onYouTubeBroadcastIDSelected(boundStreamID) {
        return googleApi.requestLiveStreamsForYouTubeBroadcast(boundStreamID)
            .then(response => {
                const broadcasts = response.result.items;
                const streamName = broadcasts
                    && broadcasts[0]
                    && broadcasts[0].cdn.ingestionInfo.streamName;
                const streamKey = streamName || '';

                this._setStateIfMounted({
                    streamKey,
                    selectedBoundStreamID: boundStreamID
                });
            });
    }

    _parseBroadcasts: (Array<Object>) => Array<Object>;

    /**
     * Takes in a list of broadcasts from the YouTube API, removes dupes,
     * removes broadcasts that cannot get a stream key, and parses the
     * broadcasts into flat objects.
     *
     * @param {Array} broadcasts - Broadcast descriptions as obtained from
     * calling the YouTube API.
     * @private
     * @returns {Array} An array of objects describing each unique broadcast.
     */
    _parseBroadcasts(broadcasts) {
        const parsedBroadcasts = {};

        for (let i = 0; i < broadcasts.length; i++) {
            const broadcast = broadcasts[i];
            const boundStreamID = broadcast.contentDetails.boundStreamId;

            if (boundStreamID && !parsedBroadcasts[boundStreamID]) {
                parsedBroadcasts[boundStreamID] = {
                    boundStreamID,
                    id: broadcast.id,
                    status: broadcast.status.lifeCycleStatus,
                    title: broadcast.snippet.title
                };
            }
        }

        return Object.values(parsedBroadcasts);
    }

    /**
     * Searches in a Google API error response for the error type.
     *
     * @param {Object} response - The Google API response that may contain an
     * error.
     * @private
     * @returns {string|null}
     */
    _parseErrorFromResponse(response) {
        const result = response.result;
        const error = result.error;
        const errors = error && error.errors;
        const firstError = errors && errors[0];

        return (firstError && firstError.reason) || null;
    }

    /**
     * Renders a React Element for authenticating with the Google web client.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderYouTubePanel() {
        const { t } = this.props;
        const {
            broadcasts,
            googleProfileEmail,
            selectedBoundStreamID
        } = this.state;

        let googleContent, helpText;

        switch (this.state.googleAPIState) {
        case GOOGLE_API_STATES.LOADED:
            googleContent = ( // eslint-disable-line no-extra-parens
                <GoogleSignInButton
                    onClick = { this._onGetYouTubeBroadcasts }
                    text = { t('liveStreaming.signIn') } />
            );
            helpText = t('liveStreaming.signInCTA');

            break;

        case GOOGLE_API_STATES.SIGNED_IN:
            googleContent = ( // eslint-disable-line no-extra-parens
                <BroadcastsDropdown
                    broadcasts = { broadcasts }
                    onBroadcastSelected = { this._onYouTubeBroadcastIDSelected }
                    selectedBoundStreamID = { selectedBoundStreamID } />
            );

            /**
             * FIXME: Ideally this help text would be one translation string
             * that also accepts the anchor. This can be done using the Trans
             * component of react-i18next but I couldn't get it working...
             */
            helpText = ( // eslint-disable-line no-extra-parens
                <div>
                    { `${t('liveStreaming.chooseCTA',
                        { email: googleProfileEmail })} ` }
                    <a onClick = { this._onRequestGoogleSignIn }>
                        { t('liveStreaming.changeSignIn') }
                    </a>
                </div>
            );

            break;

        case GOOGLE_API_STATES.ERROR:
            googleContent = ( // eslint-disable-line no-extra-parens
                <GoogleSignInButton
                    onClick = { this._onRequestGoogleSignIn }
                    text = { t('liveStreaming.signIn') } />
            );
            helpText = this._getGoogleErrorMessageToDisplay();

            break;

        case GOOGLE_API_STATES.NEEDS_LOADING:
        default:
            googleContent = ( // eslint-disable-line no-extra-parens
                <Spinner
                    isCompleting = { false }
                    size = 'medium' />
            );

            break;
        }

        return (
            <div className = 'google-panel'>
                <div className = 'live-stream-cta'>
                    { helpText }
                </div>
                <div className = 'google-api'>
                    { googleContent }
                </div>
            </div>
        );
    }

    /**
     * Returns the error message to display for the current error state.
     *
     * @private
     * @returns {string} The error message to display.
     */
    _getGoogleErrorMessageToDisplay() {
        switch (this.state.errorType) {
        case 'liveStreamingNotEnabled':
            return this.props.t(
                'liveStreaming.errorLiveStreamNotEnabled',
                { email: this.state.googleProfileEmail });
        default:
            return this.props.t('liveStreaming.errorAPI');
        }
    }

    /**
     * Updates the internal state if the component is still mounted. This is a
     * workaround for all the state setting that occurs after ajax.
     *
     * @param {Object} newState - The new state to merge into the existing
     * state.
     * @private
     * @returns {void}
     */
    _setStateIfMounted(newState) {
        if (this._isMounted) {
            this.setState(newState);
        }
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code StartLiveStreamDialog}.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {{
 *     _conference: Object,
 *     _googleApiApplicationClientID: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _conference: state['features/base/conference'].conference,
        _googleApiApplicationClientID:
            state['features/base/config'].googleApiApplicationClientID
    };
}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
