import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { Text, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../../app/types';
import { _abstractMapStateToProps } from '../../../../base/dialog/functions';
import { translate } from '../../../../base/i18n/functions';
import { setGoogleAPIState } from '../../../../google-api/actions';
import GoogleSignInButton from '../../../../google-api/components/GoogleSignInButton.native';
import {
    GOOGLE_API_STATES,
    GOOGLE_SCOPE_YOUTUBE
} from '../../../../google-api/constants';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import googleApi from '../../../../google-api/googleApi.native';
import logger from '../../../logger';

import styles from './styles';

/**
 * Prop type of the component {@code GoogleSigninForm}.
 */
interface IProps extends WithTranslation {

    /**
     * Style of the dialogs feature.
     */
    _dialogStyles: any;

    /**
     * The Redux dispatch Function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The current state of the Google api as defined in {@code constants.js}.
     */
    googleAPIState: number;

    /**
     * The recently received Google response.
     */
    googleResponse: any;

    /**
     * A callback to be invoked when an authenticated user changes, so
     * then we can get (or clear) the YouTube stream key.
     */
    onUserChanged: Function;
}

/**
 * Class to render a google sign in form, or a google stream picker dialog.
 *
 * @augments Component
 */
class GoogleSigninForm extends Component<IProps> {
    /**
     * Instantiates a new {@code GoogleSigninForm} component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._logGoogleError = this._logGoogleError.bind(this);
        this._onGoogleButtonPress = this._onGoogleButtonPress.bind(this);
    }

    /**
     * Implements React's Component.componentDidMount.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        googleApi.hasPlayServices()
            .then(() => {
                googleApi.configure({
                    offlineAccess: false,
                    scopes: [ GOOGLE_SCOPE_YOUTUBE ]
                });

                googleApi.signInSilently().then((response: any) => {
                    this._setApiState(response
                        ? GOOGLE_API_STATES.SIGNED_IN
                        : GOOGLE_API_STATES.LOADED,
                        response);
                }, () => {
                    this._setApiState(GOOGLE_API_STATES.LOADED);
                });
            })
            .catch((error: Error) => {
                this._logGoogleError(error);
                this._setApiState(GOOGLE_API_STATES.NOT_AVAILABLE);
            });
    }

    /**
     * Renders the component.
     *
     * @inheritdoc
     */
    override render() {
        const { _dialogStyles, t } = this.props;
        const { googleAPIState, googleResponse } = this.props;
        const signedInUser = googleResponse?.user?.email;

        if (googleAPIState === GOOGLE_API_STATES.NOT_AVAILABLE
                || googleAPIState === GOOGLE_API_STATES.NEEDS_LOADING
                || typeof googleAPIState === 'undefined') {
            return null;
        }

        const userInfo = signedInUser
            ? `${t('liveStreaming.signedInAs')} ${signedInUser}`
            : t('liveStreaming.signInCTA');

        return (
            <View style = { styles.formWrapper as ViewStyle }>
                <View style = { styles.helpText as ViewStyle }>
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

    /**
     * A helper function to log developer related errors.
     *
     * @private
     * @param {Object} error - The error to be logged.
     * @returns {void}
     */
    _logGoogleError(error: Error) {
        // NOTE: This is a developer error message, not intended for the
        // user to see.
        logger.error('Google API error. Possible cause: bad config.', error);
    }

    /**
     * Callback to be invoked when the user presses the Google button,
     * regardless of being logged in or out.
     *
     * @private
     * @returns {void}
     */
    _onGoogleButtonPress() {
        const { googleResponse } = this.props;

        if (googleResponse?.user) {
            // the user is signed in
            this._onSignOut();
        } else {
            this._onSignIn();
        }
    }

    /**
     * Initiates a sign in if the user is not signed in yet.
     *
     * @private
     * @returns {void}
     */
    _onSignIn() {
        googleApi.signIn().then((response: any) => {
            this._setApiState(GOOGLE_API_STATES.SIGNED_IN, response);
        }, this._logGoogleError);
    }

    /**
     * Initiates a sign out if the user is signed in.
     *
     * @private
     * @returns {void}
     */
    _onSignOut() {
        googleApi.signOut().then((response: any) => {
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
    _setApiState(apiState: number, googleResponse?: Object) {
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
function _mapStateToProps(state: IReduxState) {
    const { googleAPIState, googleResponse } = state['features/google-api'];

    return {
        ..._abstractMapStateToProps(state),
        googleAPIState,
        googleResponse
    };
}

export default translate(connect(_mapStateToProps)(GoogleSigninForm));
