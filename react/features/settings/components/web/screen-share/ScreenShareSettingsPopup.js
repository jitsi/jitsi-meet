// @flow

import InlineDialog from '@atlaskit/inline-dialog';
import React from 'react';

import ScreenShareSettingsContent from '../screen-share/ScreenShareSettingsContent'

/**
 * Popup with screen share settings.
 *
 * @returns {ReactElement}
 */
const ScreenShareSettingsPopup = () => {
    console.log('intra macar aici?')
    return (
        <div className = 'audio-preview'>
            <InlineDialog
                content = { <ScreenShareSettingsContent /> }
                placement = 'top-start'>
            </InlineDialog>
        </div>
    );
}


export default ScreenShareSettingsPopup;
