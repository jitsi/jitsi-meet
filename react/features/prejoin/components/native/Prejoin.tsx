/* eslint-disable lines-around-comment  */

import { useIsFocused } from '@react-navigation/native';
// @ts-ignore
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    BackHandler,
    Platform,
    StyleProp,
    Text,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { appNavigate } from '../../../app/actions.native';
import { IReduxState } from '../../../app/types';
import { setAudioOnly } from '../../../base/audio-only/actions';
import { getConferenceName } from '../../../base/conference/functions';
import { connect } from '../../../base/connection/actions.native';
import { IconCloseLarge } from '../../../base/icons/svg';
// @ts-ignore
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../../base/participants/functions';
import { getFieldValue } from '../../../base/react/functions';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { updateSettings } from '../../../base/settings/actions';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { BrandingImageBackground } from '../../../dynamic-branding/components/native';
// @ts-ignore
import LargeVideo from '../../../large-video/components/LargeVideo.native';
// @ts-ignore
import HeaderNavigationButton from '../../../mobile/navigation/components/HeaderNavigationButton';
// @ts-ignore
import { navigateRoot } from '../../../mobile/navigation/rootNavigationContainerRef';
// @ts-ignore
import { screen } from '../../../mobile/navigation/routes';
// @ts-ignore
import AudioMuteButton from '../../../toolbox/components/AudioMuteButton';
// @ts-ignore
import VideoMuteButton from '../../../toolbox/components/VideoMuteButton';
import { isDisplayNameRequired } from '../../functions';
import { IPrejoinProps } from '../../types';
// @ts-ignore
import styles from '../styles';


const Prejoin: React.FC<IPrejoinProps> = ({ navigation }: IPrejoinProps) => {
    const dispatch = useDispatch();
    const isFocused = useIsFocused();
    const { t } = useTranslation();
    const aspectRatio = useSelector(
        (state: IReduxState) => state['features/base/responsive-ui']?.aspectRatio
    );
    const localParticipant = useSelector((state: IReduxState) => getLocalParticipant(state));
    const isDisplayNameMandatory = useSelector((state: IReduxState) => isDisplayNameRequired(state));
    const roomName = useSelector((state: IReduxState) => getConferenceName(state));
    const participantName = localParticipant?.name;
    const [ displayName, setDisplayName ]
        = useState(participantName || '');
    const [ isJoining, setIsJoining ]
        = useState(false);
    const onChangeDisplayName = useCallback(event => {
        const fieldValue = getFieldValue(event);

        setDisplayName(fieldValue);
        dispatch(updateSettings({
            displayName: fieldValue
        }));
    }, [ displayName ]);

    const onJoin = useCallback(() => {
        setIsJoining(true);
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

    const headerLeft = () => {
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
                src = { IconCloseLarge } />
        );
    };

    const { PRIMARY, TERTIARY } = BUTTON_TYPES;
    const joinButtonDisabled = isJoining || (!displayName && isDisplayNameMandatory);

    useEffect(() => {
        BackHandler.addEventListener('hardwareBackPress', goBack);

        return () => BackHandler.removeEventListener('hardwareBackPress', goBack);

    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft,
            headerTitle: t('prejoin.joinMeeting')
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
            addBottomPadding = { false }
            safeAreaInsets = { [ 'left', 'right' ] }
            style = { contentWrapperStyles }>
            <BrandingImageBackground />
            {
                isFocused
                && <View style = { largeVideoContainerStyles }>
                    <View style = { styles.displayRoomNameBackdrop as StyleProp<TextStyle> }>
                        <Text
                            numberOfLines = { 1 }
                            style = { styles.preJoinRoomName as StyleProp<TextStyle> }>
                            { roomName }
                        </Text>
                    </View>
                    <LargeVideo />
                </View>
            }
            <View style = { contentContainerStyles }>
                <View style = { toolboxContainerStyles }>
                    <AudioMuteButton
                        // @ts-ignore
                        styles = { styles.buttonStylesBorderless } />
                    <VideoMuteButton
                        // @ts-ignore
                        styles = { styles.buttonStylesBorderless } />
                </View>
                <View style = { styles.formWrapper as StyleProp<ViewStyle> }>
                    <Input
                        // @ts-ignore
                        customStyles = {{ input: styles.customInput }}
                        onChange = { onChangeDisplayName }
                        placeholder = { t('dialog.enterDisplayName') }
                        value = { displayName } />
                    <Button
                        accessibilityLabel = 'prejoin.joinMeeting'
                        disabled = { joinButtonDisabled }
                        labelKey = 'prejoin.joinMeeting'
                        onClick = { onJoin }
                        style = { styles.joinButton }
                        type = { PRIMARY } />
                    <Button
                        accessibilityLabel = 'prejoin.joinMeetingInLowBandwidthMode'
                        disabled = { joinButtonDisabled }
                        labelKey = 'prejoin.joinMeetingInLowBandwidthMode'
                        labelStyle = { styles.joinLowBandwidthLabel }
                        onClick = { onJoinLowBandwidth }
                        type = { TERTIARY } />
                </View>
            </View>
        </JitsiScreen>
    );
};

export default Prejoin;
