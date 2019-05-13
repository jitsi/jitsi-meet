import React, { Component } from 'react';

import { Dialog } from '../../base/dialog';

import VideoQualitySlider from './VideoQualitySlider';
import AbstractVideoQualityDialog from './AbstractVideoQualityDialog';

/**
 * Implements a React {@link Component} which displays the component
 * {@code VideoQualitySlider} in a dialog.
 *
 * @extends Component
 */
export default class VideoQualityDialog extends AbstractVideoQualityDialog<Props> {
    
	/**
     * Initializes a new {@code VideoQualityDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
	constructor(props: Props) {
        super(props);
    }  
	
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
                titleKey = 'videoStatus.callQuality'
                width = 'small'>
                <VideoQualitySlider />
            </Dialog>
        );
    }
}
