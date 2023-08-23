import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TouchableHighlight, View, ViewStyle } from 'react-native';

import i18next, { DEFAULT_LANGUAGE, LANGUAGES } from '../../../base/i18n/i18next';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { navigate } from '../../../mobile/navigation/components/settings/SettingsNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

import styles from './styles';

const LanguageSelectView = ({ isInWelcomePage }: { isInWelcomePage?: boolean; }) => {
    const { t } = useTranslation();
    const { language: currentLanguage = DEFAULT_LANGUAGE } = i18next;

    const setLanguage = useCallback(language => () => {
        i18next.changeLanguage(language);
        navigate(screen.settings.main);
    }, [ i18next ]);

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
