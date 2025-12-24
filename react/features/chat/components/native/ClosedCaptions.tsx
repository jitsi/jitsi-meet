import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openDialog } from '../../../base/dialog/actions';
import Icon from '../../../base/icons/components/Icon';
import { IconSubtitles } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { StyleType } from '../../../base/styles/functions.any';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';
import Button from '../../../base/ui/components/native/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { TabBarLabelCounter } from '../../../mobile/navigation/components/TabBarLabelCounter';
// @ts-ignore
import { StartRecordingDialog } from '../../../recording/components/Recording';
import { setRequestingSubtitles } from '../../../subtitles/actions.any';
import { canStartSubtitles } from '../../../subtitles/functions.any';
import { isTranscribing } from '../../../transcribing/functions';
import { ChatTabs } from '../../constants';

import { closedCaptionsStyles } from './styles';

/**
 * Component that displays the closed captions interface.
 *
 * @returns {JSX.Element} - The ClosedCaptions component.
 */
export default function ClosedCaptions() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { t } = useTranslation();
    const _isTranscribing = useSelector(isTranscribing);
    const _canStartSubtitles = useSelector(canStartSubtitles);
    const [ isButtonPressed, setButtonPressed ] = useState(false);
    const subtitlesError = useSelector((state: IReduxState) => state['features/subtitles']._hasError);
    const isAsyncTranscriptionEnabled = useSelector((state: IReduxState) =>
        state['features/base/conference'].conference?.getMetadataHandler()?.getMetadata()?.asyncTranscription);
    const isCCTabFocused = useSelector((state: IReduxState) => state['features/chat'].focusedTab === ChatTabs.CLOSED_CAPTIONS);

    useEffect(() => {
        navigation?.setOptions({
            tabBarLabel: () => (
                <TabBarLabelCounter
                    isFocused = { isCCTabFocused }
                    label = { t('chat.tabs.closedCaptions') } />
            )
        });
    }, [ isCCTabFocused ]);

    const startClosedCaptions = useCallback(() => {
        if (isAsyncTranscriptionEnabled) {
            dispatch(openDialog('StartRecordingDialog', StartRecordingDialog, {
                recordAudioAndVideo: false
            }));
        } else {
            if (isButtonPressed) {
                return;
            }
            dispatch(setRequestingSubtitles(true, false, null));
            setButtonPressed(true);
        }
    }, [ isAsyncTranscriptionEnabled, dispatch, isButtonPressed ]);

    useEffect(() => {
        if (subtitlesError && isButtonPressed && !isAsyncTranscriptionEnabled) {
            setButtonPressed(false);
        }
    }, [ subtitlesError, isButtonPressed, isAsyncTranscriptionEnabled ]);

    useEffect(() => {
        if (isButtonPressed && !isAsyncTranscriptionEnabled && !_isTranscribing) {
            setButtonPressed(false);
        }
    }, [ isButtonPressed, isAsyncTranscriptionEnabled, _isTranscribing ]);

    const getContentContainerStyle = () => {
        if (_isTranscribing) {
            return closedCaptionsStyles.transcribingContainer as StyleType;
        }

        return closedCaptionsStyles.emptyContentContainer as StyleType;
    };

    const renderContent = () => {
        if (_isTranscribing) {
            return (
                <View style = { closedCaptionsStyles.placeholderContainer as ViewStyle }>
                    { /* Placeholder for future LanguageSelector and SubtitlesMessagesContainer */ }
                </View>
            );
        }

        if (_canStartSubtitles) {
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
}
