import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { IconRaiseHand } from '../../../base/icons/svg';
import { getParticipantById, hasRaisedHand } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';
import { TOOLTIP_POSITION } from '../../../base/ui/constants.any';

/**
 * The type of the React {@code Component} props of {@link RaisedHandIndicator}.
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

const useStyles = makeStyles()(theme => {
    return {
        raisedHandIndicator: {
            backgroundColor: theme.palette.warning02,
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
const RaisedHandIndicator = ({
    iconSize,
    participantId,
    tooltipPosition
}: IProps) => {
    const participant: IParticipant | undefined = useSelector((state: IReduxState) =>
        getParticipantById(state, participantId));
    const _raisedHand = hasRaisedHand(participant);
    const { classes: styles, theme } = useStyles();

    if (!_raisedHand) {
        return null;
    }

    return (
        <div className = { styles.raisedHandIndicator }>
            <BaseIndicator
                icon = { IconRaiseHand }
                iconColor = { theme.palette.uiBackground }
                iconSize = { `${iconSize}px` }
                tooltipKey = 'raisedHand'
                tooltipPosition = { tooltipPosition } />
        </div>
    );
};

export default RaisedHandIndicator;
