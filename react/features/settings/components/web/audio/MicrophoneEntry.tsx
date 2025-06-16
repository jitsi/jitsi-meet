import React, { useCallback, useEffect, useRef, useState } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../../base/icons/components/Icon';
import { IconCheck, IconExclamationSolid } from '../../../../base/icons/svg';
import JitsiMeetJS from '../../../../base/lib-jitsi-meet/_';
import ContextMenuItem from '../../../../base/ui/components/web/ContextMenuItem';
import { TEXT_OVERFLOW_TYPES } from '../../../../base/ui/constants.any';

import Meter from './Meter';

const JitsiTrackEvents = JitsiMeetJS.events.track;

interface IProps {

    /**
     * The text for this component.
     */
    children: string;

    /**
     * The deviceId of the microphone.
     */
    deviceId: string;

    /**
     * Flag indicating if there is a problem with the device.
     */
    hasError?: boolean;

    /**
     * Flag indicating if there is a problem with the device.
     */
    index?: number;

    /**
     * Flag indicating the selection state.
     */
    isSelected: boolean;

    /**
     * The audio track for the current entry.
     */
    jitsiTrack: any;

    /**
     * The id for the label, that contains the item text.
     */
    labelId?: string;

    /**
     * The length of the microphone list.
     */
    length: number;


    /**
    * Used to decide whether to listen to audio level changes.
    */
    measureAudioLevels: boolean;

    /**
     * Click handler for component.
     */
    onClick: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            position: 'relative'
        },

        entryText: {
            maxWidth: '238px',

            '&.withMeter': {
                maxWidth: '178px'
            },

            '&.left-margin': {
                marginLeft: '36px'
            }
        },

        icon: {
            borderRadius: '50%',
            display: 'inline-block',
            width: '14px',
            marginLeft: '6px',

            '& svg': {
                fill: theme.palette.iconError
            }
        },

        meter: {
            position: 'absolute',
            right: '16px',
            top: '14px'
        }
    };
});

const MicrophoneEntry = ({
    deviceId,
    children,
    hasError,
    index,
    isSelected,
    length,
    jitsiTrack,
    measureAudioLevels,
    onClick: propsClick
}: IProps) => {
    const [ level, setLevel ] = useState(-1);
    const activeTrackRef = useRef(jitsiTrack);
    const { classes, cx } = useStyles();

    /**
     * Click handler for the entry.
     *
     * @returns {void}
     */
    const onClick = useCallback(() => {
        propsClick(deviceId);
    }, [ propsClick, deviceId ]);

    /**
     * Key pressed handler for the entry.
     *
     * @param {Object} e - The event.
     * @private
     *
     * @returns {void}
     */
    const onKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            propsClick(deviceId);
        }
    }, [ propsClick, deviceId ]);

    /**
     * Updates the level of the meter.
     *
     * @param {number} num - The audio level provided by the jitsiTrack.
     * @returns {void}
     */
    const updateLevel = useCallback((num: number) => {
        setLevel(Math.floor(num / 0.125));
    }, []);

    /**
     * Subscribes to audio level changes coming from the jitsiTrack.
     *
     * @returns {void}
     */
    const startListening = () => {
        jitsiTrack && measureAudioLevels && jitsiTrack.on(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            updateLevel);
    };

    /**
     * Unsubscribes from changes coming from the jitsiTrack.
     *
     * @param {Object} track - The jitsiTrack to unsubscribe from.
     * @returns {void}
     */
    const stopListening = (track?: any) => {
        track?.off(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, updateLevel);
        setLevel(-1);
    };

    useEffect(() => {
        startListening();

        return () => {
            stopListening(jitsiTrack);
        };
    }, []);

    useEffect(() => {
        stopListening(activeTrackRef.current);
        startListening();
        activeTrackRef.current = jitsiTrack;
    }, [ jitsiTrack ]);

    return (
        <li
            aria-checked = { isSelected }
            aria-posinset = { index }
            aria-setsize = { length }
            className = { classes.container }
            onClick = { onClick }
            onKeyPress = { onKeyPress }
            role = 'radio'
            tabIndex = { 0 }>
            <ContextMenuItem
                accessibilityLabel = { children }
                icon = { isSelected ? IconCheck : undefined }
                overflowType = { TEXT_OVERFLOW_TYPES.SCROLL_ON_HOVER }
                selected = { isSelected }
                text = { children }
                textClassName = { cx(classes.entryText,
                    measureAudioLevels && 'withMeter',
                    !isSelected && 'left-margin') }>
                {hasError && <Icon
                    className = { classes.icon }
                    size = { 16 }
                    src = { IconExclamationSolid } />}
            </ContextMenuItem>
            {Boolean(jitsiTrack) && measureAudioLevels && <Meter
                className = { classes.meter }
                isDisabled = { hasError }
                level = { level } />
            }
        </li>
    );
};

export default MicrophoneEntry;
