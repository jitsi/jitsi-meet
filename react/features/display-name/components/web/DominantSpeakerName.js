// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { getLocalParticipant } from '../../../base/participants';
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
            display: 'flex',
            justifyContent: 'center',
            marginBottom: theme.spacing(2),
            transition: 'margin-bottom 0.3s'
        },
        containerElevated: {
            marginBottom: theme.spacing(7)
        }
    };
});

/**
 * Component that renders the dominant speaker's name as a badge above the toolbar in stage view.
 *
 * @returns {ReactElement|null}
 */
const DominantSpeakerName = () => {
    const classes = useStyles();
    const largeVideoParticipant = useSelector(getLargeVideoParticipant);
    const nameToDisplay = largeVideoParticipant?.name;
    const selectedId = largeVideoParticipant?.id;

    const localParticipant = useSelector(getLocalParticipant);
    const localId = localParticipant?.id;

    const isTileView = useSelector(isLayoutTileView);
    const toolboxVisible = useSelector(isToolboxVisible);

    if (nameToDisplay && selectedId !== localId && !isTileView) {
        return (
            <div
                className = { `${classes.badgeContainer}${toolboxVisible ? '' : ` ${classes.containerElevated}`}` }>
                <DisplayNameBadge name = { nameToDisplay } />
            </div>
        );
    }

    return null;
};

export default DominantSpeakerName;
