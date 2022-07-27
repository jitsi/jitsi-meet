import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconHorizontalPoints } from '../../../../../base/icons/svg/index';
import Button from '../../../../../base/ui/components/web/Button';

type Props = {

    /**
     * Click handler function.
     */
    onClick: () => void;
}

const RoomActionEllipsis = ({ onClick }: Props) => {
    const { t } = useTranslation();

    return (
        <Button
            accessibilityLabel = { t('breakoutRooms.actions.more') }
            icon = { IconHorizontalPoints }
            onClick = { onClick }
            size = 'small' />
    );
};

export default RoomActionEllipsis;
