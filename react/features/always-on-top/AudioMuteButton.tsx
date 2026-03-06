import React, { useCallback, useEffect, useState } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)

import { DEFAULT_ICON } from '../base/icons/svg/constants';
import { IProps } from '../base/toolbox/components/AbstractButton';

import ToolbarButton from './ToolbarButton';

const { api } = window.alwaysOnTop!;

/**
 * Stateless "mute/unmute audio" button for the Always-on-Top windows.
 *
 * @param {Partial<IProps>} props - The props of the component.
 * @returns {JSX.Element}
 */
const AudioMuteButton = (props: Partial<IProps>) => {
    const [ audioAvailable, setAudioAvailable ] = useState(false);
    const [ audioMuted, setAudioMutedState ] = useState(true);

    const audioAvailabilityListener = useCallback(({ available }: { available: boolean; }) => {
        setAudioAvailable(available);
    }, []);

    const audioMutedListener = useCallback(({ muted }: { muted: boolean; }) => {
        setAudioMutedState(muted);
    }, []);

    useEffect(() => {
        api.on('audioAvailabilityChanged', audioAvailabilityListener);
        api.on('audioMuteStatusChanged', audioMutedListener);

        Promise.all([
            api.isAudioAvailable(),
            api.isAudioMuted(),
            api.isAudioDisabled?.() || Promise.resolve(false)
        ])
            .then(([ available, muted, disabled ]) => {
                setAudioAvailable(available && !disabled);
                setAudioMutedState(muted);
            })
            .catch(console.error);

        return () => {
            api.removeListener('audioAvailabilityChanged', audioAvailabilityListener);
            api.removeListener('audioMuteStatusChanged', audioMutedListener);
        };
    }, []);

    const onClick = useCallback(() => {
        if (audioAvailable) {
            api.executeCommand('toggleAudio');
        }
    }, [ audioAvailable ]);

    const icon = audioMuted ? DEFAULT_ICON.IconMicSlash : DEFAULT_ICON.IconMic;

    return (
        <ToolbarButton
            accessibilityLabel = 'Audio mute'
            disabled = { !audioAvailable }
            icon = { icon }
            onClick = { onClick }
            toggled = { audioMuted } />
    );
};

export default AudioMuteButton;
