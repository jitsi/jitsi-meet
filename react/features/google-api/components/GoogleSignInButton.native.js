// @flow

import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';

import { translate } from '../../base/i18n';

import AbstractGoogleSignInButton from './AbstractGoogleSignInButton';
import styles from './styles';

/**
 * The Google Brand image for Sign In.
 *
 * NOTE: iOS doesn't handle the react-native-google-signin button component
 * well due to our CocoaPods build process (the lib is not intended to be used
 * this way), hence the custom button implementation.
 */
const GOOGLE_BRAND_IMAGE
    = require('../../../../images/btn_google_signin_dark_normal.png');

/**
 * A React Component showing a button to sign in with Google.
 *
 * @extends Component
 */
class GoogleSignInButton extends AbstractGoogleSignInButton {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { onClick, signedIn, t } = this.props;

        if (signedIn) {
            return (
                <TouchableOpacity
                    onPress = { onClick }
                    style = { styles.signOutButton } >
                    <Text style = { styles.signOutButtonText }>
                        { t('liveStreaming.signOut') }
                    </Text>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                onPress = { onClick }
                style = { styles.signInButton } >
                <Image
                    resizeMode = { 'contain' }
                    source = { GOOGLE_BRAND_IMAGE }
                    style = { styles.signInImage } />
            </TouchableOpacity>
        );
    }
}

export default translate(GoogleSignInButton);
