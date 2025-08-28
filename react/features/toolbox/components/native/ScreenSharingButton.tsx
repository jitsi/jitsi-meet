import React from 'react';
import { Platform } from 'react-native';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isDesktopShareButtonDisabled } from '../../functions.native';

import ScreenSharingAndroidButton from './ScreenSharingAndroidButton';
import ScreenSharingIosButton from './ScreenSharingIosButton';

const ScreenSharingButton = (props: any) => (
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
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _disabled: isDesktopShareButtonDisabled(state)
    };
}

export default connect(_mapStateToProps)(ScreenSharingButton);
