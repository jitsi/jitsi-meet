import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableHighlight, View, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import i18next, { DEFAULT_LANGUAGE, LANGUAGES } from '../../../base/i18n/i18next';
import { IconArrowLeft } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import BaseThemeNative from '../../../base/ui/components/BaseTheme.native';
import HeaderNavigationButton from '../../../mobile/navigation/components/HeaderNavigationButton';
import { goBack, navigate } from '../../../mobile/navigation/components/settings/SettingsNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

import styles from './styles';

const LanguageSelectView = ({ isInWelcomePage }: { isInWelcomePage?: boolean; }) => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);
    const { language: currentLanguage = DEFAULT_LANGUAGE } = i18next;

    const setLanguage = useCallback(language => () => {
        i18next.changeLanguage(language);
        conference?.setTranscriptionLanguage(language);
        navigate(screen.settings.main);
    }, [ conference, i18next ]);

    const headerLeft = () => (
        <HeaderNavigationButton
            color = { BaseThemeNative.palette.link01 }
            onPress = { goBack }
            src = { IconArrowLeft }
            style = { styles.backBtn }
            twoActions = { true } />
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft
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
                {
                    LANGUAGES.map(language => (
                        <TouchableHighlight
                            disabled = { currentLanguage === language }
                            key = { language }
                            onPress = { setLanguage(language) }>
                            <View
                                style = { styles.languageOption as ViewStyle }>
                                <Text
                                    style = { [
                                        styles.text,
                                        styles.fieldLabelText,
                                        currentLanguage === language && styles.selectedLanguage ] }>
                                    { t(`languages:${language}`) }
                                </Text>
                            </View>
                        </TouchableHighlight>
                    ))
                }
            </ScrollView>
        </JitsiScreen>
    );
};

export default LanguageSelectView;
