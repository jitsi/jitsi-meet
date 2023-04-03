/* eslint-disable lines-around-comment */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// @ts-ignore
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
// @ts-ignore
import LoadingIndicator from '../../../../base/react/components/native/LoadingIndicator';
// @ts-ignore
import TintedView from '../../../../base/react/components/native/TintedView';
import { isLocalVideoTrackDesktop } from '../../../../base/tracks/functions.native';
// @ts-ignore
import { setPictureInPictureEnabled } from '../../../../mobile/picture-in-picture/functions';
// @ts-ignore
import { setIsCarmode } from '../../../../video-layout/actions';
// @ts-ignore
import ConferenceTimer from '../../ConferenceTimer';
// @ts-ignore
import { isConnecting } from '../../functions';

import CarModeFooter from './CarModeFooter';
import MicrophoneButton from './MicrophoneButton';
import TitleBar from './TitleBar';
// @ts-ignore
import styles from './styles';

/**
 * Implements the carmode component.
 *
 * @returns { JSX.Element} - The carmode component.
 */
const CarMode = (): JSX.Element => {
    const dispatch = useDispatch();
    const connecting = useSelector(isConnecting);
    const isSharing = useSelector(isLocalVideoTrackDesktop);

    useEffect(() => {
        dispatch(setIsCarmode(true));
        setPictureInPictureEnabled(false);
        Orientation.lockToPortrait();

        return () => {
            Orientation.unlockAllOrientations();
            dispatch(setIsCarmode(false));
            if (!isSharing) {
                setPictureInPictureEnabled(true);
            }
        };
    }, []);

    return (
        <JitsiScreen
            footerComponent = { CarModeFooter }
            style = { styles.conference }>
            {/*
                  * The activity/loading indicator goes above everything, except
                  * the toolbox/toolbars and the dialogs.
                  */
                connecting
                && <TintedView>
                    <LoadingIndicator />
                </TintedView>
            }
            <View
                pointerEvents = 'box-none'
                style = { styles.titleBarSafeViewColor }>
                <View
                    style = { styles.titleBar }>
                    {/* @ts-ignore */}
                    <TitleBar />
                </View>
                <ConferenceTimer textStyle = { styles.roomTimer } />
            </View>
            <View
                pointerEvents = 'box-none'
                style = { styles.microphoneContainer }>
                <MicrophoneButton />
            </View>
        </JitsiScreen>
    );
};

export default withSafeAreaInsets(CarMode);
