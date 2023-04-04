import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconPin } from '../../../base/icons/svg';
import { getParticipantById } from '../../../base/participants/functions';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';
import { TOOLTIP_POSITION } from '../../../base/ui/constants.any';
import { getPinnedActiveParticipants, isStageFilmstripAvailable } from '../../functions.web';

/**
 * The type of the React {@code Component} props of {@link PinnedIndicator}.
 */
interface IProps {

    /**
     * The font-size for the icon.
     */
    iconSize: number;

    /**
     * The participant id who we want to render the raised hand indicator
     * for.
     */
    participantId: string;

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: TOOLTIP_POSITION;
}

const useStyles = makeStyles()(() => {
    return {
        pinnedIndicator: {
            backgroundColor: 'rgba(0, 0, 0, .7)',
            padding: '4px',
            zIndex: 3,
            display: 'inline-block',
            borderRadius: '4px',
            boxSizing: 'border-box'
        }
    };
});

/**
 * Thumbnail badge showing that the participant would like to speak.
 *
 * @returns {ReactElement}
 */
const PinnedIndicator = ({
    iconSize,
    participantId,
    tooltipPosition
}: IProps) => {
    const stageFilmstrip = useSelector(isStageFilmstripAvailable);
    const pinned = useSelector((state: IReduxState) => getParticipantById(state, participantId))?.pinned;
    const activePinnedParticipants: Array<{ participantId: string; pinned?: boolean; }>
        = useSelector(getPinnedActiveParticipants);
    const isPinned = activePinnedParticipants.find(p => p.participantId === participantId);
    const { classes: styles } = useStyles();

    if ((stageFilmstrip && !isPinned) || (!stageFilmstrip && !pinned)) {
        return null;
    }

    return (
        <div
            className = { styles.pinnedIndicator }
            id = { `pin-indicator-${participantId}` }>
            <BaseIndicator
                icon = { IconPin }
                iconSize = { `${iconSize}px` }
                tooltipKey = 'pinnedParticipant'
                tooltipPosition = { tooltipPosition } />
        </div>
    );
};

export default PinnedIndicator;
