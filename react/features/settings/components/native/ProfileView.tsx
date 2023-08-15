import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../../base/participants/functions';
import { updateSettings } from '../../../base/settings/actions';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { navigate } from '../../../mobile/navigation/components/settings/SettingsNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

import FormSection from './FormSection';
import { AVATAR_SIZE } from './constants';
import styles from './styles';

const ProfileView = ({ isInWelcomePage }: { isInWelcomePage?: boolean; }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const { displayName: reduxDisplayName, email: reduxEmail } = useSelector(
        (state: IReduxState) => state['features/base/settings']
    );
    const participant = useSelector((state: IReduxState) => getLocalParticipant(state));

    const [ displayName, setDisplayName ] = useState(reduxDisplayName);
    const [ email, setEmail ] = useState(reduxEmail);

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
