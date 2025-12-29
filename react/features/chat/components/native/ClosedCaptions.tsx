import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import Icon from '../../../base/icons/components/Icon';
import { IconSubtitles } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { StyleType } from '../../../base/styles/functions.any';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
import { ChatTabs } from '../../constants';
import AbstractClosedCaptions, { AbstractProps } from '../AbstractClosedCaptions';

import { closedCaptionsStyles } from './styles';

/**
 * Component that displays the closed captions interface.
 *
 * @returns {JSX.Element} - The ClosedCaptions component.
 */
const ClosedCaptions = ({
    canStartSubtitles,
    isButtonPressed,
    isTranscribing,
    startClosedCaptions
}: AbstractProps): JSX.Element => {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const isCCTabFocused = useSelector((state: IReduxState) => state['features/chat'].focusedTab === ChatTabs.CLOSED_CAPTIONS);

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
        if (isTranscribing) {
            return (
                <View style = { closedCaptionsStyles.placeholderContainer as ViewStyle }>
                    { /* Placeholder for future LanguageSelector and SubtitlesMessagesContainer */ }
                </View>
            );
        }

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
