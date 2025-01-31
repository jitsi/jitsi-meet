import React from 'react';
import { View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect, useSelector } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import ColorSchemeRegistry from '../../../base/color-scheme/ColorSchemeRegistry';
import Platform from '../../../base/react/Platform.native';
import { shouldDisplayReactionsButtons } from '../../../reactions/functions.any';
import { iAmVisitor } from '../../../visitors/functions';

import { customButtonPressed } from '../../actions.native';
import { getMovableButtons, getVisibleNativeButtons, isToolboxVisible } from '../../functions.native';
import { useNativeToolboxButtons } from '../../hooks.native';

import styles from './styles';

/**
 * The type of {@link Toolbox}'s React {@code Component} props.
 */
interface IProps {

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
        _iAmVisitor,
        _styles,
        _visible,
        dispatch
    } = props;

    if (!_visible) {
        return null;
    }

    const { clientWidth } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const { customToolbarButtons } = useSelector((state: IReduxState) => state['features/base/config']);
    const {
        mainToolbarButtonsThresholds,
        toolbarButtons
    } = useSelector((state: IReduxState) => state['features/toolbox']);

    const allButtons = useNativeToolboxButtons(customToolbarButtons);

    const { mainMenuButtons } = getVisibleNativeButtons({
        allButtons,
        clientWidth,
        mainToolbarButtonsThresholds,
        toolbarButtons
    });

    const bottomEdge = Platform.OS === 'ios' && _visible;
    const { buttonStylesBorderless, hangupButtonStyles, toggledButtonStyles } = _styles;
    const additionalButtons = getMovableButtons(clientWidth);
    const style = { ...styles.toolbox };

    // we have only hangup and raisehand button in _iAmVisitor mode
    if (_iAmVisitor) {
        additionalButtons.add('raisehand');
        style.justifyContent = 'center';
    }

    const renderToolboxButtons = () => {
        if (!mainMenuButtons?.length) {
            return;
        }

        return (
            <>
                {
                    mainMenuButtons.map(({ Content, key, text, ...rest }) => (
                        <Content
                            { ...rest }
                            /* eslint-disable react/jsx-no-bind */
                            handleClick = { () => dispatch(customButtonPressed(key, text)) }
                            isToolboxButton = { true }
                            key = { key }
                            styles = { key === 'hangup' ? hangupButtonStyles : buttonStylesBorderless } />
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
                { renderToolboxButtons() }
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
    return {
        _iAmVisitor: iAmVisitor(state),
        _shouldDisplayReactionsButtons: shouldDisplayReactionsButtons(state),
        _styles: ColorSchemeRegistry.get(state, 'Toolbox'),
        _visible: isToolboxVisible(state),
    };
}

export default connect(_mapStateToProps)(Toolbox);
