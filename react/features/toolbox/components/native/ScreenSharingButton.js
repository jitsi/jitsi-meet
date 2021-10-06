// @flow

import React from 'react';
import { Platform } from 'react-native';

import { connect } from '../../../base/redux';

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
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _disabled: boolean,
 * }}
 */
function _mapStateToProps(state): Object {
    const disabled = state['features/base/audio-only'].enabled;

    return {
        _disabled: disabled
    };
}

export default connect(_mapStateToProps)(ScreenSharingButton);
