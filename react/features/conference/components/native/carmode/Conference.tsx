import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, SafeAreaView, View } from 'react-native';
import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { batch, useDispatch, useSelector } from 'react-redux';

import { setAudioOnly } from '../../../../base/audio-only';
import { Container, LoadingIndicator, TintedView } from '../../../../base/react';
import { screen } from '../../../../mobile/navigation/routes';
import { setIsCarmode } from '../../../../video-layout/actions';
import ConferenceTimer from '../../ConferenceTimer';
import { isConnecting } from '../../functions';

import EndMeetingButton from './EndMeetingButton';
import MicrophoneButton from './MicrophoneButton';
import SoundDeviceButton from './SoundDeviceButton';
import TitleBar from './TitleBar';
import styles from './styles';

type Props = {

    /**
     * Callback on component focused.
     * Passes the route name to the embedder.
     */
     onFocused: Function

}

/**
 * Implements the carmode tab.
 *
 * @param { Props } - - The component's props.
 * @returns { JSX.Element} - The carmode tab.
 */
const CarmodeTab = ({ onFocused }: Props): JSX.Element => {
    const isFocused = useIsFocused();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const connecting = useSelector(isConnecting);

    useEffect(() => {
        if (isFocused) {
            batch(() => {
                dispatch(setAudioOnly(true));
                dispatch(setIsCarmode(true));
            });

            onFocused(screen.car);
        }
    }, [ isFocused ]);

    return (
        <Container style = { styles.conference }>
            {/*
                  * The activity/loading indicator goes above everything, except
                  * the toolbox/toolbars and the dialogs.
                  */
                connecting
                && <TintedView>
                    <LoadingIndicator />
                </TintedView>
            }
            <SafeAreaView
                pointerEvents = 'box-none'
                style = { styles.titleBarSafeViewColor }>
                <View style = { styles.titleView }>
                    <Text style = { styles.title }>
                        {t('carmode.labels.title')}
                    </Text>
                </View>
                <View
                    style = { styles.titleBar }>
                    <TitleBar />
                </View>
                <ConferenceTimer textStyle = { styles.roomTimer } />
            </SafeAreaView>
            <MicrophoneButton />
            <SafeAreaView
                pointerEvents = 'box-none'
                style = { styles.bottomContainer }>
                <Text style = { styles.videoStoppedLabel }>
                    {t('carmode.labels.videoStopped')}
                </Text>
                <SoundDeviceButton />
                <EndMeetingButton />
            </SafeAreaView>
        </Container>
    );
};

export default withSafeAreaInsets(CarmodeTab);
