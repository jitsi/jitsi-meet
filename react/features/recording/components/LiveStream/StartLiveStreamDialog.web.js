// @flow

import Spinner from '@atlaskit/spinner';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';

import googleApi from '../../googleApi';

import AbstractStartLiveStreamDialog, {
    _mapStateToProps,
    GOOGLE_API_STATES,
    type Props
} from './AbstractStartLiveStreamDialog';
import BroadcastsDropdown from './BroadcastsDropdown';
import GoogleSignInButton from './GoogleSignInButton';
import StreamKeyForm from './StreamKeyForm';

declare var interfaceConfig: Object;

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 *
 * @extends Component
 */
class StartLiveStreamDialog
    extends AbstractStartLiveStreamDialog {

    /**
     * Initializes a new {@code StartLiveStreamDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StartLiveStreamDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onGetYouTubeBroadcasts = this._onGetYouTubeBroadcasts.bind(this);
        this._onInitializeGoogleApi = this._onInitializeGoogleApi.bind(this);
        this._onRequestGoogleSignIn = this._onRequestGoogleSignIn.bind(this);
        this._onYouTubeBroadcastIDSelected
            = this._onYouTubeBroadcastIDSelected.bind(this);

        this._renderDialogContent = this._renderDialogContent.bind(this);
    }

    _onInitializeGoogleApi: () => Promise<*>;

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

    _onGetYouTubeBroadcasts: () => Promise<*>;

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

    _onStreamKeyChange: string => void;

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

    _renderDialogContent: () => React$Component<*>

    /**
     * Renders the platform specific dialog content.
     *
     * @returns {React$Component}
     */
    _renderDialogContent() {
        const { _googleApiApplicationClientID } = this.props;

        return (
            <div className = 'live-stream-dialog'>
                { _googleApiApplicationClientID
                    ? this._renderYouTubePanel() : null }
                <StreamKeyForm
                    onChange = { this._onStreamKeyChange }
                    value = { this.state.streamKey || this.props._streamKey } />
            </div>
        );
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

    _setStateIfMounted: Object => void

    /**
     * Returns the error message to display for the current error state.
     *
     * @private
     * @returns {string} The error message to display.
     */
    _getGoogleErrorMessageToDisplay() {
        let text;

        switch (this.state.errorType) {
        case 'liveStreamingNotEnabled':
            text = this.props.t(
                'liveStreaming.errorLiveStreamNotEnabled',
                { email: this.state.googleProfileEmail });
            break;
        default:
            text = this.props.t('liveStreaming.errorAPI');
            break;
        }

        return <div className = 'google-error'>{ text }</div>;
    }
}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
