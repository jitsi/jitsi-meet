import React, { useCallback, useEffect, useState } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import { DEFAULT_ICON } from '../base/icons/svg/constants';
import { IProps } from '../base/toolbox/components/AbstractButton';

import ToolbarButton from './ToolbarButton';

const { api } = window.alwaysOnTop!;

/**
 * Stateless "mute/unmute video" button for the Always-on-Top windows.
 *
 * @param {Partial<IProps>} props - The props of the component.
 * @returns {JSX.Element}
 */
const VideoMuteButton = (props: Partial<IProps>) => {
    const [ videoAvailable, setVideoAvailable ] = useState(false);
    const [ videoMuted, setVideoMutedState ] = useState(true);

    const videoAvailabilityListener = useCallback(({ available }: { available: boolean; }) => {
        setVideoAvailable(available);
    }, []);

    const videoMutedListener = useCallback(({ muted }: { muted: boolean; }) => {
        setVideoMutedState(muted);
    }, []);

    useEffect(() => {
        api.on('videoAvailabilityChanged', videoAvailabilityListener);
        api.on('videoMuteStatusChanged', videoMutedListener);

        Promise.all([
            api.isVideoAvailable(),
            api.isVideoMuted()
        ])
            .then(([ available, muted ]) => {
                setVideoAvailable(available);
                setVideoMutedState(muted);
            })
            .catch(console.error);

        return () => {
            api.removeListener('videoAvailabilityChanged', videoAvailabilityListener);
            api.removeListener('videoMuteStatusChanged', videoMutedListener);
        };
    }, []);

    const onClick = useCallback(() => {
        if (videoAvailable) {
            api.executeCommand('toggleVideo', false, true);
        }
    }, [ videoAvailable ]);

    const icon = videoMuted ? DEFAULT_ICON.IconVideoOff : DEFAULT_ICON.IconVideo;

    return (
        <ToolbarButton
            accessibilityLabel = 'Video mute'
            disabled = { !videoAvailable }
            icon = { icon }
            onClick = { onClick }
            toggled = { videoMuted } />
    );
};

export default VideoMuteButton;
