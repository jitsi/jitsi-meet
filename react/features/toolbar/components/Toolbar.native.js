import React from 'react';
import { View } from 'react-native';
import { connect } from 'react-redux';

import {
    MEDIA_TYPE,
    toggleCameraFacingMode
} from '../../base/media';
import { Container } from '../../base/react';
import { ColorPalette } from '../../base/styles';

import {
    AbstractToolbar,
    mapStateToProps
} from './AbstractToolbar';
import { styles } from './styles';
import ToolbarButton from './ToolbarButton';

/**
 * Implements the conference toolbar on React Native.
 *
 * @extends AbstractToolbar
 */
class Toolbar extends AbstractToolbar {
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
        const audioButtonStyles = this._getMuteButtonStyles(MEDIA_TYPE.AUDIO);
        const videoButtonStyles = this._getMuteButtonStyles(MEDIA_TYPE.VIDEO);
        const underlayColor = ColorPalette.buttonUnderlay;

        // TODO Use correct Jitsi icon for camera switch button when available.

        /* eslint-disable react/jsx-handler-names */

        return (
            <Container
                style = { styles.toolbarContainer }
                visible = { this.props.visible }>

                <View style = { styles.toggleCameraFacingModeContainer }>
                    <ToolbarButton
                        iconName = 'reload'
                        iconstyle = { styles.whiteIcon }
                        onClick = { this._toggleCameraFacingMode }
                        style = { styles.toggleCameraFacingModeButton }
                        underlayColor = 'transparent' />
                </View>
                <View style = { styles.toolbarButtonsContainer }>
                    <ToolbarButton
                        iconName = { audioButtonStyles.iconName }
                        iconStyle = { audioButtonStyles.iconStyle }
                        onClick = { this._toggleAudio }
                        style = { audioButtonStyles.buttonStyle } />
                    <ToolbarButton
                        iconName = 'hangup'
                        iconStyle = { styles.whiteIcon }
                        onClick = { this._onHangup }
                        style = {{
                            ...styles.toolbarButton,
                            backgroundColor: ColorPalette.jitsiRed
                        }}
                        underlayColor = { underlayColor } />
                    <ToolbarButton
                        iconName = { videoButtonStyles.iconName }
                        iconStyle = { videoButtonStyles.iconStyle }
                        onClick = { this._toggleVideo }
                        style = { videoButtonStyles.buttonStyle } />
                </View>
            </Container>
        );

        /* eslint-enable react/jsx-handler-names */
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
    videoIcon: 'webCam',
    videoMutedIcon: 'camera-disabled'
});

/**
 * Toolbar component's property types.
 *
 * @static
 */
Toolbar.propTypes = AbstractToolbar.propTypes;

export default connect(mapStateToProps)(Toolbar);
