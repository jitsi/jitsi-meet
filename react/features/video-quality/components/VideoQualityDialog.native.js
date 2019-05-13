import React from 'react';

import AbstractVideoQualityDialog, {
    _mapDispatchToProps,
    _mapStateToProps,
    type Props
} from './AbstractVideoQualityDialog'

/**
 * Implements a React {@link Component} which displays the component
 * {@code VideoQualitySlider} in a dialog.
 *
 * @extends Component
 */
class VideoQualityDialog extends AbstractVideoQualityDialog<Props> {
    
    /**
     * Initializes a new {@code VideoQualityDialog} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);
    }    
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(VideoQualityDialog));
