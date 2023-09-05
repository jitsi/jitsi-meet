import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableHighlight, View, ViewStyle } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import i18next, { DEFAULT_LANGUAGE } from '../../../base/i18n/i18next';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowRight } from '../../../base/icons/svg';
import { updateSettings } from '../../../base/settings/actions';
import Switch from '../../../base/ui/components/native/Switch';
import { navigate } from '../../../mobile/navigation/components/settings/SettingsNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

import FormRow from './FormRow';
import FormSection from './FormSection';
import styles from './styles';


const GeneralSection = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const {
        disableSelfView,
        userSelectedSkipPrejoin
    } = useSelector((state: IReduxState) => state['features/base/settings']);

    const showPrejoinPage = !userSelectedSkipPrejoin;

    let showPrejoinSettings = useSelector(
        (state: IReduxState) => state['features/base/config'].prejoinConfig?.enabled);

    const { language = DEFAULT_LANGUAGE } = i18next;

    const onSelfViewToggled = useCallback((enabled?: boolean) =>
        dispatch(updateSettings({ disableSelfView: enabled }))
    , [ dispatch, updateSettings ]);

    const onShowPejoinToggled = useCallback((enabled?: boolean) => {
        dispatch(updateSettings({ userSelectedSkipPrejoin: !enabled }));
    }
    , [ dispatch, updateSettings ]);

    const navigateToLanguageSelect = useCallback(() => {
        navigate(screen.settings.language);
    }, [ navigate, screen ]);

    // TODO:
    // Delete this line when prejoin skipping is available on mobile
    showPrejoinSettings = false;

    return (
        <FormSection>
            <FormRow label = 'videothumbnail.hideSelfView'>
                <Switch
                    checked = { Boolean(disableSelfView) }
                    onChange = { onSelfViewToggled } />
            </FormRow>

            {showPrejoinSettings && <FormRow label = 'prejoin.showScreen'>
                <Switch
                    checked = { showPrejoinPage }
                    onChange = { onShowPejoinToggled } />
            </FormRow>}

            <FormRow label = 'settings.language'>
                <View style = { styles.languageButtonContainer as ViewStyle }>
                    <TouchableHighlight onPress = { navigateToLanguageSelect }>
                        <View style = { styles.languageButton as ViewStyle }>
                            <Text
                                style = { styles.languageText }>{t(`languages:${language}`)}</Text>
                            <Icon
                                size = { 24 }
                                src = { IconArrowRight } />
                        </View>
                    </TouchableHighlight>
                </View>
            </FormRow>
        </FormSection>
    );
};

export default GeneralSection;
