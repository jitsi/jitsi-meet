/* eslint-disable lines-around-comment */
import React from 'react';
import { Platform } from 'react-native';

import { connect } from '../../../base/redux/functions';
// @ts-ignore
import { isDesktopShareButtonDisabled } from '../../functions.native';

// @ts-ignore
import ScreenSharingAndroidButton from './ScreenSharingAndroidButton.js';
// @ts-ignore
import ScreenSharingIosButton from './ScreenSharingIosButton.js';

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
function _mapStateToProps(state: object): object {
    return {
        _disabled: isDesktopShareButtonDisabled(state)
    };
}

export default connect(_mapStateToProps)(ScreenSharingButton);
