import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useDispatch, useSelector, useStore } from 'react-redux';

import { connect } from '../../base/connection/actions.native';
import { IconClose } from '../../base/icons';
import JitsiScreen from '../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../base/participants';
import { getFieldValue } from '../../base/react';
import { ASPECT_RATIO_NARROW } from '../../base/responsive-ui';
import { updateSettings } from '../../base/settings';
import { LargeVideo } from '../../large-video/components';
import HeaderNavigationButton from '../../mobile/navigation/components/HeaderNavigationButton';
import { goBackToRoot, navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
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
    const store = useStore();
    const state = store.getState();
    const localParticipant = useSelector(state => getLocalParticipant(state));
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
        navigateRoot(screen.conference.root);
        dispatch(connect());
    }, [ dispatch ]);

    const goBack = useCallback(() => {
        goBackToRoot(state, dispatch);
    }, [ dispatch ]);

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
            style = { contentWrapperStyles }>
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
        </JitsiScreen>
    );
};

export default Prejoin;
