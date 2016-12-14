import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import { MEDIA_TYPE, toggleCameraFacingMode } from '../../base/media';
import { Container } from '../../base/react';
import { ColorPalette } from '../../base/styles';

import { AbstractToolbar, mapStateToProps } from './AbstractToolbar';
import { styles } from './styles';
import ToolbarButton from './ToolbarButton';

/**
 * Implements the conference toolbar on React Native.
 *
 * @extends AbstractToolbar
 */
class Toolbar extends AbstractToolbar {
    /**
     * Toolbar component's property types.
     *
     * @static
     */
    static propTypes = AbstractToolbar.propTypes

    /**
     * Initializes a new Toolbar instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._toggleCameraFacingMode
            = this._toggleCameraFacingMode.bind(this);
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
                style = { styles.toolbarContainer }
                visible = { this.props.visible }>
                {
                    this._renderPrimaryToolbar()
                }
                {
                    this._renderSecondaryToolbar()
                }
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
        const audioButtonStyles = this._getMuteButtonStyles(MEDIA_TYPE.AUDIO);
        const videoButtonStyles = this._getMuteButtonStyles(MEDIA_TYPE.VIDEO);

        /* eslint-disable react/jsx-handler-names */

        return (
            <View style = { styles.primaryToolbar }>
                <ToolbarButton
                    iconName = { audioButtonStyles.iconName }
                    iconStyle = { audioButtonStyles.iconStyle }
                    onClick = { this._toggleAudio }
                    style = { audioButtonStyles.style } />
                <ToolbarButton
                    iconName = 'hangup'
                    iconStyle = { styles.whiteIcon }
                    onClick = { this._onHangup }
                    style = {{
                        ...styles.primaryToolbarButton,
                        backgroundColor: ColorPalette.red
                    }}
                    underlayColor = { ColorPalette.buttonUnderlay } />
                <ToolbarButton
                    iconName = { videoButtonStyles.iconName }
                    iconStyle = { videoButtonStyles.iconStyle }
                    onClick = { this._toggleVideo }
                    style = { videoButtonStyles.style } />
            </View>
        );

        /* eslint-enable react/jsx-handler-names */
    }

    /**
     * Renders the toolbar which contains the secondary buttons such as toggle
     * camera facing mode.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSecondaryToolbar() {
        const iconStyle = styles.secondaryToolbarIcon;
        const style = styles.secondaryToolbarButton;
        const underlayColor = 'transparent';

        /* eslint-disable react/jsx-curly-spacing,react/jsx-handler-names */

        // TODO Use an appropriate icon for toggle camera facing mode.
        return (
            <View style = { styles.secondaryToolbar }>
                <ToolbarButton
                    iconName = 'switch-camera'
                    iconStyle = { iconStyle }
                    onClick = { this._toggleCameraFacingMode }
                    style = { style }
                    underlayColor = { underlayColor } />
                <ToolbarButton
                    iconName = {
                        this.props.locked ? 'security-locked' : 'security'
                    }
                    iconStyle = { iconStyle }
                    onClick = { this._onRoomLock }
                    style = { style }
                    underlayColor = { underlayColor } />
            </View>
        );

        /* eslint-enable react/jsx-curly-spacing,react/jsx-handler-names */
    }

    /**
     * Switches between the front/user-facing and rear/environment-facing
     * cameras.
     *
     * @private
     * @returns {void}
     */
    _toggleCameraFacingMode() {
        this.props.dispatch(toggleCameraFacingMode());
    }
}

/**
 * Additional properties for various icons, which are now platform-dependent.
 * This is done to have common logic of generating styles for web and native.
 * TODO As soon as we have common font sets for web and native, this will no
 * longer be required.
 */
Object.assign(Toolbar.prototype, {
    audioIcon: 'microphone',
    audioMutedIcon: 'mic-disabled',
    videoIcon: 'camera',
    videoMutedIcon: 'camera-disabled'
});

export default connect(mapStateToProps)(Toolbar);
