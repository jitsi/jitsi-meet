import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BackHandler,
    View,
    TextInput,
    Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { appNavigate } from '../../app/actions.native';
import { setAudioOnly } from '../../base/audio-only/actions';
import { connect } from '../../base/connection/actions.native';
import { IconClose } from '../../base/icons';
import JitsiScreen from '../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../base/participants';
import { getFieldValue } from '../../base/react';
import Button from '../../base/react/components/native/Button';
import { BUTTON_TYPES } from '../../base/react/constants';
import { ASPECT_RATIO_NARROW } from '../../base/responsive-ui';
import { updateSettings } from '../../base/settings';
import BaseTheme from '../../base/ui/components/BaseTheme.native';
import { BrandingImageBackground } from '../../dynamic-branding';
import { LargeVideo } from '../../large-video/components';
import HeaderNavigationButton from '../../mobile/navigation/components/HeaderNavigationButton';
import { navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';
import AudioMuteButton from '../../toolbox/components/AudioMuteButton';
import VideoMuteButton from '../../toolbox/components/VideoMuteButton';
import { isDisplayNameRequired } from '../functions';
import { PrejoinProps } from '../types';
import styles from './styles';


const Prejoin: React.FC<PrejoinProps> = ({ navigation }: PrejoinProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const aspectRatio = useSelector(
        (state: any) => state['features/base/responsive-ui']?.aspectRatio
    );
    const localParticipant = useSelector(state => getLocalParticipant(state));
    const isDisplayNameMandatory = useSelector(state => isDisplayNameRequired(state));
    const participantName = localParticipant?.name;
    const [ displayName, setDisplayName ]
        = useState(participantName || '');
    const onChangeDisplayName = useCallback(event => {
        const fieldValue = getFieldValue(event);

        setDisplayName(fieldValue);
        dispatch(updateSettings({
            displayName: fieldValue
        }));
    }, [ displayName ]);

    const onJoin = useCallback(() => {
        dispatch(connect());
        navigateRoot(screen.conference.root);
    }, [ dispatch ]);

    const onJoinLowBandwidth = useCallback(() => {
        dispatch(setAudioOnly(true));
        onJoin();
    }, [ dispatch ]);

    const goBack = useCallback(() => {
        dispatch(appNavigate(undefined));

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

    const { PRIMARY, SECONDARY } = BUTTON_TYPES;
    const joinButtonDisabled = !displayName && isDisplayNameMandatory;

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', goBack);

        return () => BackHandler.removeEventListener('hardwareBackPress', goBack);

    }, [ ]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft
        });
    }, [ navigation ]);

    let contentWrapperStyles;
    let contentContainerStyles;
    let largeVideoContainerStyles;
    let toolboxContainerStyles;

    if (aspectRatio === ASPECT_RATIO_NARROW) {
        contentWrapperStyles = styles.contentWrapper;
        contentContainerStyles = styles.contentContainer;
        largeVideoContainerStyles = styles.largeVideoContainer;
        toolboxContainerStyles = styles.toolboxContainer;
    } else {
        contentWrapperStyles = styles.contentWrapperWide;
        contentContainerStyles = styles.contentContainerWide;
        largeVideoContainerStyles = styles.largeVideoContainerWide;
        toolboxContainerStyles = styles.toolboxContainerWide;
    }


    return (
        <JitsiScreen
            safeAreaInsets = { [ 'left' ] }
            style = { contentWrapperStyles }>
            <BrandingImageBackground />
            <View style = { largeVideoContainerStyles }>
                <LargeVideo />
            </View>
            <View style = { contentContainerStyles }>
                <View style = { styles.formWrapper }>
                    <TextInput
                        onChangeText = { onChangeDisplayName }
                        placeholder = { t('dialog.enterDisplayName') }
                        placeholderTextColor = { BaseTheme.palette.text03 }
                        style = { styles.field }
                        value = { displayName } />
                    <Button
                        accessibilityLabel = 'prejoin.joinMeeting'
                        disabled = { joinButtonDisabled }
                        label = 'prejoin.joinMeeting'
                        onPress = { onJoin }
                        style = { styles.prejoinButton }
                        type = { PRIMARY } />
                    <Button
                        accessibilityLabel = 'prejoin.joinMeetingInLowBandwidthMode'
                        label = 'prejoin.joinMeetingInLowBandwidthMode'
                        onPress = { onJoinLowBandwidth }
                        style = { styles.prejoinButton }
                        type = { SECONDARY } />
                </View>
                <View style = { toolboxContainerStyles }>
                    <AudioMuteButton
                        styles = { styles.buttonStylesBorderless } />
                    <VideoMuteButton
                        styles = { styles.buttonStylesBorderless } />
                </View>
            </View>
        </JitsiScreen>
    );
};

export default Prejoin;
