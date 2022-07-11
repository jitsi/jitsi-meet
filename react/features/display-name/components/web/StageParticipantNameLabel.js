// @flow

import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';

import { isDisplayNameVisible } from '../../../base/config/functions.any';
import { getLocalParticipant, getParticipantDisplayName } from '../../../base/participants';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { isLayoutTileView } from '../../../video-layout';

import DisplayNameBadge from './DisplayNameBadge';

const useStyles = makeStyles(theme => {
    return {
        badgeContainer: {
            ...withPixelLineHeight(theme.typography.bodyShortRegularLarge),
            alignItems: 'center',
            display: 'inline-flex',
            justifyContent: 'center',
            marginBottom: theme.spacing(7),
            transition: 'margin-bottom 0.3s',
            pointerEvents: 'none',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            zIndex: 1
        },
        containerElevated: {
            marginBottom: theme.spacing(12)
        }
    };
});

/**
 * Component that renders the dominant speaker's name as a badge above the toolbar in stage view.
 *
 * @returns {ReactElement|null}
 */
const StageParticipantNameLabel = () => {
    const classes = useStyles();
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const selectedId = largeVideoParticipant?.id;
    const nameToDisplay = useSelector(state => getParticipantDisplayName(state, selectedId));

    const localParticipant = useSelector(getLocalParticipant);
    const localId = localParticipant?.id;

    const isTileView = useSelector(isLayoutTileView);
    const toolboxVisible = useSelector(isToolboxVisible);
    const showDisplayName = useSelector(isDisplayNameVisible);

    if (showDisplayName && nameToDisplay && selectedId !== localId && !isTileView) {
        return (
            <div
                className = { clsx(
                    'stage-participant-label',
                    classes.badgeContainer,
                    toolboxVisible && classes.containerElevated
                ) }>
                <DisplayNameBadge name = { nameToDisplay } />
            </div>
        );
    }

    return null;
};

export default StageParticipantNameLabel;
