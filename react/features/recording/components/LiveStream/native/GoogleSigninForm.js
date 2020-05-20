// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { _abstractMapStateToProps } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { StyleType } from '../../../../base/styles';
import {
    GOOGLE_API_STATES,
    GOOGLE_SCOPE_YOUTUBE,
    googleApi,
    GoogleSignInButton,
    setGoogleAPIState
} from '../../../../google-api';
import logger from '../../../logger';

import styles from './styles';

/**
 * Prop type of the component {@code GoogleSigninForm}.
 */
type Props = {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: StyleType,

    /**
     * The Redux dispatch Function.
     */
    dispatch: Function,

    /**
     * The current state of the Google api as defined in {@code constants.js}.
     */
    googleAPIState: number,

    /**
     * The recently received Google response.
     */
    googleResponse: Object,

    /**
     * A callback to be invoked when an authenticated user changes, so
     * then we can get (or clear) the YouTube stream key.
     */
    onUserChanged: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Class to render a google sign in form, or a google stream picker dialog.
 *
 * @extends Component
 */
class GoogleSigninForm extends Component<Props> {
    /**
     * Instantiates a new {@code GoogleSigninForm} component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._logGoogleError = this._logGoogleError.bind(this);
        this._onGoogleButtonPress = this._onGoogleButtonPress.bind(this);
    }

    /**
     * Implements React's Component.componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        googleApi.hasPlayServices()
            .then(() => {
                googleApi.configure({
                    offlineAccess: false,
                    scopes: [ GOOGLE_SCOPE_YOUTUBE ]
                });

                googleApi.signInSilently().then(response => {
                    this._setApiState(response
                        ? GOOGLE_API_STATES.SIGNED_IN
                        : GOOGLE_API_STATES.LOADED,
                        response);
                }, () => {
                    this._setApiState(GOOGLE_API_STATES.LOADED);
                });
            })
            .catch(error => {
                this._logGoogleError(error);
                this._setApiState(GOOGLE_API_STATES.NOT_AVAILABLE);
            });
    }

    /**
     * Renders the component.
     *
     * @inheritdoc
     */
    render() {
        const { _dialogStyles, t } = this.props;
        const { googleAPIState, googleResponse } = this.props;
        const signedInUser = googleResponse
            && googleResponse.user
            && googleResponse.user.email;

        if (googleAPIState === GOOGLE_API_STATES.NOT_AVAILABLE
                || googleAPIState === GOOGLE_API_STATES.NEEDS_LOADING
                || typeof googleAPIState === 'undefined') {
            return null;
        }

        const userInfo = signedInUser
            ? `${t('liveStreaming.signedInAs')} ${signedInUser}`
            : t('liveStreaming.signInCTA');

        return (
            <View style = { styles.formWrapper }>
                <View style = { styles.helpText }>
                    <Text
                        style = { [
                            _dialogStyles.text,
                            styles.text
                        ] }>
                        { userInfo }
                    </Text>
                </View>
                <GoogleSignInButton
                    onClick = { this._onGoogleButtonPress }
                    signedIn = {
                        googleAPIState === GOOGLE_API_STATES.SIGNED_IN } />
            </View>
        );
    }

    _logGoogleError: Object => void

    /**
     * A helper function to log developer related errors.
     *
     * @private
     * @param {Object} error - The error to be logged.
     * @returns {void}
     */
    _logGoogleError(error) {
        // NOTE: This is a developer error message, not intended for the
        // user to see.
        logger.error('Google API error. Possible cause: bad config.', error);
    }

    _onGoogleButtonPress: () => void

    /**
     * Callback to be invoked when the user presses the Google button,
     * regardless of being logged in or out.
     *
     * @private
     * @returns {void}
     */
    _onGoogleButtonPress() {
        const { googleResponse } = this.props;

        if (googleResponse && googleResponse.user) {
            // the user is signed in
            this._onSignOut();
        } else {
            this._onSignIn();
        }
    }

    _onSignIn: () => void

    /**
     * Initiates a sign in if the user is not signed in yet.
     *
     * @private
     * @returns {void}
     */
    _onSignIn() {
        googleApi.signIn().then(response => {
            this._setApiState(GOOGLE_API_STATES.SIGNED_IN, response);
        }, this._logGoogleError);
    }

    _onSignOut: () => void

    /**
     * Initiates a sign out if the user is signed in.
     *
     * @private
     * @returns {void}
     */
    _onSignOut() {
        googleApi.signOut().then(response => {
            this._setApiState(GOOGLE_API_STATES.LOADED, response);
        }, this._logGoogleError);
    }

    /**
     * Updates the API (Google Auth) state.
     *
     * @private
     * @param {number} apiState - The state of the API.
     * @param {?Object} googleResponse - The response from the API.
     * @returns {void}
     */
    _setApiState(apiState, googleResponse) {
        this.props.onUserChanged(googleResponse);
        this.props.dispatch(setGoogleAPIState(apiState, googleResponse));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code GoogleSigninForm} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     googleAPIState: number,
  *    googleResponse: Object
 * }}
 */
function _mapStateToProps(state: Object) {
    const { googleAPIState, googleResponse } = state['features/google-api'];

    return {
        ..._abstractMapStateToProps(state),
        googleAPIState,
        googleResponse
    };
}

export default translate(connect(_mapStateToProps)(GoogleSigninForm));
