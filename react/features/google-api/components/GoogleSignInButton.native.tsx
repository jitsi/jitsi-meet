import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { GestureResponderEvent, Image, ImageStyle, TouchableOpacity, ViewStyle } from 'react-native';

import { translate } from '../../base/i18n/functions';
import Button from '../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.native';

import styles from './styles';

// eslint-disable-next-line
const GOOGLE_BRAND_IMAGE = require('../../../../images/btn_google_signin_dark_normal.png');

/**
 * The Google Brand image for Sign In.
 *
 * NOTE: iOS doesn't handle the react-native-google-signin button component
 * well due to our CocoaPods build process (the lib is not intended to be used
 * this way), hence the custom button implementation.
 */

interface IProps extends WithTranslation {

    /**
     * The callback to invoke when the button is clicked.
     */
    onClick: (e?: React.MouseEvent<HTMLButtonElement> | GestureResponderEvent) => void;

    /**
     * True if the user is signed in, so it needs to render a different label
     * and maybe different style (for the future).
     */
    signedIn?: boolean;

    /**
     * The text to display within {@code GoogleSignInButton}.
     */
    text?: string;
}

/**
 * A React Component showing a button to sign in with Google.
 *
 * @augments Component
 */
class GoogleSignInButton extends Component<IProps> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { onClick, signedIn } = this.props;

        if (signedIn) {
            return (
                <Button
                    accessibilityLabel = 'liveStreaming.signOut'
                    labelKey = 'liveStreaming.signOut'
                    onClick = { onClick }
                    style = { styles.signOutButton }
                    type = { BUTTON_TYPES.SECONDARY } />
            );
        }

        return (
            <TouchableOpacity
                onPress = { onClick }
                style = { styles.signInButton as ViewStyle } >
                <Image
                    resizeMode = { 'contain' }
                    source = { GOOGLE_BRAND_IMAGE }
                    style = { styles.signInImage as ImageStyle } />
            </TouchableOpacity>
        );
    }
}

export default translate(GoogleSignInButton);
