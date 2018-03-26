// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { openDeviceSelectionDialog } from '../../device-selection';

import ToolbarButtonV2 from './ToolbarButtonV2';
import { AudioMuteButton, HangupButton, VideoMuteButton } from './buttons';

declare var interfaceConfig: Object;

/**
 * Implements the conference toolbox on React/Web for filmstrip only mode.
 *
 * @extends Component
 */
class ToolboxFilmstrip extends Component<*> {
    _visibleButtons: Object;

    /**
     * Initializes a new {@code ToolboxFilmstrip} instance.
     *
     * @param {Props} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._visibleButtons = new Set(interfaceConfig.TOOLBAR_BUTTONS);

        // Bind event handlers so they are only bound once per instance.
        this._onToolbarOpenSettings = this._onToolbarOpenSettings.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div className = 'filmstrip-toolbox'>
                { this._shouldShowButton('microphone')
                    && <AudioMuteButton tooltipPosition = 'left' /> }
                { this._shouldShowButton('camera')
                    && <VideoMuteButton tooltipPosition = 'left' /> }
                { this._shouldShowButton('fodeviceselection')
                    && <ToolbarButtonV2
                        iconName = 'icon-settings'
                        onClick = { this._onToolbarOpenSettings }
                        tooltip = { t('toolbar.Settings') }
                        tooltipPosition = 'left' /> }
                { this._shouldShowButton('hangup')
                    && <HangupButton tooltipPosition = 'left' /> }
            </div>
        );
    }

    _onToolbarOpenSettings: () => void;

    /**
     * Creates an analytics toolbar event for and dispatches an action to open
     * the device selection popup dialog.
     *
     * @private
     * @returns {void}
     */
    _onToolbarOpenSettings() {
        sendAnalytics(createToolbarEvent('filmstrip.only.device.selection'));

        this.props.dispatch(openDeviceSelectionDialog());
    }

    _shouldShowButton: (string) => boolean;

    /**
     * Returns if a button name has been explicitly configured to be displayed.
     *
     * @param {string} buttonName - The name of the button, as expected in
     * {@link intefaceConfig}.
     * @private
     * @returns {boolean} True if the button should be displayed.
     */
    _shouldShowButton(buttonName) {
        return this._visibleButtons.has(buttonName);
    }
}

export default translate(connect()(ToolboxFilmstrip));
