// @flow

import React from 'react';
import { SafeAreaView, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../base/color-scheme';
import { connect } from '../../../base/redux';
import { StyleType } from '../../../base/styles';
import { ChatButton } from '../../../chat';
import { ReactionsMenuButton } from '../../../reactions/components';
import { isReactionsEnabled } from '../../../reactions/functions.any';
import { TileViewButton } from '../../../video-layout';
import { isToolboxVisible, getMovableButtons } from '../../functions.native';
import AudioMuteButton from '../AudioMuteButton';
import HangupButton from '../HangupButton';
import VideoMuteButton from '../VideoMuteButton';

import OverflowMenuButton from './OverflowMenuButton';
import RaiseHandButton from './RaiseHandButton';
import ToggleCameraButton from './ToggleCameraButton';
import styles from './styles';

// import { ParticipantsPaneButton } from '../../../participants-pane/components/native';

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
     * The width of the screen.
     */
    _width: number,

    /**
     * Whether or not the reactions feature is enabled.
     */
    _reactionsEnabled: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,
    _janeWaitingAreaEnabled: boolean
};

/**
 * Implements the conference Toolbox on React Native.
 *
 * @param {Object} props - The props of the component.
 * @returns {React$Element}.
 */
function Toolbox(props: Props) {
    if (!props._visible) {
        return null;
    }

    const { _styles, _width, _reactionsEnabled, _janeWaitingAreaEnabled } = props;
    const { buttonStylesBorderless, hangupButtonStyles, toggledButtonStyles } = _styles;
    const additionalButtons = getMovableButtons(_width, _janeWaitingAreaEnabled);
    const backgroundToggledStyle = {
        ...toggledButtonStyles,
        style: [
            toggledButtonStyles.style,
            _styles.backgroundToggle
        ]
    };

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
                <HangupButton
                    styles = { hangupButtonStyles } />
                <VideoMuteButton
                    styles = { buttonStylesBorderless }
                    toggledStyles = { toggledButtonStyles } />
                { additionalButtons.has('chat')
                      && <ChatButton
                          styles = { buttonStylesBorderless }
                          toggledStyles = { backgroundToggledStyle } />}

                { additionalButtons.has('raisehand') && (_reactionsEnabled
                    ? <ReactionsMenuButton
                        styles = { buttonStylesBorderless }
                        toggledStyles = { backgroundToggledStyle } />
                    : <RaiseHandButton
                        styles = { buttonStylesBorderless }
                        toggledStyles = { backgroundToggledStyle } />)}
                {additionalButtons.has('tileview') && <TileViewButton styles = { buttonStylesBorderless } />}
                {/* {additionalButtons.has('participantspane')*/}
                {/* && <ParticipantsPaneButton*/}
                {/*    styles = { buttonStylesBorderless } />*/}
                {/* }*/}
                {additionalButtons.has('togglecamera')
                      && <ToggleCameraButton
                          styles = { buttonStylesBorderless }
                          toggledStyles = { backgroundToggledStyle } />}
                {
                    !_janeWaitingAreaEnabled && <OverflowMenuButton
                        styles = { buttonStylesBorderless }
                        toggledStyles = { toggledButtonStyles } />
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
 * @returns {Props}
 */
function _mapStateToProps(state: Object): Object {
    const { janeWaitingAreaEnabled } = state['features/jane-waiting-area'];

    return {
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _visible: isToolboxVisible(state),
        _width: state['features/base/responsive-ui'].clientWidth,
        _reactionsEnabled: isReactionsEnabled(state),
        _janeWaitingAreaEnabled: janeWaitingAreaEnabled
    };
}

export default connect(_mapStateToProps)(Toolbox);
