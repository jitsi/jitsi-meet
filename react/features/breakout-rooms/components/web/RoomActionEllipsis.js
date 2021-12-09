// @flow

import { makeStyles } from '@material-ui/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { QuickActionButton } from '../../../base/components';
import { Icon, IconHorizontalPoints } from '../../../base/icons';

type Props = {

    /**
     * Click handler function.
     */
    onClick: Function
}

const useStyles = makeStyles(() => {
    return {
        button: {
            padding: '6px'
        }
    };
});

const RoomActionEllipsis = ({ onClick }: Props) => {
    const styles = useStyles();
    const { t } = useTranslation();

    return (
        <QuickActionButton
            accessibilityLabel = { t('breakoutRooms.actions.more') }
            className = { styles.button }
            onClick = { onClick }>
            <Icon src = { IconHorizontalPoints } />
        </QuickActionButton>
    );
};

export default RoomActionEllipsis;
