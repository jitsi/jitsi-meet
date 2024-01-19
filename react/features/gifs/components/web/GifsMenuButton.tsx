import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ReactionButton from '../../../reactions/components/web/ReactionButton';
import { IReactionsMenuParent } from '../../../reactions/types';
import { setGifMenuVisibility } from '../../actions';
import { isGifsMenuOpen } from '../../functions.web';

interface IProps {
    parent: IReactionsMenuParent;
}

const GifsMenuButton = ({ parent }: IProps) => {
    const menuOpen = useSelector(isGifsMenuOpen);
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const icon = (
        <img
            alt = 'GIPHY Logo'
            height = { parent === IReactionsMenuParent.OverflowMenu ? 16 : 24 }
            src = 'images/GIPHY_icon.png' />
    );

    const handleClick = useCallback(() => {
        dispatch(setGifMenuVisibility(!menuOpen));
    }, [ menuOpen, parent ]);

    return (
        <ReactionButton
            accessibilityLabel = { t('toolbar.accessibilityLabel.giphy') }
            icon = { icon }
            key = 'gif'
            onClick = { handleClick }
            toggled = { true }
            tooltip = { t('toolbar.accessibilityLabel.giphy') } />
    );
};

export default GifsMenuButton;
