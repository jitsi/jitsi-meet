// @flow

import React, { Component } from 'react';

import AudioMuteButton from '../AudioMuteButton';
import { hasAvailableDevices } from '../../../base/devices';
import { IconArrowDown } from '../../../base/icons';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { ToolboxButtonWithIcon } from '../../../base/toolbox';
import { connect } from '../../../base/redux';

import { AudioSettingsPopup, toggleAudioSettings } from '../../../settings';

type Props = {

    /**
     * Click handler for the small icon. Opens audio options.
     */
    onAudioOptionsClick: Function,

    /**
     * If the user has audio input or audio output devices.
     */
    hasDevices: boolean,

    /**
     * Flag controlling the visibility of the button.
     */
    visible: boolean,
};

type State = {

    /**
     * If there are permissions for audio devices.
     */
    hasPermissions: boolean,
}

/**
 * Button used for audio & audio settings.
 *
 * @returns {ReactElement}
 */
class AudioSettingsButton extends Component<Props, State> {
    /**
     * Initializes a new {@code AudioSettingsButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            hasPermissions: false
        };
    }

    /**
     * Updates device permissions.
     *
     * @returns {Promise<void>}
     */
    async _updatePermissions() {
        const hasPermissions = await JitsiMeetJS.mediaDevices.isDevicePermissionGranted(
            'audio',
        );

        this.setState({
            hasPermissions
        });
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._updatePermissions();
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { hasDevices, onAudioOptionsClick, visible } = this.props;
        const settingsDisabled = !this.state.hasPermissions || !hasDevices;

        return visible ? (
            <AudioSettingsPopup>
                <ToolboxButtonWithIcon
                    icon = { IconArrowDown }
                    iconDisabled = { settingsDisabled }
                    onIconClick = { onAudioOptionsClick }>
                    <AudioMuteButton />
                </ToolboxButtonWithIcon>
            </AudioSettingsPopup>
        ) : null;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        hasDevices:
            hasAvailableDevices(state, 'audioInput')
            || hasAvailableDevices(state, 'audioOutput')
    };
}

const mapDispatchToProps = {
    onAudioOptionsClick: toggleAudioSettings
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(AudioSettingsButton);
