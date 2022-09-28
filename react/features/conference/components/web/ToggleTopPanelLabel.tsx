/* eslint-disable lines-around-comment */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import { IState } from '../../../app/types';
import { IconMenuDown } from '../../../base/icons/svg/index';
// @ts-ignore
import { Label } from '../../../base/label';
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';
// @ts-ignore
import { setTopPanelVisible } from '../../../filmstrip/actions.web';

const ToggleTopPanelLabel = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const topPanelHidden = !useSelector((state: IState) => state['features/filmstrip'].topPanelVisible);
    const onClick = useCallback(() => {
        dispatch(setTopPanelVisible(true));
    }, []);

    return topPanelHidden && (<Tooltip
        content = { t('toggleTopPanelLabel') }
        position = { 'bottom' }>
        <Label
            icon = { IconMenuDown }
            onClick = { onClick } />
    </Tooltip>);
};

export default ToggleTopPanelLabel;
