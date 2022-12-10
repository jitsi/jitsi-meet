import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import ReactionButton from '../../../reactions/components/web/ReactionButton';
import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { setGifDrawerVisibility, setGifMenuVisibility } from '../../actions';
import { isGifsMenuOpen } from '../../functions';

const GifsMenuButton = () => {
    const menuOpen = useSelector(isGifsMenuOpen);
    const overflowDrawer = useSelector(showOverflowDrawer);
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const icon = (
        <img
            alt = 'GIPHY Logo'
            height = { 24 }
            src = 'images/GIPHY_icon.png' />
    );

    const handleClick = useCallback(() =>
        dispatch(
            overflowDrawer
                ? setGifDrawerVisibility(!menuOpen)
                : setGifMenuVisibility(!menuOpen)
        )
    , [ menuOpen, overflowDrawer ]);

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
