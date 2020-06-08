// @flow

import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { Container } from '../../../base/react';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { ChatButton } from '../../../chat';

import { isToolboxVisible } from '../../functions';

import AudioMuteButton from '../AudioMuteButton';
import HangupButton from '../HangupButton';

import OverflowMenuButton from './OverflowMenuButton';
import styles from './styles';
import VideoMuteButton from '../VideoMuteButton';
import { TileViewButton } from '../../../video-layout';
import { setToolboxVisible } from '../../index';

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

type State = {
    tileTooltipVisible: boolean
};

/**
 * Implements the conference toolbox on React Native.
 */
class Toolbox extends PureComponent<Props, State> {
    /**
     * Initializes a new toolbox instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this.onTileViewClick = this.onTileViewClick.bind(this);
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
                style = { styles.toolbox }
                visible = { this.props._visible }>
                { this._renderToolbar() }
            </Container>
        );
    }

    state = {
        tileTooltipVisible: false
    };

    // eslint-disable-next-line require-jsdoc
    componentDidMount() {
        this.props.dispatch(setToolboxVisible(true));
        setTimeout(() => {
            this.setState({
                tileTooltipVisible: true
            });
        }, 5000);

        setTimeout(() => {
            this.setState({
                tileTooltipVisible: false
            });
        }, 10000);
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

    // eslint-disable-next-line require-jsdoc
    onTileViewClick: () => void;

    // eslint-disable-next-line require-jsdoc
    onTileViewClick() {
        this.setState({ tileTooltipVisible: false });
    }

    /**
     * Renders the toolbar. In order to avoid a weird visual effect in which the
     * toolbar is (visually) rendered and then visibly changes its size, it is
     * rendered only after we've figured out the width available to the toolbar.
     *
     * @returns {React$Node}
     */
    _renderToolbar() {
        const { _styles } = this.props;
        const { buttonStyles, buttonStylesBorderless, hangupButtonStyles, toggledButtonStyles } = _styles;

        const tileTooltipWrapper = {
            position: 'relative'
        };

        const tileTooltip = {
            position: 'absolute',
            bottom: 60,
            right: '0%',
            backgroundColor: '#ffffff',
            borderRadius: 10,
            width: 150,
            padding: 15
        };

        const tileTooltipTitle = {
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#000000',
            marginBottom: 5,
            fontSize: 16
        };

        const tileTooltipText = {
            textAlign: 'center',
            color: '#000000',
            lineHeight: 20
        };

        const tileTooltipArrow = {
            position: 'absolute',
            right: 27,
            bottom: -6,
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 5,
            borderRightWidth: 5,
            borderTopWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: '#ffffff'
        };

        return (
            <View
                accessibilityRole = 'toolbar'
                pointerEvents = 'box-none'
                style = { styles.toolbar }>
                <ChatButton
                    styles = { buttonStylesBorderless }
                    toggledStyles = { this._getChatButtonToggledStyle(toggledButtonStyles) } />
                <VideoMuteButton
                    styles = { buttonStyles }
                    toggledStyles = { toggledButtonStyles } />
                <AudioMuteButton
                    styles = { buttonStyles }
                    toggledStyles = { toggledButtonStyles } />
                <HangupButton
                    styles = { hangupButtonStyles } />

                <View style = { tileTooltipWrapper }>
                    {
                        this.state.tileTooltipVisible && <View style = { tileTooltip }>
                            <Text style = { tileTooltipTitle }>Let's fiesta!</Text>
                            <Text style = { tileTooltipText }>Tap to toggle between grid and full screen view.</Text>
                            <View style = { tileTooltipArrow } />
                        </View>
                    }

                    <TileViewButton
                        afterClick = { this.onTileViewClick }
                        styles = { buttonStyles }
                        toggledStyles = { toggledButtonStyles } />
                </View>

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
 * @returns {Props}
 */
function _mapStateToProps(state: Object): Object {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _visible: isToolboxVisible(state)
    };
}

export default connect(_mapStateToProps)(Toolbox);
