// @flow

import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { getLocalParticipant, getParticipantDisplayNameWithId } from '../../../base/participants';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { DisplayNameBadge, appendSuffix } from '../../../display-name';

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
        badgeContainer: {
            ...withPixelLineHeight(theme.typography.labelRegular),
            alignItems: 'center',
            bottom: theme.spacing(2),
            display: 'flex',
            justifyContent: 'center',
            position: 'absolute',
            transition: 'margin-bottom 0.3s',
            width: '100%',
            zIndex: '2'
        }
    };
});

/**
 * Component that renders a badge with the participant name on each thumbnail in tile view.
 *
 * @returns {ReactElement}
 */
const ParticipantName = ({ participantId, participantSuffix }: Props) => {
    const classes = useStyles();
    const participantName = useSelector(getParticipantDisplayNameWithId(participantId));
    const fullName = appendSuffix(participantName, participantSuffix);

    const localParticipant = useSelector(getLocalParticipant);
    const isLocal = localParticipant?.id === participantId;

    return (
        <div
            className = { classes.badgeContainer }
            id = { isLocal ? 'localDisplayName' : `participant_${participantId}_name` }>
            <DisplayNameBadge name = { fullName } />
        </div>
    );
};

export default ParticipantName;
