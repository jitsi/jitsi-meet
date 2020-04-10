// @flow

import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { CHAT_ENABLED, getFeatureFlag } from '../../../base/flags';
import { Container } from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { ChatButton } from '../../../chat';
import { InviteButton } from '../../../invite';

import { isToolboxVisible } from '../../functions';

import AudioMuteButton from '../AudioMuteButton';
import HangupButton from '../HangupButton';

import OverflowMenuButton from './OverflowMenuButton';
import styles from './styles';
import VideoMuteButton from '../VideoMuteButton';

/**
 * The type of {@link Toolbox}'s React {@code Component} props.
 */
type Props = {

    /**
     * Whether the chat feature has been enabled. The meeting info button will be displayed in its place when disabled.
     */
    _chatEnabled: boolean,

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
        return (
            <Container
                style = { styles.toolbox }
                visible = { this.props._visible }>
                { this._renderToolbar() }
            </Container>
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

    /**
     * Renders the toolbar. In order to avoid a weird visual effect in which the
     * toolbar is (visually) rendered and then visibly changes its size, it is
     * rendered only after we've figured out the width available to the toolbar.
     *
     * @returns {React$Node}
     */
    _renderToolbar() {
        const { _chatEnabled, _styles } = this.props;
        const { buttonStyles, buttonStylesBorderless, hangupButtonStyles, toggledButtonStyles } = _styles;

        return (
            <View
                accessibilityRole = 'toolbar'
                pointerEvents = 'box-none'
                style = { styles.toolbar }>
                {
                    _chatEnabled
                        && <ChatButton
                            styles = { buttonStylesBorderless }
                            toggledStyles = {
                                this._getChatButtonToggledStyle(toggledButtonStyles)
                            } />
                }
                {
                    !_chatEnabled
                        && <InviteButton
                            styles = { buttonStyles }
                            toggledStyles = { toggledButtonStyles } />
                }
                <AudioMuteButton
                    styles = { buttonStyles }
                    toggledStyles = { toggledButtonStyles } />
                <HangupButton
                    styles = { hangupButtonStyles } />
                <VideoMuteButton
                    styles = { buttonStyles }
                    toggledStyles = { toggledButtonStyles } />
                <OverflowMenuButton
                    styles = { buttonStylesBorderless }
                    toggledStyles = { toggledButtonStyles } />
            </View>
        );
    }
}

/**
 * Maps parts of the redux state to {@link Toolbox} (React {@code Component})
 * props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code Toolbox} props.
 * @private
 * @returns {{
 *     _chatEnabled: boolean,
 *     _styles: StyleType,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state: Object): Object {
    return {
        _chatEnabled: getFeatureFlag(state, CHAT_ENABLED, true),
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(Toolbox);
