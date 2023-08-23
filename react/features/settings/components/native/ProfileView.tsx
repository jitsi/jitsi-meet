import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { login, logout } from '../../../authentication/actions.native';
import Avatar from '../../../base/avatar/components/Avatar';
import { IconArrowLeft } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../../base/participants/functions';
import { updateSettings } from '../../../base/settings/actions';
import BaseThemeNative from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import HeaderNavigationButton
    from '../../../mobile/navigation/components/HeaderNavigationButton';
import {
    goBack,
    navigate
} from '../../../mobile/navigation/components/settings/SettingsNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

import FormSection from './FormSection';
import { AVATAR_SIZE } from './constants';
import styles from './styles';


const ProfileView = ({ isInWelcomePage }: {
    isInWelcomePage?: boolean;
}) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const { displayName: reduxDisplayName, email: reduxEmail } = useSelector(
        (state: IReduxState) => state['features/base/settings']
    );
    const participant = useSelector((state: IReduxState) => getLocalParticipant(state));

    const [ displayName, setDisplayName ] = useState(reduxDisplayName);
    const [ email, setEmail ] = useState(reduxEmail);

    const { authLogin: isAutenticated } = useSelector((state: IReduxState) => state['features/base/conference']);

    const onDisplayNameChanged = useCallback(newDisplayName => {
        setDisplayName(newDisplayName);
    }, [ setDisplayName ]);

    const onEmailChanged = useCallback(newEmail => {
        setEmail(newEmail);
    }, [ setEmail ]);

    const onApplySettings = useCallback(() => {
        dispatch(updateSettings({
            displayName,
            email
        }));

        navigate(screen.settings.main);
    },
    [ dispatch, updateSettings, email, displayName ]);

    const onLogin = useCallback(() => {
        dispatch(login());
    }, [ dispatch ]);

    const onLogout = useCallback(() => {
        dispatch(logout());
    }, [ dispatch ]);

    const headerLeft = () => (
        <HeaderNavigationButton
            color = { BaseThemeNative.palette.link01 }
            onPress = { goBack }
            src = { IconArrowLeft }
            style = { styles.backBtn }
            twoActions = { true } />
    );

    const headerRight = () => {
        if (isAutenticated) {
            return (
                <HeaderNavigationButton
                    label = { t('toolbar.logout') }
                    onPress = { onLogout }
                    style = { styles.logBtn }
                    twoActions = { true } />
            );
        }

        return (
            <HeaderNavigationButton
                label = { t('toolbar.login') }
                onPress = { onLogin }
                style = { styles.logBtn }
                twoActions = { true } />
        );
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft,
            headerRight: !isInWelcomePage && headerRight
        });
    }, [ navigation ]);

    return (
        <JitsiScreen
            disableForcedKeyboardDismiss = { true }

            // @ts-ignore
            safeAreaInsets = { [ !isInWelcomePage && 'bottom', 'left', 'right' ].filter(Boolean) }
            style = { styles.settingsViewContainer }>
            <ScrollView
                bounces = { isInWelcomePage }
                contentContainerStyle = { styles.profileView as ViewStyle }>
                <View>
                    <View style = { styles.avatarContainer as ViewStyle }>
                        <Avatar
                            participantId = { participant?.id }
                            size = { AVATAR_SIZE } />
                    </View>
                    <FormSection>
                        <Input
                            customStyles = {{ container: styles.customContainer }}
                            label = { t('settingsView.displayName') }
                            onChange = { onDisplayNameChanged }
                            placeholder = { t('settingsView.displayNamePlaceholderText') }
                            textContentType = { 'name' } // iOS only
                            value = { displayName ?? '' } />
                        <Input
                            autoCapitalize = 'none'
                            customStyles = {{ container: styles.customContainer }}
                            keyboardType = { 'email-address' }
                            label = { t('settingsView.email') }
                            onChange = { onEmailChanged }
                            placeholder = { t('settingsView.emailPlaceholderText') }
                            textContentType = { 'emailAddress' } // iOS only
                            value = { email ?? '' } />
                        <Text style = { styles.gavatarMessageContainer }>
                            { t('settingsView.gavatarMessage') }
                        </Text>
                    </FormSection>
                </View>
                <Button
                    accessibilityLabel = { t('settingsView.apply') }
                    labelKey = { 'settingsView.apply' }
                    onClick = { onApplySettings }
                    style = { styles.applyProfileSettingsButton }
                    type = { BUTTON_TYPES.PRIMARY } />
            </ScrollView>
        </JitsiScreen>

    );
};

export default ProfileView;
