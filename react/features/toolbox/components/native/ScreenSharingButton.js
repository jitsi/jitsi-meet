import React from 'react';
import { Platform } from 'react-native';

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

export default ScreenSharingButton;
