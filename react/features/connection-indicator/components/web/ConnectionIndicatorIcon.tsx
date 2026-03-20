import React from 'react';
import { useStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconConnection, IconConnectionInactive } from '../../../base/icons/svg';
import { ITrack } from '../../../base/tracks/types';
import { useTrackStreamingStatus } from '../../hooks';

interface IProps {

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<'icon' | 'inactiveIcon', string>>;

    /**
     * A CSS class that interprets the current connection status as a color.
     */
    colorClass: string;

    /**
     * Disable/enable inactive indicator.
     */
    connectionIndicatorInactiveDisabled: boolean;

    /**
     * Whether or not the connection status is inactive.
     */
    isConnectionStatusInactive: boolean;

    /**
     * Whether or not the connection status is interrupted.
     */
    isConnectionStatusInterrupted?: boolean;

    /**
     * JitsiTrack instance.
     */
    track?: ITrack;
}

export const ConnectionIndicatorIcon = ({
    classes,
    colorClass,
    connectionIndicatorInactiveDisabled,
    isConnectionStatusInactive,
    isConnectionStatusInterrupted,
    track
}: IProps) => {
    const { cx } = useStyles();

    // The hook internally maintains local state and listens to track streaming status changes,
    // answering the FIXME replacing the massive inline Redux dispatch pattern.
    useTrackStreamingStatus(track);

    if (isConnectionStatusInactive) {
        if (connectionIndicatorInactiveDisabled) {
            return null;
        }

        return (
            <span className = 'connection_ninja'>
                <Icon
                    className = { cx(classes?.icon, classes?.inactiveIcon, colorClass) }
                    size = { 24 }
                    src = { IconConnectionInactive } />
            </span>
        );
    }

    let emptyIconWrapperClassName = 'connection_empty';

    if (isConnectionStatusInterrupted) {
        // emptyIconWrapperClassName is used by the torture tests to identify lost connection status handling.
        emptyIconWrapperClassName = 'connection_lost';
    }

    return (
        <span className = { emptyIconWrapperClassName }>
            <Icon
                className = { cx(classes?.icon, colorClass) }
                size = { 16 }
                src = { IconConnection } />
        </span>
    );
};
