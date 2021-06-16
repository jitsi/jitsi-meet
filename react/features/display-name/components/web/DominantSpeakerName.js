// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { getDominantSpeakerParticipant, getLocalParticipant, getPinnedParticipant } from '../../../base/participants';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { isToolboxVisible } from '../../../toolbox/functions.web';
import { isLayoutTileView } from '../../functions';

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

const DominantSpeakerName = () => {
    const classes = useStyles();

    const pinnedParticipant = useSelector(getPinnedParticipant);
    const pinnedName = pinnedParticipant?.name;

    const dominantSpeaker = useSelector(getDominantSpeakerParticipant);
    const dominantName = dominantSpeaker?.name;

    const localParticipant = useSelector(getLocalParticipant);
    const localName = localParticipant?.name;

    const nameToDisplay = pinnedName ?? dominantName;

    const isTileView = useSelector(isLayoutTileView);
    const toolboxVisible = useSelector(isToolboxVisible);

    if (nameToDisplay && nameToDisplay !== localName && !isTileView) {
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
