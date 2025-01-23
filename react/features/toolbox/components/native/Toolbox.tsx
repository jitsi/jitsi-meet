import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import Platform from '../../../base/react/Platform.native';
import ChatButton from '../../../chat/components/native/ChatButton';
import ReactionsMenuButton from '../../../reactions/components/native/ReactionsMenuButton';
import { shouldDisplayReactionsButtons } from '../../../reactions/functions.any';
import TileViewButton from '../../../video-layout/components/TileViewButton';
import { iAmVisitor } from '../../../visitors/functions';
import { customButtonPressed } from '../../actions.native';
import { getMovableButtons, isToolboxVisible } from '../../functions.native';
import HangupButton from '../HangupButton';

import AudioMuteButton from './AudioMuteButton';
import CustomOptionButton from './CustomOptionButton';
import HangupMenuButton from './HangupMenuButton';
import OverflowMenuButton from './OverflowMenuButton';
import RaiseHandButton from './RaiseHandButton';
import ScreenSharingButton from './ScreenSharingButton';
import VideoMuteButton from './VideoMuteButton';
import styles from './styles';


/**
 * The type of {@link Toolbox}'s React {@code Component} props.
 */
interface IProps {

    /**
     * Custom Toolbar buttons.
     */
    _customToolbarButtons?: Array<{ backgroundColor?: string; icon: string; id: string; text: string; }>;

    /**
     * Whether the end conference feature is supported.
     */
    _endConferenceSupported: boolean;

    /**
     * Whether we are in visitors mode.
     */
    _iAmVisitor: boolean;

    /**
     * Whether or not any reactions buttons should be visible.
     */
    _shouldDisplayReactionsButtons: boolean;

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: any;

    /**
     * The indicator which determines whether the toolbox is visible.
     */
    _visible: boolean;

    /**
     * The width of the screen.
     */
    _width: number;

    /**
     * Redux store dispatch method.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Implements the conference Toolbox on React Native.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}
 */
function Toolbox(props: IProps) {
    const {
        _customToolbarButtons,
        _endConferenceSupported,
        _iAmVisitor,
        _shouldDisplayReactionsButtons,
        _styles,
        _visible,
        _width,
        dispatch
    } = props;

    if (!_visible) {
        return null;
    }

    const bottomEdge = Platform.OS === 'ios' && _visible;
    const { buttonStylesBorderless, hangupButtonStyles, toggledButtonStyles } = _styles;
    const additionalButtons = getMovableButtons(_width);
    const backgroundToggledStyle = {
        ...toggledButtonStyles,
        style: [
            toggledButtonStyles.style,
            _styles.backgroundToggle
        ]
    };
    const style = { ...styles.toolbox };

    // we have only hangup and raisehand button in _iAmVisitor mode
    if (_iAmVisitor) {
        additionalButtons.add('raisehand');
        style.justifyContent = 'center';
    }

    const renderCustomToolboxButtons = () => {
        if (!_customToolbarButtons?.length) {
            return;
        }

        return (
            <>
                {
                    _customToolbarButtons.map(({ backgroundColor, id, text, icon }) => (
                        <CustomOptionButton
                            backgroundColor = { backgroundColor }

                            /* eslint-disable react/jsx-no-bind */
                            handleClick = { () => dispatch(customButtonPressed(id, text)) }
                            icon = { icon }
                            key = { id } />
                    ))
                }
            </>
        );
    };

    return (
        <View
            style = { styles.toolboxContainer as ViewStyle }>
            <SafeAreaView
                accessibilityRole = 'toolbar'

                // @ts-ignore
                edges = { [ bottomEdge && 'bottom' ].filter(Boolean) }
                pointerEvents = 'box-none'
                style = { style as ViewStyle }>
                {
                    _customToolbarButtons
                        ? renderCustomToolboxButtons()
                        : <>
                            {!_iAmVisitor && <AudioMuteButton
                                styles = { buttonStylesBorderless }
                                toggledStyles = { toggledButtonStyles } />}
                            {!_iAmVisitor && <VideoMuteButton
                                styles = { buttonStylesBorderless }
                                toggledStyles = { toggledButtonStyles } />}
                            {additionalButtons.has('chat')
                                && <ChatButton
                                    styles = { buttonStylesBorderless }
                                    toggledStyles = { backgroundToggledStyle } />}
                            {!_iAmVisitor && additionalButtons.has('screensharing')
                                && <ScreenSharingButton styles = { buttonStylesBorderless } />}
                            {additionalButtons.has('raisehand') && (_shouldDisplayReactionsButtons
                                ? <ReactionsMenuButton
                                    styles = { buttonStylesBorderless }
                                    toggledStyles = { backgroundToggledStyle } />
                                : <RaiseHandButton
                                    styles = { buttonStylesBorderless }
                                    toggledStyles = { backgroundToggledStyle } />)}
                            {additionalButtons.has('tileview')
                                && <TileViewButton styles = { buttonStylesBorderless } />}
                            {!_iAmVisitor && <OverflowMenuButton
                                styles = { buttonStylesBorderless }
                                toggledStyles = { toggledButtonStyles } />}
                            { _endConferenceSupported
                                ? <HangupMenuButton />
                                : <HangupButton styles = { hangupButtonStyles } />}
                        </>
                }
            </SafeAreaView>
        </View>
    );
}

/**
 * Maps parts of the redux state to {@link Toolbox} (React {@code Component})
 * props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code Toolbox} props.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { conference } = state['features/base/conference'];
    const endConferenceSupported = conference?.isEndConferenceSupported();

    return {
        _customToolbarButtons: state['features/base/config']?.customToolbarButtons,
        _endConferenceSupported: Boolean(endConferenceSupported),
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _visible: isToolboxVisible(state),
        _iAmVisitor: iAmVisitor(state),
        _width: state['features/base/responsive-ui'].clientWidth,
        _shouldDisplayReactionsButtons: shouldDisplayReactionsButtons(state)
    };
}

export default connect(_mapStateToProps)(Toolbox);
