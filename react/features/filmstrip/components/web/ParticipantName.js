// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { getLocalParticipant, getParticipantDisplayNameWithId } from '../../../base/participants';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { DisplayNameBadge, appendSuffix } from '../../../display-name';
import { isLayoutTileView } from '../../../video-layout';

type Props = {

    /**
     * The participant ID.
     */
    participantId: string,

    /**
     * The suffix to be appended to the participant name.
     */
    participantSuffix?: string
}

const useStyles = makeStyles(theme => {
    return {
        badge: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            position: 'absolute',
            width: '100%',
            zIndex: '2'
        },
        stageBadge: {
            top: theme.spacing(2)
        },
        tileBadge: {
            bottom: theme.spacing(2)
        }
    };
});

/**
 * Component that renders a badge with the participant name on each thumbnail in tile view.
 *
 * @param {Props} props - The props of the component.
 * @returns {ReactElement}
 */
const ParticipantName = ({ participantId, participantSuffix }: Props) => {
    const classes = useStyles();

    const isTileView = useSelector(isLayoutTileView);
    const className = `${classes.badge}${isTileView ? ` ${classes.tileBadge}` : ` ${classes.stageBadge}`}`;

    const participantName = useSelector(getParticipantDisplayNameWithId(participantId));
    const fullName = appendSuffix(participantName, participantSuffix);

    const localParticipant = useSelector(getLocalParticipant);
    const isLocal = localParticipant?.id === participantId;

    return (
        <div
            className = { className }
            id = { isLocal ? 'localDisplayName' : `participant_${participantId}_name` }>
            <DisplayNameBadge name = { fullName } />
        </div>
    );
};

export default ParticipantName;
