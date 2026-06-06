import React, { Component } from 'react';

import Dialog from '../../base/ui/components/web/Dialog';

import VideoQualitySlider from './VideoQualitySlider.web';

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
    override render() {
        return (
            <Dialog
                cancel = {{ hidden: true }}
                ok = {{ hidden: true }}
                titleKey = 'videoStatus.performanceSettings'>
                <VideoQualitySlider />
            </Dialog>
        );
    }
}
