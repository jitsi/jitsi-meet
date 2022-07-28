import React from 'react';

import { IconHorizontalPoints } from '../../../base/icons/svg/index';
import Button from '../../../base/ui/components/web/Button';

type Props = {

    /**
     * Label used for accessibility.
     */
    accessibilityLabel: string,

    /**
     * Click handler function.
     */
    onClick: () => void;
}

const ParticipantActionEllipsis = ({ accessibilityLabel, onClick }: Props) => (
    <Button
        accessibilityLabel = { accessibilityLabel }
        icon = { IconHorizontalPoints }
        onClick = { onClick }
        size = 'small' />
);

export default ParticipantActionEllipsis;
