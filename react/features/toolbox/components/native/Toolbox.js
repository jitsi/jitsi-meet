// @flow

import React, { PureComponent } from 'react';
import { SafeAreaView, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { ChatButton } from '../../../chat';
import { isToolboxVisible } from '../../functions';
import AudioMuteButton from '../AudioMuteButton';
import HangupButton from '../HangupButton';
import VideoMuteButton from '../VideoMuteButton';

import OverflowMenuButton from './OverflowMenuButton';
import styles from './styles';

/**
 * The type of {@link Toolbox}'s React {@code Component} props.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * The indicator which determines whether the toolbox is visible.
     */
    _visible: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implements the conference toolbox on React Native.
 */
class Toolbox extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._visible) {
            return null;
        }

        const { _styles } = this.props;
        const { buttonStylesBorderless, hangupButtonStyles, toggledButtonStyles } = _styles;

        return (
            <View
                pointerEvents = 'box-none'
                style = { styles.toolboxContainer }>
                <SafeAreaView
                    accessibilityRole = 'toolbar'
                    pointerEvents = 'box-none'
                    style = { styles.toolbox }>
                    <AudioMuteButton
                        styles = { buttonStylesBorderless }
                        toggledStyles = { toggledButtonStyles } />
                    <VideoMuteButton
                        styles = { buttonStylesBorderless }
                        toggledStyles = { toggledButtonStyles } />
                    <ChatButton
                        styles = { buttonStylesBorderless }
                        toggledStyles = { this._getChatButtonToggledStyle(toggledButtonStyles) } />
                    <OverflowMenuButton
                        styles = { buttonStylesBorderless }
                        toggledStyles = { toggledButtonStyles } />
                    <HangupButton
                        styles = { hangupButtonStyles } />
                </SafeAreaView>
            </View>
        );
    }

    /**
     * Constructs the toggled style of the chat button. This cannot be done by
     * simple style inheritance due to the size calculation done in this
     * component.
     *
     * @param {Object} baseStyle - The base style that was originally
     * calculated.
     * @returns {Object | Array}
     */
    _getChatButtonToggledStyle(baseStyle) {
        const { _styles } = this.props;

        if (Array.isArray(baseStyle.style)) {
            return {
                ...baseStyle,
                style: [
                    ...baseStyle.style,
                    _styles.chatButtonOverride.toggled
                ]
            };
        }

        return {
            ...baseStyle,
            style: [
                baseStyle.style,
                _styles.chatButtonOverride.toggled
            ]
        };
    }
}

/**
 * Maps parts of the redux state to {@link Toolbox} (React {@code Component})
 * props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code Toolbox} props.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: Object): Object {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(Toolbox);
