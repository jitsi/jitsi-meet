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
const PRIVACY_POLICY_URL = 'https://www.atlassian.com/legal/privacy-policy';

/**
 * The URL at which the terms of service are available to the user.
 */
const TERMS_OF_SERVICE_URL
    = 'https://www.atlassian.com/legal/customer-agreement';

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
                        autoCapitalize = 'none'
                        autoCorrect = { false }
                        autoFocus = { true }
                        onChangeText = { this._onRoomChange }
                        placeholder = 'room name'
                        style = { styles.textInput }
                        value = { this.state.room } />
                    <TouchableHighlight
                        disabled = { this._isJoinDisabled() }
                        onPress = { this._onJoinClick }
                        style = { styles.button }
                        underlayColor = { ColorPalette.white }>
                        <Text style = { styles.buttonText }>JOIN</Text>
                    </TouchableHighlight>
                </View>
                <View style = { styles.legaleseContainer }>
                    <Link
                        style = { styles.legaleseItem }
                        url = { PRIVACY_POLICY_URL }>
                        Privacy Policy
                    </Link>
                    <Link
                        style = { styles.legaleseItem }
                        url = { TERMS_OF_SERVICE_URL }>
                        Terms of Service
                    </Link>
                </View>
            </View>
        );
    }
}

export default connect(mapStateToProps)(WelcomePage);
