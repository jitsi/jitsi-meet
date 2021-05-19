// @flow

import React from 'react';
import { Platform } from 'react-native';

import { connect } from '../../../base/redux';

import ScreenSharingAndroidButton from './ScreenSharingAndroidButton.js';
import ScreenSharingIosButton from './ScreenSharingIosButton.js';

const ScreenSharingButton = props => (
    <>
        {Platform.OS === 'android' && props.visible
            && <ScreenSharingAndroidButton { ...props } />
        }
        {Platform.OS === 'ios' && props.visible
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
 *     enabled: boolean,
 * }}
 */
function _mapStateToProps(state): Object {
    const visible = !state['features/base/audio-only'].enabled;

    return {
        visible
    };
}

export default connect(_mapStateToProps)(ScreenSharingButton);
