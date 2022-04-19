// @flow

import clsx from 'clsx';
import React from 'react';

import { Icon, IconConnectionActive, IconConnectionInactive } from '../../../base/icons';

type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * A CSS class that interprets the current connection status as a color.
     */
    colorClass: string,

    /**
     * Disable/enable inactive indicator.
     */
     connectionIndicatorInactiveDisabled: boolean,

    /**
     * JitsiTrack instance.
     */
    track: Object,

    /**
     * Whether or not the connection status is inactive.
     */
    isConnectionStatusInactive: boolean,

    /**
     * Whether or not the connection status is interrupted.
     */
    isConnectionStatusInterrupted: boolean,
}

export const ConnectionIndicatorIcon = ({
    classes,
    colorClass,
    connectionIndicatorInactiveDisabled,
    isConnectionStatusInactive,
    isConnectionStatusInterrupted,
}: Props) => {
    if (isConnectionStatusInactive) {
        if (connectionIndicatorInactiveDisabled) {
            return null;
        }

        return (
            <span className = 'connection_ninja'>
                <Icon
                    className = { clsx(classes.icon, classes.inactiveIcon, colorClass) }
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
                className = { clsx(classes.icon, colorClass) }
                size = { 12 }
                src = { IconConnectionActive } />
        </span>
    );
};
