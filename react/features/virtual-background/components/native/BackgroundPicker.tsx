import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import VideoTrack from '../../../base/media/components/native/VideoTrack';
import { VIDEO_TYPE } from '../../../base/media/constants';
import { getLocalVideoTrack } from '../../../base/tracks/functions.any';
import useBackgroundSelection from '../../useBackgroundSelection';

import BackgroundOption from './BackgroundOption';
import styles from './styles';

/** Built-in options available in the background picker. */
const BASIC_OPTIONS = [
    { id: 'none', title: 'virtualBackground.none' },
    { id: 'blur-light', title: 'virtualBackground.slightBlur' },
    { id: 'blur', title: 'virtualBackground.blur' }
];

/**
 * Renders the native background picker and its camera preview.
 *
 * @returns {JSX.Element} The native background picker.
 */
export default function BackgroundPicker() {
    const { t } = useTranslation();
    const cameraTrack = useSelector((state: IReduxState) => getLocalVideoTrack(state['features/base/tracks']));
    const { background, disabled, error, loading, pending, select } = useBackgroundSelection();
    const options = [ ...BASIC_OPTIONS, ...(background?.presets ?? []) ];
    const cameraOn = cameraTrack?.videoType === VIDEO_TYPE.CAMERA && !cameraTrack.muted;
    const previewPreset = background?.presets.find(item => item.id === background.choice);

    return (
        <BottomSheet>
            <View style = { styles.content }>
                <Text style = { styles.title }>{ t('virtualBackground.title') }</Text>
                { !background
                    ? (
                        <View
                            accessibilityLabel = { t(loading ? 'virtualBackground.pleaseWait' : error) }
                            accessibilityRole = { loading ? 'progressbar' : 'alert' }
                            style = { styles.loadingArea }>
                            { loading && <ActivityIndicator /> }
                            <Text style = { styles.helper }>
                                { t(loading ? 'virtualBackground.pleaseWait' : error) }
                            </Text>
                        </View>
                    )
                    : (
                        <>
                            <View style = { styles.preview }>
                                { cameraOn
                                    ? (
                                        <VideoTrack
                                            videoTrack = { cameraTrack }
                                            zOrder = { 1 } />
                                    )
                                    : previewPreset
                                        ? (
                                            <Image
                                                resizeMode = 'cover'
                                                source = {{ uri: previewPreset.uri }}
                                                style = { styles.previewImage } />
                                        )
                                        : (
                                            <View style = { styles.placeholder }>
                                                <Text style = { styles.helper }>
                                                    { t('virtualBackground.nativeCameraOff') }
                                                </Text>
                                            </View>
                                        ) }
                            </View>
                            { background.status === 'unavailable' && (
                                <Text
                                    accessibilityRole = 'alert'
                                    style = { styles.error }>
                                    { t('virtualBackground.nativeUnavailable') }
                                </Text>
                            ) }
                            { !background.sessionId && (
                                <Text style = { styles.error }>
                                    { t('virtualBackground.nativeWaitingForMeeting') }
                                </Text>
                            ) }
                            { Boolean(error) && (
                                <Text
                                    accessibilityRole = 'alert'
                                    style = { styles.error }>
                                    { t(error) }
                                </Text>
                            ) }
                            <View
                                accessibilityRole = 'radiogroup'
                                style = { styles.grid }>
                                { options.map(option => (
                                    <BackgroundOption
                                        choice = { background.choice }
                                        disabled = { disabled }
                                        key = { option.id }
                                        onSelect = { select }
                                        option = { option } />
                                )) }
                            </View>
                        </>
                    ) }
                { pending && (
                    <View
                        accessibilityLabel = { t('virtualBackground.pleaseWait') }
                        accessibilityRole = 'progressbar'
                        style = { styles.loadingOverlay }>
                        <ActivityIndicator />
                        <Text style = { styles.helper }>{ t('virtualBackground.pleaseWait') }</Text>
                    </View>
                ) }
            </View>
        </BottomSheet>
    );
}
