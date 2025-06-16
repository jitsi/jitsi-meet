import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import Dialog from '../../../../base/ui/components/web/Dialog';
import Spinner from '../../../../base/ui/components/web/Spinner';
import {
    loadGoogleAPI,
    requestAvailableYouTubeBroadcasts,
    requestLiveStreamsForYouTubeBroadcast,
    showAccountSelection,
    signIn,
    updateProfile
} from '../../../../google-api/actions';
import GoogleSignInButton from '../../../../google-api/components/GoogleSignInButton.web';
import { GOOGLE_API_STATES } from '../../../../google-api/constants';
import AbstractStartLiveStreamDialog, {
    IProps as AbstractProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractStartLiveStreamDialog';

import StreamKeyForm from './StreamKeyForm';
import StreamKeyPicker from './StreamKeyPicker';

interface IProps extends AbstractProps {

    /**
     * The ID for the Google client application used for making stream key
     * related requests.
     */
    _googleApiApplicationClientID?: string;
}

/**
 * A React Component for requesting a YouTube stream key to use for live
 * streaming of the current conference.
 *
 * @augments Component
 */
class StartLiveStreamDialog
    extends AbstractStartLiveStreamDialog<IProps> {

    /**
     * Initializes a new {@code StartLiveStreamDialog} instance.
     *
     * @param {IProps} props - The React {@code Component} props to initialize
     * the new {@code StartLiveStreamDialog} instance with.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onGetYouTubeBroadcasts = this._onGetYouTubeBroadcasts.bind(this);
        this._onInitializeGoogleApi = this._onInitializeGoogleApi.bind(this);
        this._onGoogleSignIn = this._onGoogleSignIn.bind(this);
        this._onRequestGoogleSignIn = this._onRequestGoogleSignIn.bind(this);
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
        super.componentDidMount();

        if (this.props._googleApiApplicationClientID) {
            this._onInitializeGoogleApi();
        }
    }

    /**
     * Implements {@code Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { _googleApiApplicationClientID } = this.props;

        return (
            <Dialog
                ok = {{ translationKey: 'dialog.startLiveStreaming' }}
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                titleKey = 'liveStreaming.start'>
                <div className = 'live-stream-dialog'>
                    { _googleApiApplicationClientID
                        ? this._renderYouTubePanel() : null }
                    <StreamKeyForm
                        onChange = { this._onStreamKeyChange }
                        value = {
                            this.state.streamKey || this.props._streamKey || ''
                        } />
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
     * @returns {void}
     */
    _onInitializeGoogleApi() {
        this.props.dispatch(loadGoogleAPI())
        .catch((response: any) => this._parseErrorFromResponse(response));
    }

    /**
     * Automatically selects the input field's value after starting to edit the
     * display name.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(previousProps: IProps) {
        if (previousProps._googleAPIState === GOOGLE_API_STATES.LOADED
            && this.props._googleAPIState === GOOGLE_API_STATES.SIGNED_IN) {
            this._onGetYouTubeBroadcasts();
        }
    }

    /**
     * Asks the user to sign in, if not already signed in, and then requests a
     * list of the user's YouTube broadcasts.
     *
     * @private
     * @returns {void}
     */
    _onGetYouTubeBroadcasts() {
        this.props.dispatch(updateProfile())
            .catch((response: any) => this._parseErrorFromResponse(response));

        this.props.dispatch(requestAvailableYouTubeBroadcasts())
            .then((broadcasts: { boundStreamID: string; }[]) => {
                this._setStateIfMounted({
                    broadcasts
                });

                if (broadcasts.length === 1) {
                    const broadcast = broadcasts[0];

                    this._onYouTubeBroadcastIDSelected(broadcast.boundStreamID);
                }
            })
            .catch((response: any) => this._parseErrorFromResponse(response));
    }

    /**
     * Forces the Google web client application to prompt for a sign in, such as
     * when changing account, and will then fetch available YouTube broadcasts.
     *
     * @private
     * @returns {Promise}
     */
    _onGoogleSignIn() {
        this.props.dispatch(signIn())
            .catch((response: any) => this._parseErrorFromResponse(response));
    }

    /**
     * Forces the Google web client application to prompt for a sign in, such as
     * when changing account, and will then fetch available YouTube broadcasts.
     *
     * @private
     * @returns {Promise}
     */
    _onRequestGoogleSignIn() {
        // when there is an error we show the google sign-in button.
        // once we click it we want to clear the error from the state
        this.props.dispatch(showAccountSelection())
            .then(() =>
                this._setStateIfMounted({
                    broadcasts: undefined,
                    errorType: undefined
                }))
            .then(() => this._onGetYouTubeBroadcasts());
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
    _onYouTubeBroadcastIDSelected(boundStreamID: string) {
        this.props.dispatch(
            requestLiveStreamsForYouTubeBroadcast(boundStreamID))
            .then(({ streamKey, selectedBoundStreamID }: { selectedBoundStreamID: string; streamKey: string; }) =>
                this._setStateIfMounted({
                    streamKey,
                    selectedBoundStreamID
                }));

    }

    /**
     * Only show an error if an external request was made with the Google api.
     * Do not error if the login in canceled.
     * And searches in a Google API error response for the error type.
     *
     * @param {Object} response - The Google API response that may contain an
     * error.
     * @private
     * @returns {string|null}
     */
    _parseErrorFromResponse(response: any) {

        if (!response?.result) {
            return;
        }

        const result = response.result;
        const error = result.error;
        const errors = error?.errors;
        const firstError = errors?.[0];

        this._setStateIfMounted({
            errorType: firstError?.reason || null
        });
    }

    /**
     * Renders a React Element for authenticating with the Google web client.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderYouTubePanel() {
        const {
            t,
            _googleProfileEmail
        } = this.props;
        const {
            broadcasts,
            selectedBoundStreamID
        } = this.state;

        let googleContent, helpText;

        switch (this.props._googleAPIState) {
        case GOOGLE_API_STATES.LOADED:
            googleContent
                = <GoogleSignInButton onClick = { this._onGoogleSignIn } />;
            helpText = t('liveStreaming.signInCTA');

            break;

        case GOOGLE_API_STATES.SIGNED_IN:
            if (broadcasts) {
                googleContent = (
                    <StreamKeyPicker
                        broadcasts = { broadcasts }
                        onBroadcastSelected
                            = { this._onYouTubeBroadcastIDSelected }
                        selectedBoundStreamID = { selectedBoundStreamID } />
                );
            } else {
                googleContent
                    = <Spinner />
                ;
            }

            /**
             * FIXME: Ideally this help text would be one translation string
             * that also accepts the anchor. This can be done using the Trans
             * component of react-i18next but I couldn't get it working...
             */
            helpText = (
                <div>
                    { `${t('liveStreaming.chooseCTA',
                        { email: _googleProfileEmail })} ` }
                    <a onClick = { this._onRequestGoogleSignIn }>
                        { t('liveStreaming.changeSignIn') }
                    </a>
                </div>
            );

            break;

        case GOOGLE_API_STATES.NEEDS_LOADING:
        default:
            googleContent
                = <Spinner />
            ;

            break;
        }

        if (this.state.errorType !== undefined) {
            googleContent = (
                <GoogleSignInButton
                    onClick = { this._onRequestGoogleSignIn } />
            );
            helpText = this._getGoogleErrorMessageToDisplay();
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
        let text;

        switch (this.state.errorType) {
        case 'liveStreamingNotEnabled':
            text = this.props.t(
                'liveStreaming.errorLiveStreamNotEnabled',
                { email: this.props._googleProfileEmail });
            break;
        default:
            text = this.props.t('liveStreaming.errorAPI');
            break;
        }

        return <div className = 'google-error'>{ text }</div>;
    }
}

/**
 * Maps part of the Redux state to the component's props.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _googleApiApplicationClientID: string
 * }}
*/
function _mapStateToProps(state: IReduxState) {
    return {
        ..._abstractMapStateToProps(state),
        _googleApiApplicationClientID:
        state['features/base/config'].googleApiApplicationClientID
    };
}

export default translate(connect(_mapStateToProps)(StartLiveStreamDialog));
