import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import AbstractAudio from '../../base/media/components/AbstractAudio';
import { Audio } from '../../base/media/components/index';
import Button from '../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../base/ui/constants.any';

const TEST_SOUND_PATH = 'sounds/ring.mp3';

/**
 * The type of the React {@code Component} props of {@link AudioOutputPreview}.
 */
interface IProps {

    /**
     * Button className.
     */
    className?: string;

    /**
     * The device id of the audio output device to use.
     */
    deviceId: string;
}

/**
 * React component for playing a test sound through a specified audio device.
 *
 * @param {IProps} props - The component's props.
 * @returns {ReactElement}
 */
const AudioOutputPreview = ({ className, deviceId }: IProps) => {
    const { t } = useTranslation();
    const audioElement = useRef<AbstractAudio | null>(null);

    /**
     * Updates the target output device for playing the test sound.
     *
     * @returns {void}
     */
    const _setAudioSink = useCallback(() => {
        audioElement.current
            && deviceId
            && audioElement.current.setSinkId(deviceId);
    }, [ deviceId ]);

    /**
     * Updates the audio element when the target output device changes.
     */
    useEffect(() => {
        _setAudioSink();
    }, [ _setAudioSink ]);

    /**
     * Sets the ref for the component's audio element so it can be
     * accessed directly.
     *
     * @param {AbstractAudio | null} element - The audio element instance for the component.
     * @returns {void}
     */
    const _audioElementReady = useCallback((element: AbstractAudio | null) => {
        audioElement.current = element;

        _setAudioSink();
    }, [ _setAudioSink ]);

    /**
     * Plays a test sound.
     *
     * @returns {void}
     */
    const _onClick = useCallback(() => {
        audioElement.current?.play();
    }, []);

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     * @returns {void}
     */
    const _onKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            _onClick();
        }
    }, [ _onClick ]);

    return (
        <>
            <Button
                accessibilityLabel = { t('deviceSelection.testAudio') }
                className = { className }
                labelKey = 'deviceSelection.testAudio'
                onClick = { _onClick }
                onKeyPress = { _onKeyPress }
                type = { BUTTON_TYPES.SECONDARY } />
            <Audio
                setRef = { _audioElementReady }
                src = { TEST_SOUND_PATH } />
        </>
    );
};

export default AudioOutputPreview;
