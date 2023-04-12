import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconArrowDown } from '../../../base/icons/svg/index';
import Label from '../../../base/label/components/web/Label';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import { setTopPanelVisible } from '../../../filmstrip/actions.web';

const ToggleTopPanelLabel = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const topPanelHidden = !useSelector((state: IReduxState) => state['features/filmstrip'].topPanelVisible);
    const onClick = useCallback(() => {
        dispatch(setTopPanelVisible(true));
    }, []);

    return topPanelHidden ? (<Tooltip
        content = { t('toggleTopPanelLabel') }
        position = { 'bottom' }>
        <Label
            icon = { IconArrowDown }
            onClick = { onClick } />
    </Tooltip>) : null;
};

export default ToggleTopPanelLabel;
