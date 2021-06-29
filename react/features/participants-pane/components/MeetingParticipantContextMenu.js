// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { useLayoutEffect, useRef, useState } from 'react';

import { withPixelLineHeight } from '../../base/styles/functions.web';
import { getComputedOuterHeight } from '../functions';

import ContextMenuActions from './ContextMenuActions';

const ignoredChildClassName = 'ignore-child';

const useStyles = makeStyles(theme => {
    return {
        container: {
            backgroundColor: theme.palette.ui02,
            borderRadius: theme.shape.borderRadius / 2,
            boxShadow: '0px 3px 16px rgba(0, 0, 0, 0.6), 0px 0px 4px 1px rgba(0, 0, 0, 0.25)',
            color: theme.palette.text01,
            marginTop: 44,
            position: 'absolute',
            right: 16,
            top: 0,
            zIndex: 2,
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        },
        hidden: {
            pointerEvents: 'none',
            visibility: 'hidden'
        }
    };
});

type Props = {

    /**
     * Callback used to open a confirmation dialog for audio muting.
     */
    muteAudio: Function,

    /**
     * Target elements against which positioning calculations are made
     */
    offsetTarget: HTMLElement,

    /**
     * Callback for the mouse entering the component
     */
    onMouseEnter: Function,

    /**
     * Callback for the mouse leaving the component
     */
    onMouseLeave: Function,

    /**
     * Callback for making a selection in the menu
     */
    onClick: Function,

    /**
     * Participant reference
     */
    participant: Object
};

export const MeetingParticipantContextMenu = ({
    offsetTarget,
    onMouseEnter,
    onMouseLeave,
    onClick,
    muteAudio,
    participant
}: Props) => {
    const containerRef = useRef<null | HTMLElement>(null);
    const [ isHidden, setIsHidden ] = useState(true);
    const classes = useStyles();

    useLayoutEffect(() => {
        if (participant
            && containerRef.current
            && offsetTarget?.offsetParent
            && offsetTarget.offsetParent instanceof HTMLElement
        ) {
            const { current: container } = containerRef;
            const { offsetTop, offsetParent: { offsetHeight, scrollTop } } = offsetTarget;
            const outerHeight = getComputedOuterHeight(container);

            container.style.top = String(offsetTop + outerHeight > offsetHeight + scrollTop
                ? offsetTop - outerHeight
                : offsetTop);

            setIsHidden(false);
        } else {
            setIsHidden(true);
        }
    }, [ participant, offsetTarget ]);

    if (!participant) {
        return null;
    }

    return (
        <div
            className = { clsx(ignoredChildClassName, classes.container, isHidden && classes.hidden) }
            onClick = { onClick }
            onMouseEnter = { onMouseEnter }
            onMouseLeave = { onMouseLeave }
            ref = { containerRef }>
            <ContextMenuActions
                muteAudio = { muteAudio }
                participant = { participant } />
        </div>
    );
};
