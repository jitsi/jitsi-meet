import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableHighlight, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowRight, IconSubtitles } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { StyleType } from '../../../base/styles/functions.any';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { ChatTabs } from '../../constants';
import AbstractClosedCaptions, { AbstractProps } from '../AbstractClosedCaptions';

import { SubtitlesMessagesContainer } from './SubtitlesMessagesContainer';
import { closedCaptionsStyles } from './styles';

/**
 * Component that displays the closed captions interface.
 *
 * @returns {JSX.Element} - The ClosedCaptions component.
 */
const ClosedCaptions = ({
    canStartSubtitles,
    filteredSubtitles,
    groupedSubtitles,
    isButtonPressed,
    isTranscribing,
    startClosedCaptions
}: AbstractProps): JSX.Element => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const isCCTabFocused = useSelector((state: IReduxState) => state['features/chat'].focusedTab === ChatTabs.CLOSED_CAPTIONS);
    const selectedLanguage = useSelector((state: IReduxState) => state['features/subtitles']._language);
    const navigateToLanguageSelect = useCallback(() => {
        navigate(screen.conference.subtitles);
    }, [ navigation, screen ]);
    const isAsyncTranscriptionEnabled = useSelector((state: IReduxState) =>
        state['features/base/conference'].conference?.getMetadataHandler()?.getMetadata()?.asyncTranscription);

    useEffect(() => {
        navigation?.setOptions({
            tabBarLabel: () => (
                <TabBarLabelCounter
                    isFocused = { isCCTabFocused }
                    label = { t('chat.tabs.closedCaptions') } />
            )
        });
    }, [ isCCTabFocused, navigation, t ]);

    const getContentContainerStyle = () => {
        if (isTranscribing) {
            return closedCaptionsStyles.transcribingContainer as StyleType;
        }

        return closedCaptionsStyles.emptyContentContainer as StyleType;
    };

    const renderContent = () => {
        if (!isTranscribing) {
            if (canStartSubtitles) {
                return (
                    <View style = { closedCaptionsStyles.emptyContent as ViewStyle }>
                        <Button
                            accessibilityLabel = { t('closedCaptionsTab.startClosedCaptionsButton') }
                            disabled = { isButtonPressed }
                            labelKey = 'closedCaptionsTab.startClosedCaptionsButton'
                            onClick = { startClosedCaptions }
                            type = { BUTTON_TYPES.PRIMARY } />
                    </View>
                );
            }

            return (
                <View style = { closedCaptionsStyles.emptyContent as ViewStyle }>
                    <Icon
                        color = { BaseTheme.palette.icon03 }
                        size = { 100 }
                        src = { IconSubtitles } />
                    <Text style = { [ closedCaptionsStyles.emptyStateText, { marginTop: BaseTheme.spacing[3] } ] }>
                        { t('closedCaptionsTab.emptyState') }
                    </Text>
                </View>
            );
        }

        return (
            <>
                {
                    // Hide the "Translate to" option when asyncTranscription is enabled
                    !isAsyncTranscriptionEnabled && <View style = { closedCaptionsStyles.languageButtonContainer as ViewStyle }>
                        <Text style = { closedCaptionsStyles.languageButtonText }>{ t('transcribing.translateTo') }:</Text>
                        <TouchableHighlight onPress = { navigateToLanguageSelect }>
                            <View style = { closedCaptionsStyles.languageButtonContent as ViewStyle }>
                                <Text style = { closedCaptionsStyles.languageButtonText }>{ t(selectedLanguage ?? 'transcribing.subtitlesOff') }</Text>
                                <Icon
                                    size = { 24 }
                                    src = { IconArrowRight } />
                            </View>
                        </TouchableHighlight>
                    </View>
                }
                <View style = { closedCaptionsStyles.messagesContainer as ViewStyle }>
                    <SubtitlesMessagesContainer
                        groups = { groupedSubtitles }
                        messages = { filteredSubtitles } />
                </View>
            </>
        );
    };

    return (
        <JitsiScreen
            contentContainerStyle = { getContentContainerStyle() }
            disableForcedKeyboardDismiss = { true }
            hasExtraHeaderHeight = { true }
            style = { closedCaptionsStyles.container as StyleType }>
            { renderContent() }
        </JitsiScreen>
    );
};

export default AbstractClosedCaptions(ClosedCaptions);
