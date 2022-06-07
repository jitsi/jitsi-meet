import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, TouchableOpacity, TextInput, Platform } from 'react-native';
import { batch, useDispatch, useSelector } from 'react-redux';

import { connect } from '../../base/connection/actions.native';
import { IconClose } from '../../base/icons';
import JitsiScreen from '../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../base/participants';
import { getFieldValue } from '../../base/react';
import { ASPECT_RATIO_NARROW } from '../../base/responsive-ui';
import { updateSettings } from '../../base/settings';
import { createDesiredLocalTracks } from '../../base/tracks';
import { LargeVideo } from '../../large-video/components';
import { _sendReadyToClose } from '../../mobile/external-api/functions';
import HeaderNavigationButton from '../../mobile/navigation/components/HeaderNavigationButton';
import { isWelcomePageAppEnabled } from '../../mobile/navigation/components/welcome/functions';
import { navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';
import AudioMuteButton from '../../toolbox/components/AudioMuteButton';
import VideoMuteButton from '../../toolbox/components/VideoMuteButton';

import styles from './styles';


interface Props {
    navigation: any;
}

const Prejoin: React.FC = ({ navigation }: Props) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const aspectRatio = useSelector(
        (state: any) => state['features/base/responsive-ui']?.aspectRatio
    );
    const localParticipant = useSelector((state: any) => getLocalParticipant(state));

    const isWelcomePageEnabled = useSelector((state: any) => isWelcomePageAppEnabled(state));
    const participantName = localParticipant?.name;
    const [ displayName, setDisplayName ]
        = useState(participantName || '');
    const onChangeDisplayName = useCallback(event => {
        const fieldValue = getFieldValue(event);

        setDisplayName(fieldValue);
        dispatch(updateSettings({
            displayName: fieldValue
        }));
    }, [ onChangeDisplayName ]);

    const onJoin = useCallback(() => {
        navigateRoot(screen.conference.root);
        batch(() => {
            dispatch(createDesiredLocalTracks());
            dispatch(connect());
        });
    }, [ dispatch ]);

    const goBack = useCallback(() => {
        if (isWelcomePageEnabled) {
            navigateRoot(screen.root);
        } else {
            _sendReadyToClose(dispatch);
        }
    }, [ dispatch, isWelcomePageEnabled ]);

    let contentStyles;
    let largeVideoContainerStyles;
    let contentContainerStyles;
    let toolboxContainerStyles;

    if (aspectRatio === ASPECT_RATIO_NARROW) {
        contentContainerStyles = styles.contentContainer;
        largeVideoContainerStyles = styles.largeVideoContainer;
        toolboxContainerStyles = styles.toolboxContainer;
    } else {
        contentContainerStyles = styles.contentContainerWide;
        contentStyles = styles.contentWide;
        largeVideoContainerStyles = styles.largeVideoContainerWide;
        toolboxContainerStyles = styles.toolboxContainerWide;
    }

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

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft
        });
    }, [ navigation ]);

    return (
        <JitsiScreen
            safeAreaInsets = { [ 'right' ] }
            style = { styles.contentWrapper }>
            <View style = { contentStyles }>
                <View style = { largeVideoContainerStyles }>
                    <LargeVideo />
                </View>
                <View style = { contentContainerStyles }>
                    <View style = { styles.formWrapper }>
                        <TextInput
                            onChangeText = { onChangeDisplayName }
                            placeholder = { t('dialog.enterDisplayName') }
                            style = { styles.field }
                            value = { displayName } />
                        <TouchableOpacity
                            onPress = { onJoin }
                            style = { [
                                styles.button,
                                styles.primaryButton
                            ] }>
                            <Text style = { styles.primaryButtonText }>
                                { t('prejoin.joinMeeting') }
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style = { toolboxContainerStyles }>
                        <AudioMuteButton
                            styles = { styles.buttonStylesBorderless } />
                        <VideoMuteButton
                            styles = { styles.buttonStylesBorderless } />
                    </View>
                </View>
            </View>
        </JitsiScreen>
    );
};

export default Prejoin;
