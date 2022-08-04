/* eslint-disable lines-around-comment */
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BackHandler,
    View,
    TextInput,
    Platform,
    StyleProp,
    TextStyle,
    ViewStyle
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// @ts-ignore
import { appNavigate } from '../../app/actions.native';
// @ts-ignore
import { setAudioOnly } from '../../base/audio-only/actions';
// @ts-ignore
import { connect } from '../../base/connection/actions.native';
import { IconClose } from '../../base/icons/svg/index';
// @ts-ignore
import JitsiScreen from '../../base/modal/components/JitsiScreen';
// @ts-ignore
import { getLocalParticipant } from '../../base/participants';
// @ts-ignore
import { getFieldValue } from '../../base/react';
// @ts-ignore
import { ASPECT_RATIO_NARROW } from '../../base/responsive-ui';
// @ts-ignore
import { updateSettings } from '../../base/settings';
// @ts-ignore
import BaseTheme from '../../base/ui/components/BaseTheme.native';
import Button from '../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../base/ui/constants';
import { BrandingImageBackground } from '../../dynamic-branding';
// @ts-ignore
import { LargeVideo } from '../../large-video/components';
// @ts-ignore
import HeaderNavigationButton from '../../mobile/navigation/components/HeaderNavigationButton';
// @ts-ignore
import { navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
// @ts-ignore
import { screen } from '../../mobile/navigation/routes';
// @ts-ignore
import AudioMuteButton from '../../toolbox/components/AudioMuteButton';
// @ts-ignore
import VideoMuteButton from '../../toolbox/components/VideoMuteButton';
// @ts-ignore
import { isDisplayNameRequired } from '../functions';
import { PrejoinProps } from '../types';

// @ts-ignore
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

    }, []);

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
                <View style = { styles.formWrapper as StyleProp<ViewStyle> }>
                    <TextInput
                        onChangeText = { onChangeDisplayName }
                        placeholder = { t('dialog.enterDisplayName') }
                        placeholderTextColor = { BaseTheme.palette.text03 }
                        style = { styles.field as StyleProp<TextStyle> }
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
