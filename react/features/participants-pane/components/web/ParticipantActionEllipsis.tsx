import React from 'react';

import { IconHorizontalPoints } from '../../../base/icons/svg';
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
}

const ParticipantActionEllipsis = ({ accessibilityLabel, onClick }: IProps) => (
    <Button
        accessibilityLabel = { accessibilityLabel }
        icon = { IconHorizontalPoints }
        onClick = { onClick }
        size = 'small' />
);

export default ParticipantActionEllipsis;
