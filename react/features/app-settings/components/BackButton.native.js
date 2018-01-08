// @flow

import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';

import styles from './styles';

import { Icon } from '../../base/font-icons';
import { Platform } from '../../base/react';

/**
* The icon glyph to be used on a specific platform.
*/
const BACK_ICON = Platform.OS === 'android' ? 'arrow_back' : 'navigate_before';

/**
* The type of the React {@code Component} props of {@link BackButton}
*/
type Props = {

    /**
    * The action to be performed when the button is pressed.
    */
    onPress: Function,

    /**
    * An external style object passed to the component.
    */
    style: Object
};

/**
 * A component rendering a back button that looks native on both platforms.
 */
export default class BackButton extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}, renders the button.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <TouchableOpacity
                accessibilityLabel = { 'Back' }
                onPress = { this.props.onPress }>
                <Icon
                    name = { BACK_ICON }
                    style = { [
                        styles.backIcon,
                        this.props.style
                    ] } />
            </TouchableOpacity>
        );
    }
}
