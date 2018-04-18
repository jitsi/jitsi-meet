// @flow

import React, { Component } from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { Container } from '../../base/react';
import {
    isNarrowAspectRatio,
    makeAspectRatioAware
} from '../../base/responsive-ui';
import { ColorPalette } from '../../base/styles';

import styles from './styles';

import {
    AudioMuteButton,
    AudioOnlyButton,
    AudioRouteButton,
    HangupButton,
    PictureInPictureButton,
    RoomLockButton,
    InviteButton,
    ToggleCameraButton,
    VideoMuteButton
} from './buttons';

/**
 * Styles for the hangup button.
 */
const hangupButtonStyles = {
    iconStyle: styles.whitePrimaryToolbarButtonIcon,
    style: styles.hangup,
    underlayColor: ColorPalette.buttonUnderlay
};

/**
 * Styles for buttons in the primary toolbar.
 */
const primaryToolbarButtonStyles = {
    iconStyle: styles.primaryToolbarButtonIcon,
    style: styles.primaryToolbarButton
};

/**
 * Styles for buttons in the primary toolbar.
 */
const primaryToolbarToggledButtonStyles = {
    iconStyle: styles.whitePrimaryToolbarButtonIcon,
    style: styles.whitePrimaryToolbarButton
};

/**
 * Styles for buttons in the secondary toolbar.
 */
const secondaryToolbarButtonStyles = {
    iconStyle: styles.secondaryToolbarButtonIcon,
    style: styles.secondaryToolbarButton,
    underlayColor: 'transparent'
};

/**
 * The type of {@link Toolbox}'s React {@code Component} props.
 */
type Props = {

    /**
     * The indicator which determines whether the toolbox is enabled.
     */
    _enabled: boolean,

    /**
     * Flag showing whether toolbar is visible.
     */
    _visible: boolean
};

/**
 * Implements the conference toolbox on React Native.
 */
class Toolbox extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        if (!this.props._enabled) {
            return null;
        }

        const toolboxStyle
            = isNarrowAspectRatio(this)
                ? styles.toolboxNarrow
                : styles.toolboxWide;

        return (
            <Container
                style = { toolboxStyle }
                visible = { this.props._visible } >
                { this._renderToolbars() }
            </Container>
        );
    }

    /**
     * Renders the toolbar which contains the primary buttons such as hangup,
     * audio and video mute.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderPrimaryToolbar() {
        return (
            <View
                key = 'primaryToolbar'
                pointerEvents = 'box-none'
                style = { styles.primaryToolbar }>
                <AudioMuteButton
                    styles = { primaryToolbarButtonStyles }
                    toggledStyles = { primaryToolbarToggledButtonStyles } />
                <HangupButton styles = { hangupButtonStyles } />
                <VideoMuteButton
                    styles = { primaryToolbarButtonStyles }
                    toggledStyles = { primaryToolbarToggledButtonStyles } />
            </View>
        );
    }

    /**
     * Renders the toolbar which contains the secondary buttons such as toggle
     * camera facing mode.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSecondaryToolbar() {
        return (
            <View
                key = 'secondaryToolbar'
                pointerEvents = 'box-none'
                style = { styles.secondaryToolbar }>
                <AudioRouteButton styles = { secondaryToolbarButtonStyles } />
                <ToggleCameraButton styles = { secondaryToolbarButtonStyles } />
                <AudioOnlyButton styles = { secondaryToolbarButtonStyles } />
                <RoomLockButton styles = { secondaryToolbarButtonStyles } />
                <InviteButton styles = { secondaryToolbarButtonStyles } />
                <PictureInPictureButton
                    styles = { secondaryToolbarButtonStyles } />
            </View>
        );
    }

    /**
     * Renders the primary and the secondary toolbars.
     *
     * @private
     * @returns {[ReactElement, ReactElement]}
     */
    _renderToolbars() {
        return [
            this._renderSecondaryToolbar(),
            this._renderPrimaryToolbar()
        ];
    }
}

/**
 * Maps parts of the redux state to {@link Toolbox} (React {@code Component})
 * props.
 *
 * @param {Object} state - The redux state of which parts are to be mapped to
 * {@code Toolbox} props.
 * @protected
 * @returns {{
 *     _enabled: boolean,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state: Object): Object {
    const { enabled, visible } = state['features/toolbox'];

    return {
        /**
         * The indicator which determines whether the toolbox is enabled.
         *
         * @private
         * @type {boolean}
         */
        _enabled: enabled,

        /**
         * Flag showing whether toolbox is visible.
         *
         * @protected
         * @type {boolean}
         */
        _visible: visible
    };
}

export default connect(_mapStateToProps)(makeAspectRatioAware(Toolbox));
