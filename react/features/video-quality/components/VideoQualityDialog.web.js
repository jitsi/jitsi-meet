import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';

import VideoQualitySlider from './VideoQualitySlider';

/**
 * Implements a React {@link Component} which displays the component
 * {@code VideoQualitySlider} in a dialog.
 *
 * @augments Component
 */
export default class VideoQualityDialog extends Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                hideCancelButton = { true }
                submitDisabled = { true }
                titleKey = 'videoStatus.performanceSettings'
                width = 'small'>
                <VideoQualitySlider />
            </Dialog>
        );
    }
}
