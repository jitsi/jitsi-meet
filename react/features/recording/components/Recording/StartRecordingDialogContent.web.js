// @flow

import Spinner from '@atlaskit/spinner';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../base/i18n';
import { authorizeDropbox, updateDropboxToken } from '../../../base/oauth';

type Props = {

    /**
     * The redux dispatch function.
     */
    dispatch: Function,

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
     * The translate function.
     */
    t: Function,

    /**
     * The display name of the user's Dropbox account.
     */
    userName: ?string,
};

/**
 * React Component for getting confirmation to start a file recording session.
 *
 * @extends Component
 */
class StartRecordingDialogContent extends Component<Props> {
    /**
     * Initializes a new {@code StartRecordingDialogContent} instance.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSignInClick = this._onSignInClick.bind(this);
        this._onSignOutClick = this._onSignOutClick.bind(this);
    }

    /**
     * Renders the platform specific dialog content.
     *
     * @protected
     * @returns {React$Component}
     */
    render() {
        const { isTokenValid, isValidating, t } = this.props;

        let content = null;

        if (isValidating) {
            content = this._renderSpinner();
        } else if (isTokenValid) {
            content = this._renderSignOut();
        } else {
            content = this._renderSignIn();
        }

        return (
            <div className = 'recording-dialog'>
                <div className = 'authorization-panel'>
                    { content }
                </div>
                <div>{ t('recording.startRecordingBody') }</div>
            </div>
        );
    }

    /**
     * Renders a spinner component.
     *
     * @returns {React$Component}
     */
    _renderSpinner() {
        return (
            <Spinner
                isCompleting = { false }
                size = 'medium' />
        );
    }

    /**
     * Renders the sign in screen.
     *
     * @returns {React$Component}
     */
    _renderSignIn() {
        return (
            <div>
                <div>{ this.props.t('recording.authDropboxText') }</div>
                <div
                    className = 'dropbox-sign-in'
                    onClick = { this._onSignInClick }>
                    <img
                        className = 'dropbox-logo'
                        src = 'images/dropboxLogo.svg' />
                </div>
            </div>);
    }

    /**
     * Renders the screen with the account information of a logged in user.
     *
     * @returns {React$Component}
     */
    _renderSignOut() {
        const { spaceLeft, t, userName } = this.props;

        return (
            <div>
                <div>{ t('recording.authDropboxCompletedText') }</div>
                <div className = 'logged-in-pannel'>
                    <div>
                        { t('recording.loggedIn', { userName }) }&nbsp;(&nbsp;
                        <a onClick = { this._onSignOutClick }>
                            { t('recording.signOut') }
                        </a>
                        &nbsp;)
                    </div>
                    <div>
                        {
                            t('recording.availableSpace', {
                                spaceLeft,

                                // assuming 1min -> 10MB recording:
                                duration: Math.floor((spaceLeft || 0) / 10)
                            })
                        }
                    </div>
                </div>
            </div>);
    }

    _onSignInClick: () => {};

    /**
     * Handles click events for the dropbox sign in button.
     *
     * @returns {void}
     */
    _onSignInClick() {
        this.props.dispatch(authorizeDropbox());
    }

    _onSignOutClick: () => {};

    /**
     * Sings out an user from dropbox.
     *
     * @returns {void}
     */
    _onSignOutClick() {
        this.props.dispatch(updateDropboxToken());
    }
}

export default translate(connect()(StartRecordingDialogContent));
