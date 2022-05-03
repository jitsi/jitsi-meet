import React from 'react';
import { Platform } from 'react-native';

import { connect } from '../../../base/redux';
import { isDesktopShareButtonDisabled } from '../../functions.native';

import ScreenSharingAndroidButton from './ScreenSharingAndroidButton.js';
import ScreenSharingIosButton from './ScreenSharingIosButton.js';

const ScreenSharingButton = props => (
    <>
        {Platform.OS === 'android'
            && <ScreenSharingAndroidButton { ...props } />
        }
        {Platform.OS === 'ios'
            && <ScreenSharingIosButton { ...props } />
        }
    </>
);

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code ScreenSharingButton} component.
 *
 * @param state - The Redux state.
 * @private
 */
function _mapStateToProps(state: object): object {
    return {
        _disabled: isDesktopShareButtonDisabled(state)
    };
}

export default connect(_mapStateToProps)(ScreenSharingButton);
