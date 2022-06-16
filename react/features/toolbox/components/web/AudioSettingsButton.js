// @flow

import React, { Component } from 'react';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { IconArrowUp } from '../../../base/icons';
import JitsiMeetJS from '../../../base/lib-jitsi-meet/_';
import { connect } from '../../../base/redux';
import { ToolboxButtonWithIcon } from '../../../base/toolbox/components';
import { AudioSettingsPopup, toggleAudioSettings } from '../../../settings';
import { getAudioSettingsVisibility } from '../../../settings/functions';
import { isAudioSettingsButtonDisabled } from '../../functions';
import AudioMuteButton from '../AudioMuteButton';

type Props = {

    /**
     * The button's key.
     */
     buttonKey?: string,

    /**
     * External handler for click action.
     */
     handleClick: Function,

    /**
     * Indicates whether audio permissions have been granted or denied.
     */
    hasPermissions: boolean,

    /**
     * Click handler for the small icon. Opens audio options.
     */
    onAudioOptionsClick: Function,

    /**
     * If the button should be disabled.
     */
    isDisabled: boolean,

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * Flag controlling the visibility of the button.
     * AudioSettings popup is disabled on mobile browsers.
     */
    visible: boolean,

    /**
     * Defines is popup is open.
     */
    isOpen: boolean,
};

/**
 * Button used for audio & audio settings.
 *
 * @returns {ReactElement}
 */
class AudioSettingsButton extends Component<Props> {
    /**
     * Initializes a new {@code AudioSettingsButton} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onEscClick = this._onEscClick.bind(this);
        this._onClick = this._onClick.bind(this);
    }

    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props.isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onClick();
        }
    }

    _onClick: () => void;

    /**
     * Click handler for the more actions entries.
     *
     * @returns {void}
     */
    _onClick() {
        const { onAudioOptionsClick } = this.props;

        onAudioOptionsClick();
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { hasPermissions, isDisabled, visible, isOpen, buttonKey, notifyMode, t } = this.props;
        const settingsDisabled = !hasPermissions
            || isDisabled
            || !JitsiMeetJS.mediaDevices.isMultipleAudioInputSupported();

        return visible ? (
            <AudioSettingsPopup>
                <ToolboxButtonWithIcon
                    ariaControls = 'audio-settings-dialog'
                    ariaExpanded = { isOpen }
                    ariaHasPopup = { true }
                    ariaLabel = { t('toolbar.audioSettings') }
                    buttonKey = { buttonKey }
                    icon = { IconArrowUp }
                    iconDisabled = { settingsDisabled }
                    iconId = 'audio-settings-button'
                    iconTooltip = { t('toolbar.audioSettings') }
                    notifyMode = { notifyMode }
                    onIconClick = { this._onClick }
                    onIconKeyDown = { this._onEscClick }>
                    <AudioMuteButton
                        buttonKey = { buttonKey }
                        notifyMode = { notifyMode } />
                </ToolboxButtonWithIcon>
            </AudioSettingsPopup>
        ) : <AudioMuteButton
            buttonKey = { buttonKey }
            notifyMode = { notifyMode } />;
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    const { permissions = {} } = state['features/base/devices'];

    return {
        hasPermissions: permissions.audio,
        isDisabled: isAudioSettingsButtonDisabled(state),
        isOpen: getAudioSettingsVisibility(state),
        visible: !isMobileBrowser()
    };
}

const mapDispatchToProps = {
    onAudioOptionsClick: toggleAudioSettings
};

export default translate(connect(
    mapStateToProps,
    mapDispatchToProps
)(AudioSettingsButton));
