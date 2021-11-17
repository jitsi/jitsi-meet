// @flow

import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { makeStyles } from '@material-ui/core';
import clsx from 'clsx';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { batch, useDispatch, useSelector } from 'react-redux';

import { createGifSentEvent, sendAnalytics } from '../../../analytics';
import InputField from '../../../base/premeeting/components/web/InputField';
import BaseTheme from '../../../base/ui/components/BaseTheme';
import { sendMessage } from '../../../chat/actions.any';
import { SCROLL_SIZE } from '../../../filmstrip';
import { toggleReactionsMenuVisibility } from '../../../reactions/actions.web';
import { setOverflowMenuVisible } from '../../../toolbox/actions.web';
import { Drawer, JitsiPortal } from '../../../toolbox/components/web';
import { showOverflowDrawer } from '../../../toolbox/functions.web';
import { setGifDrawerVisibility } from '../../actions';
import { formatGifUrlMessage, getGifAPIKey, getGifUrl } from '../../functions';

const OVERFLOW_DRAWER_PADDING = BaseTheme.spacing(3);

const useStyles = makeStyles(theme => {
    return {
        gifsMenu: {
            width: '100%',
            marginBottom: `${theme.spacing(2)}px`,
            display: 'flex',
            flexDirection: 'column',

            '& div:focus': {
                border: '1px solid red !important',
                boxSizing: 'border-box'
            }
        },

        searchField: {
            backgroundColor: theme.palette.field01,
            borderRadius: `${theme.shape.borderRadius}px`,
            border: 'none',
            outline: 0,
            ...theme.typography.bodyShortRegular,
            lineHeight: `${theme.typography.bodyShortRegular.lineHeight}px`,
            color: theme.palette.text01,
            padding: `${theme.spacing(2)}px ${theme.spacing(3)}px`,
            width: '100%',
            marginBottom: `${theme.spacing(3)}px`
        },

        gifContainer: {
            height: '245px',
            overflowY: 'auto'
        },

        logoContainer: {
            width: `calc(100% - ${SCROLL_SIZE}px)`,
            backgroundColor: '#121119',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginTop: `${theme.spacing(1)}px`
        },

        overflowMenu: {
            padding: `${theme.spacing(3)}px`,
            width: '100%',
            boxSizing: 'border-box'
        },

        gifContainerOverflow: {
            flexGrow: 1
        },

        drawer: {
            display: 'flex',
            height: '100%'
        }
    };
});

/**
 * Gifs menu.
 *
 * @returns {ReactElement}
 */
function GifsMenu() {
    const API_KEY = useSelector(getGifAPIKey);
    const giphyFetch = new GiphyFetch(API_KEY);
    const [ searchKey, setSearchKey ] = useState();
    const styles = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const overflowDrawer = useSelector(showOverflowDrawer);
    const { clientWidth } = useSelector(state => state['features/base/responsive-ui']);

    const fetchGifs = useCallback(async (offset = 0) => {
        const options = {
            rating: 'pg-13',
            limit: 20,
            offset
        };

        if (!searchKey) {
            return await giphyFetch.trending(options);
        }

        return await giphyFetch.search(searchKey, options);
    }, [ searchKey ]);

    const onDrawerClose = useCallback(() => {
        dispatch(setGifDrawerVisibility(false));
        dispatch(setOverflowMenuVisible(false));
    });

    const handleGifClick = useCallback((gif, e) => {
        e?.stopPropagation();
        const url = getGifUrl(gif);

        sendAnalytics(createGifSentEvent());
        batch(() => {
            dispatch(sendMessage(formatGifUrlMessage(url), true));
            dispatch(toggleReactionsMenuVisibility());
            overflowDrawer && onDrawerClose();
        });
    }, [ dispatch, overflowDrawer ]);

    const handleGifKeyPress = useCallback((gif, e) => {
        if (e.nativeEvent.keyCode === 13) {
            handleGifClick(gif, null);
        }
    }, [ handleGifClick ]);

    const handleSearchKeyChange = useCallback(value => {
        setSearchKey(value);
    });

    const handleKeyDown = useCallback(e => {
        if (e.keyCode === 38) { // up arrow
            e.preventDefault();

            // if the first gif is focused move focus to the input
            if (document.activeElement.previousElementSibling === null) {
                document.querySelector('.gif-input').focus();
            } else {
                document.activeElement.previousElementSibling.focus();
            }
        } else if (e.keyCode === 40) { // down arrow
            e.preventDefault();

            // if the input is focused move focus to the first gif
            if (document.activeElement.classList.contains('gif-input')) {
                document.querySelector('.giphy-gif').focus();
            } else {
                document.activeElement.nextElementSibling.focus();
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // For some reason, the Grid component does not do an initial call on mobile.
    // This fixes that.
    useEffect(() => setSearchKey(''), []);

    const gifMenu = (
        <div
            className = { clsx(styles.gifsMenu,
                overflowDrawer && styles.overflowMenu
            ) }>
            <InputField
                autoFocus = { true }
                className = { clsx(styles.searchField, 'gif-input') }
                onChange = { handleSearchKeyChange }
                placeHolder = { t('giphy.search') }
                testId = 'gifSearch.key'
                type = 'text' />
            <div
                className = { clsx(styles.gifContainer,
                overflowDrawer && styles.gifContainerOverflow) }>
                <Grid
                    columns = { 2 }
                    fetchGifs = { fetchGifs }
                    gutter = { 6 }
                    hideAttribution = { true }
                    key = { searchKey }
                    noLink = { true }
                    noResultsMessage = { t('giphy.noResults') }
                    onGifClick = { handleGifClick }
                    onGifKeyPress = { handleGifKeyPress }
                    width = { overflowDrawer
                        ? clientWidth - (2 * OVERFLOW_DRAWER_PADDING) - SCROLL_SIZE
                        : 320
                    } />
            </div>
            <div className = { styles.logoContainer }>
                <span>Powered by</span>
                <img
                    alt = 'GIPHY Logo'
                    src = 'images/GIPHY_logo.png' />
            </div>
        </div>
    );

    return overflowDrawer ? (
        <JitsiPortal>
            <Drawer
                className = { styles.drawer }
                isOpen = { true }
                onClose = { onDrawerClose }>
                {gifMenu}
            </Drawer>
        </JitsiPortal>
    ) : gifMenu;
}

export default GifsMenu;
