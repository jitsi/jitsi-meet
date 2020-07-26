import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';

import VideoEffectFilterChooser from './VideoEffectFilterChooser';

/**
 * Implements a React {@link Component} which displays the component
 * {@code VideoEffectFilterChooser} in a dialog.
 *
 * @extends Component
 */
export default class VideoEffectFiltersDialog extends Component {
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
                okKey = 'dialog.done'
                titleKey = 'videoStatus.effectFilter'
                width = 'small'>
                <VideoEffectFilterChooser />
            </Dialog>
        );
    }
}
