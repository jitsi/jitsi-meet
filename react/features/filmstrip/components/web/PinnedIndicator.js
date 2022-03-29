/* @flow */

import { makeStyles } from '@material-ui/styles';
import React from 'react';
import { useSelector } from 'react-redux';

import { IconPinParticipant } from '../../../base/icons';
import { BaseIndicator } from '../../../base/react';
import { getActiveParticipantsIds } from '../../functions.web';

/**
 * The type of the React {@code Component} props of {@link PinnedIndicator}.
 */
type Props = {

    /**
     * The font-size for the icon.
     */
    iconSize: number,

    /**
     * The participant id who we want to render the raised hand indicator
     * for.
     */
    participantId: string,

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: string
};

const useStyles = makeStyles(() => {
    return {
        pinnedIndicator: {
            backgroundColor: 'rgba(0, 0, 0, .7)',
            padding: '2px',
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
}: Props) => {
    const isPinned = useSelector(getActiveParticipantsIds).find(id => id === participantId);
    const styles = useStyles();

    if (!isPinned) {
        return null;
    }

    return (
        <div className = { styles.pinnedIndicator }>
            <BaseIndicator
                icon = { IconPinParticipant }
                iconSize = { `${iconSize}px` }
                tooltipKey = 'pinnedParticipant'
                tooltipPosition = { tooltipPosition } />
        </div>
    );
};

export default PinnedIndicator;
