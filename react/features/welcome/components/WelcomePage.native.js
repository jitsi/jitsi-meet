import React from 'react';
import { Text, TextInput, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';

import {
    AbstractWelcomePage,
    mapStateToProps
} from './AbstractWelcomePage';
import { styles } from './styles';

/**
 * The native container rendering the welcome page.
 *
 * @extends AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage {
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
                        underlayColor = 'white'>
                        <Text style = { styles.buttonText }>JOIN</Text>
                    </TouchableHighlight>
                </View>
            </View>
        );
    }
}

/**
 * WelcomePage component's property types.
 *
 * @static
 */
WelcomePage.propTypes = AbstractWelcomePage.propTypes;

export default connect(mapStateToProps)(WelcomePage);
