import React from 'react';
import { Text, TextInput, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';

import { Link } from '../../base/react';
import { ColorPalette } from '../../base/styles';

import { AbstractWelcomePage, mapStateToProps } from './AbstractWelcomePage';
import { styles } from './styles';

/**
 * The URL at which the privacy policy is available to the user.
 */
const PRIVACY_URL = 'https://jitsi.org/meet/privacy';

/**
 * The URL at which the user may send feedback.
 */
const SEND_FEEDBACK_URL = 'mailto:support@jitsi.org';

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
const TERMS_URL = 'https://jitsi.org/meet/terms';

/**
 * The native container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
    /**
     * WelcomePage component's property types.
     *
     * @static
     */
    static propTypes = AbstractWelcomePage.propTypes

    /**
     * Renders a prompt for entering a room name.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <View style = { styles.container }>
                {
                    this._renderLocalVideo()
                }
                {
                    this._renderLocalVideoOverlay()
                }
            </View>
        );
    }

    /**
     * Renders legal-related content such as Terms of service/use, Privacy
     * policy, etc.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLegalese() {
        return (
            <View style = { styles.legaleseContainer }>
                <Link
                    style = { styles.legaleseItem }
                    url = { TERMS_URL }>
                    Terms
                </Link>
                <Link
                    style = { styles.legaleseItem }
                    url = { PRIVACY_URL }>
                    Privacy
                </Link>
                <Link
                    style = { styles.legaleseItem }
                    url = { SEND_FEEDBACK_URL }>
                    Send feedback
                </Link>
            </View>
        );
    }

    /**
     * Renders a View over the local video. The latter is thought of as the
     * background (content) of this WelcomePage. The former is thought of as the
     * foreground (content) of this WelcomePage such as the room name input, the
     * button to initiate joining the specified room, etc.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderLocalVideoOverlay() {
        return (
            <View style = { styles.localVideoOverlay }>
                <View style = { styles.roomContainer }>
                    <Text style = { styles.title }>Enter room name</Text>
                    <TextInput
                        accessibilityLabel = { 'Input room name.' }
                        autoCapitalize = 'none'
                        autoComplete = { false }
                        autoCorrect = { false }
                        autoFocus = { false }
                        onChangeText = { this._onRoomChange }
                        placeholder = 'room name'
                        style = { styles.textInput }
                        underlineColorAndroid = 'transparent'
                        value = { this.state.room } />
                    <TouchableHighlight
                        accessibilityLabel = { 'Tap to Join.' }
                        disabled = { this._isJoinDisabled() }
                        onPress = { this._onJoin }
                        style = { styles.button }
                        underlayColor = { ColorPalette.white }>
                        <Text style = { styles.buttonText }>JOIN</Text>
                    </TouchableHighlight>
                </View>
                {
                    this._renderLegalese()
                }
            </View>
        );
    }
}

export default connect(mapStateToProps)(WelcomePage);
