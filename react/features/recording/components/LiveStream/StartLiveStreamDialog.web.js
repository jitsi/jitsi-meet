/* globals APP, interfaceConfig */

import Spinner from '@atlaskit/spinner';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';

import googleApi from '../../googleApi';

import GoogleSignInButton from './GoogleSignInButton';
import StreamKeyForm from './StreamKeyForm';

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 *
 * @extends Component
 */
class StartLiveStreamDialog extends Component {
    /**
     * {@code StartLiveStreamDialog} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The ID for the Google web client application used for making stream
         * key related requests.
         */
        _googleApiApplicationClientID: PropTypes.string,

        /**
         * Callback to invoke when the dialog is dismissed without submitting a
         * stream key.
         */
        onCancel: PropTypes.func,

        /**
         * Callback to invoke when a stream key is submitted for use.
         */
        onSuccess: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * {@code StartLiveStreamDialog} component's local state.
     *
     * @property {Object[]|undefined} broadcasts - Details about the broadcasts
     * available for use for the logged in Google user's YouTube account.
     * @property {boolean} googleApiLoaded - Whether or not the Google
     * javascript client library has been loaded.
     * @property {string} googleProfileName - The name of the user currently
     * logged in to the Google web client application.
     * @property {boolean} showGoogleApiError - Whether or not the fatal error
     * message regarding the Google API should display.
     * @property {string} streamKey - The selected or entered stream key to use
     * for YouTube live streaming.
     */
    state = {
        broadcasts: undefined,
        googleApiLoaded: false,
        googleProfileName: '',
        showGoogleApiError: false,
        streamKey: ''
    }

    /**
     * Initializes a new {@code StartLiveStreamDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StartLiveStreamDialog} instance with.
     */
    constructor(props) {
        super(props);

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
        this._onGoogleSignIn = this._onGoogleSignIn.bind(this);
        this._onInitializeGoogleApi = this._onInitializeGoogleApi.bind(this);
        this._onStreamKeyChange = this._onStreamKeyChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
        this._onYouTubeBroadcastClicked
            = this._onYouTubeBroadcastClicked.bind(this);
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
                        broadcasts = { this.state.broadcasts }
                        helpURL = { interfaceConfig.LIVE_STREAMING_HELP_LINK }
                        onChange = { this._onStreamKeyChange }
                        onStreamSelected = { this._onYouTubeBroadcastClicked }
                        value = { this.state.streamKey } />
                </div>
            </Dialog>
        );
    }

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
            .then(() => googleApi.isSignedIn())
            .then(isSignedIn => {
                if (isSignedIn) {
                    return this._onGetYouTubeBroadcasts();
                }
            })
            .then(() => this._setStateIfMounted({ googleApiLoaded: true }))
            .catch(() => {
                this._setStateIfMounted({
                    showGoogleApiError: true
                });
            });
    }

    /**
     * Invokes the passed in {@link onCancel} callback and closes
     * {@code StartLiveStreamDialog}.
     *
     * @private
     * @returns {boolean} True is returned to close the modal.
     */
    _onCancel() {
        this.props.onCancel(APP.UI.messageHandler.CANCEL);

        return true;
    }

    /**
     * Asks the user to sign in, if not already signed in, and then requests a
     * list of the user's YouTube broadcasts.
     *
     * @private
     * @returns {Promise}
     */
    _onGetYouTubeBroadcasts() {
        return googleApi.get()
            .then(() => googleApi.signIn())
            .then(() => googleApi.getCurrentUserProfile())
            .then(profile => {
                this._setStateIfMounted({
                    googleProfileName: profile.getName()
                });
            })
            .then(() => googleApi.requestAvailableYouTubeBroadcasts())
            .then(response => {
                const broadcasts = response.result.items.map(item => {
                    return {
                        title: item.snippet.title,
                        boundStreamID: item.contentDetails.boundStreamId,
                        status: item.status.lifeCycleStatus
                    };
                });

                this._setStateIfMounted({
                    broadcasts,
                    showGoogleApiError: false
                });
            })
            .catch(response => {
                // Only show an error if an external request was made with the
                // Google api. Do not error if the login in canceled.
                if (response && response.result) {
                    this._setStateIfMounted({
                        showGoogleApiError: true
                    });
                }
            });
    }

    /**
     * Forces the Google web client application to prompt for a sign in, such as
     * when changing account, and will then fetch available YouTube broadcasts.
     *
     * @private
     * @returns {Promise}
     */
    _onGoogleSignIn() {
        return googleApi.forceSignIn()
            .then(() => this._onGetYouTubeBroadcasts());
    }

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
            streamKey: event.target.value
        });
    }

    /**
     * Invokes the passed in {@link onSuccess} callback with the entered stream
     * key, and then closes {@code StartLiveStreamDialog}.
     *
     * @private
     * @returns {boolean} False if no stream key is entered to preventing
     * closing, true to close the modal.
     */
    _onSubmit() {
        if (!this.state.streamKey) {
            return false;
        }

        this.props.onSuccess(this.state.streamKey);

        return true;
    }

    /**
     * Fetches the stream key for a YouTube broadcast and updates the internal
     * state to display the associated stream key as being entered.
     *
     * @param {string} boundStreamID - The bound stream ID associated with the
     * broadcast from which to get the stream key.
     * @private
     * @returns {Promise}
     */
    _onYouTubeBroadcastClicked(boundStreamID) {
        return googleApi.requestLiveStreamsForYouTubeBroadcast(boundStreamID)
            .then(response => {
                const found = response.result.items[0];
                const streamKey = found.cdn.ingestionInfo.streamName;

                this._setStateIfMounted({
                    streamKey
                });
            });
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
            googleApiLoaded,
            googleProfileName,
            showGoogleApiError
        } = this.state;

        let googleContent;

        if (showGoogleApiError) {
            googleContent = ( // eslint-disable-line no-extra-parens
                <div>
                    <div>
                        { t('liveStreaming.error') }
                    </div>
                    <GoogleSignInButton
                        onClick = { this._onGoogleSignIn }
                        text = { t('liveStreaming.changeSignIn') } />
                </div>
            );
        } else if (googleProfileName) {
            googleContent = ( // eslint-disable-line no-extra-parens
                <div>
                    <div>
                        { t('liveStreaming.currentSignIn',
                            { name: googleProfileName }) }
                    </div>
                    <GoogleSignInButton
                        onClick = { this._onGoogleSignIn }
                        text = { t('liveStreaming.changeSignIn') } />
                </div>
            );
        } else if (googleApiLoaded) {
            googleContent = ( // eslint-disable-line no-extra-parens
                <GoogleSignInButton
                    onClick = { this._onGetYouTubeBroadcasts }
                    text = { t('liveStreaming.signIn') } />
            );
        } else {
            googleContent = ( // eslint-disable-line no-extra-parens
                <Spinner
                    isCompleting = { false }
                    size = 'medium' />
            );
        }

        return (
            <div className = 'google-panel'>
                <div>
                    { t('liveStreaming.help') }
                </div>
                <div className = 'google-api'>
                    { googleContent }
                </div>
                <div>
                    { t('liveStreaming.or') }
                </div>
            </div>
        );
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
 * @protected
 * @returns {{
 *     _googleApiApplicationClientID: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _googleApiApplicationClientID:
            state['features/base/config'].googleApiApplicationClientID
    };
}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
