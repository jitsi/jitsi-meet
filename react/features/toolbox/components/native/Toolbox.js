// @flow

import React, { Component } from 'react';
import { View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { CHAT_ENABLED, DEFAULT_TOOLBAR_BUTTONS, TOOLBAR_BUTTONS, getFeatureFlag } from '../../../base/flags';
import { Container } from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { ChatButton } from '../../../chat';
import { InfoDialogButton } from '../../../invite';

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
     * Whether the audio mute feature has been enabled.
     */
    _audioMuteEnabled: boolean,

    /**
     * Whether the chat feature has been enabled. The meeting info button will be displayed in its place when disabled.
     */
    _chatEnabled: boolean,

    /**
     * Whether the hangup feature has been enabled.
     */
    _hangupEnabled: boolean,

    /**
     * Whether the info dialog feature has been enabled.
     */
    _infoDialogEnabled: boolean,

    /**
     * Whether the overflow menu feature has been enabled.
     */
    _overflowMenuEnabled: boolean,

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * Whether the video mute feature has been enabled.
     */
    _videoMuteEnabled: boolean,

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
 * The type of {@link Toolbox}'s React {@code Component} state.
 */
type State = {

    /**
     * The detected width for this component.
     */
    width: number
};

/**
 * Implements the conference toolbox on React Native.
 */
class Toolbox extends Component<Props, State> {
    state = {
        width: 0
    };

    /**
     *  Initializes a new {@code Toolbox} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onLayout = this._onLayout.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Container
                onLayout = { this._onLayout }
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

    _onLayout: (Object) => void;

    /**
     * Handles the "on layout" View's event and stores the width as state.
     *
     * @param {Object} event - The "on layout" event object/structure passed
     * by react-native.
     * @private
     * @returns {void}
     */
    _onLayout({ nativeEvent: { layout: { width } } }) {
        this.setState({ width });
    }

    /**
     * Renders the toolbar. In order to avoid a weird visual effect in which the
     * toolbar is (visually) rendered and then visibly changes its size, it is
     * rendered only after we've figured out the width available to the toolbar.
     *
     * @returns {React$Node}
     */
    _renderToolbar() {
        const { _audioMuteEnabled, _chatEnabled, _hangupEnabled, _infoDialogEnabled, _overflowMenuEnabled, _styles,
            _videoMuteEnabled } = this.props;
        const { buttonStyles, buttonStylesBorderless, hangupButtonStyles, toggledButtonStyles } = _styles;

        return (
            <View
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
                    !_chatEnabled && _infoDialogEnabled
                        && <InfoDialogButton
                            styles = { buttonStyles }
                            toggledStyles = { toggledButtonStyles } />
                }
                {
                    _audioMuteEnabled
                        && <AudioMuteButton
                            styles = { buttonStyles }
                            toggledStyles = { toggledButtonStyles } />
                }
                {
                    _hangupEnabled
                        && <HangupButton
                            styles = { hangupButtonStyles } />
                }
                {
                    _videoMuteEnabled
                        && <VideoMuteButton
                            styles = { buttonStyles }
                            toggledStyles = { toggledButtonStyles } />
                }
                {
                    _overflowMenuEnabled
                        && <OverflowMenuButton
                            styles = { buttonStylesBorderless }
                            toggledStyles = { toggledButtonStyles } />
                }
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
 *     _audioMuteEnabled: boolean,
 *     _chatEnabled: boolean,
 *     _hangupEnabled: boolean,
 *     _infoDialogEnabled: boolean,
 *     _overflowMenuEnabled: boolean,
 *     _styles: StyleType,
 *     _videoMuteEnabled: boolean,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state: Object): Object {
    const toolbarButtons = getFeatureFlag(state, TOOLBAR_BUTTONS, DEFAULT_TOOLBAR_BUTTONS);

    return {
        _audioMuteEnabled: toolbarButtons.includes('audiomute'),
        _chatEnabled: getFeatureFlag(state, CHAT_ENABLED, true),
        _hangupEnabled: toolbarButtons.includes('hangup'),
        _infoDialogEnabled: toolbarButtons.includes('infodialog'),
        _overflowMenuEnabled: toolbarButtons.includes('overflowmenu'),
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _videoMuteEnabled: toolbarButtons.includes('videomute'),
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(Toolbox);
