import React from 'react';

import { IconDotsHorizontal } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';

interface IProps {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string;

    /**
     * Click handler function.
     */
    onClick: () => void;

    participantID?: string;
}

const ParticipantActionEllipsis = ({ accessibilityLabel, onClick, participantID }: IProps) => (
    <Button
        accessibilityLabel = { accessibilityLabel }
        icon = { IconDotsHorizontal }
        onClick = { onClick }
        size = 'small'
        testId = { participantID ? `participant-more-options-${participantID}` : undefined } />
);

export default ParticipantActionEllipsis;
