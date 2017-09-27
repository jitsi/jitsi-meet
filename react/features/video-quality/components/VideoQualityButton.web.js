import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { ToolbarButtonWithDialog } from '../../toolbox';

import { VideoQualityDialog } from './';

/**
 * A configuration object to describe how {@code ToolbarButton} should render
 * the button.
 *
 * @type {object}
 */
const DEFAULT_BUTTON_CONFIGURATION = {
    buttonName: 'videoquality',
    classNames: [ 'button', 'icon-visibility' ],
    enabled: true,
    id: 'toolbar_button_videoquality',
    tooltipKey: 'videoStatus.qualityButtonTip'
};

/**
 * React {@code Component} for displaying a button which will open an inline
 * dialog for changing received video quality settings.
 *
 * @extends Component
 */
class VideoQualityButton extends Component {
    /**
     * {@code VideoQualityButton}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * From which side tooltips should display. Will be re-used for
         * displaying the inline dialog for video quality adjustment.
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <ToolbarButtonWithDialog
                button = { DEFAULT_BUTTON_CONFIGURATION }
                content = { VideoQualityDialog }
                tooltipPosition = { this.props.tooltipPosition } />
        );
    }
}

export default VideoQualityButton;
