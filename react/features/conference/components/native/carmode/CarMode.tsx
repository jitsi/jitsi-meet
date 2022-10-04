/* eslint-disable lines-around-comment */
import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// @ts-ignore
import { IconClose } from '../../../../base/icons';
// @ts-ignore
import JitsiScreen from '../../../../base/modal/components/JitsiScreen';
// @ts-ignore
import { LoadingIndicator, TintedView } from '../../../../base/react';
// @ts-ignore
import { isLocalVideoTrackDesktop } from '../../../../base/tracks';
// @ts-ignore
import HeaderNavigationButton from '../../../../mobile/navigation/components/HeaderNavigationButton';
// @ts-ignore
import { screen } from '../../../../mobile/navigation/routes';
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
const CarMode = ({ navigation }: any): JSX.Element => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const connecting = useSelector(isConnecting);
    const isSharing = useSelector(isLocalVideoTrackDesktop);

    const goBack = useCallback(() => {
        navigation.navigate(screen.conference.main);

        return true;
    }, [ dispatch ]);

    const headerLeft = useCallback(() => {
        if (Platform.OS === 'ios') {
            return (
                <HeaderNavigationButton
                    label = { t('dialog.close') }
                    onPress = { goBack } />
            );
        }

        return (
            <HeaderNavigationButton
                onPress = { goBack }
                src = { IconClose } />
        );
    }, []);

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

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft
        });
    }, [ navigation ]);

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
