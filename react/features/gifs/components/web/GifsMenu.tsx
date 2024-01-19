import { GiphyFetch, TrendingOptions, setServerUrl } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { batch, useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createGifSentEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import Input from '../../../base/ui/components/web/Input';
import { sendMessage } from '../../../chat/actions.any';
import { SCROLL_SIZE } from '../../../filmstrip/constants';
import { toggleReactionsMenuVisibility } from '../../../reactions/actions.web';
import { IReactionsMenuParent } from '../../../reactions/types';
import Drawer from '../../../toolbox/components/web/Drawer';
import JitsiPortal from '../../../toolbox/components/web/JitsiPortal';
import { setGifMenuVisibility } from '../../actions';
import {
    formatGifUrlMessage,
    getGifAPIKey,
    getGifRating,
    getGifUrl,
    getGiphyProxyUrl
} from '../../function.any';

const OVERFLOW_DRAWER_PADDING = 16;

const useStyles = makeStyles()(theme => {
    return {
        gifsMenu: {
            width: '100%',
            marginBottom: theme.spacing(2),
            display: 'flex',
            flexDirection: 'column',

            '& div:focus': {
                border: '1px solid red !important',
                boxSizing: 'border-box'
            }
        },

        searchField: {
            marginBottom: theme.spacing(3)
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
            marginTop: theme.spacing(1)
        },

        overflowDrawerMenu: {
            padding: theme.spacing(3),
            width: '100%',
            boxSizing: 'border-box',
            height: '100%'
        },

        overflowMenu: {
            height: '200px',
            width: '201px',
            marginBottom: '0px'
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

interface IProps {
    columns?: number;
    parent: IReactionsMenuParent;
}

/**
 * Gifs menu.
 *
 * @returns {ReactElement}
 */
function GifsMenu({ columns = 2, parent }: IProps) {
    const API_KEY = useSelector(getGifAPIKey);
    const giphyFetch = new GiphyFetch(API_KEY);
    const [ searchKey, setSearchKey ] = useState<string>();
    const { classes: styles, cx } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const isInOverflowMenu
        = parent === IReactionsMenuParent.OverflowDrawer || parent === IReactionsMenuParent.OverflowMenu;
    const { clientWidth } = useSelector((state: IReduxState) => state['features/base/responsive-ui']);
    const rating = useSelector(getGifRating);
    const proxyUrl = useSelector(getGiphyProxyUrl);

    const fetchGifs = useCallback(async (offset = 0) => {
        const options: TrendingOptions = {
            limit: 20,
            offset,
            rating
        };

        if (!searchKey) {
            return await giphyFetch.trending(options);
        }

        return await giphyFetch.search(searchKey, options);
    }, [ searchKey ]);

    const onDrawerClose = useCallback(() => {
        dispatch(setGifMenuVisibility(false));
    }, []);

    const handleGifClick = useCallback((gif, e) => {
        e?.stopPropagation();
        const url = getGifUrl(gif, proxyUrl);

        sendAnalytics(createGifSentEvent());
        batch(() => {
            dispatch(sendMessage(formatGifUrlMessage(url), true));
            dispatch(toggleReactionsMenuVisibility());
            isInOverflowMenu && onDrawerClose();
        });
    }, [ dispatch, isInOverflowMenu ]);

    const handleGifKeyPress = useCallback((gif, e) => {
        if (e.nativeEvent.keyCode === 13) {
            handleGifClick(gif, null);
        }
    }, [ handleGifClick ]);

    const handleSearchKeyChange = useCallback(value => {
        setSearchKey(value);
    }, []);

    const handleKeyDown = useCallback(e => {
        if (!document.activeElement) {
            return;
        }
        if (e.keyCode === 38) { // up arrow
            e.preventDefault();

            // if the first gif is focused move focus to the input
            if (document.activeElement.previousElementSibling === null) {
                const element = document.querySelector('.gif-input') as HTMLElement;

                element?.focus();
            } else {
                const element = document.activeElement.previousElementSibling as HTMLElement;

                element?.focus();
            }
        } else if (e.keyCode === 40) { // down arrow
            e.preventDefault();

            // if the input is focused move focus to the first gif
            if (document.activeElement.classList.contains('gif-input')) {
                const element = document.querySelector('.giphy-gif') as HTMLElement;

                element?.focus();
            } else {
                const element = document.activeElement.nextElementSibling as HTMLElement;

                element?.focus();
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

    useEffect(() => {
        if (proxyUrl) {
            setServerUrl(proxyUrl);
        }
    }, []);

    const onInputKeyPress = useCallback((e: React.KeyboardEvent) => {
        e.stopPropagation();
    }, []);

    const gifMenu = (
        <div
            className = { cx(styles.gifsMenu,
                parent === IReactionsMenuParent.OverflowDrawer && styles.overflowDrawerMenu,
                parent === IReactionsMenuParent.OverflowMenu && styles.overflowMenu
            ) }>
            <Input
                autoFocus = { true }
                className = { cx(styles.searchField, 'gif-input') }
                id = 'gif-search-input'
                onChange = { handleSearchKeyChange }
                onKeyPress = { onInputKeyPress }
                placeholder = { t('giphy.search') }
                // eslint-disable-next-line react/jsx-no-bind
                ref = { inputElement => {
                    inputElement?.focus();
                    setTimeout(() => inputElement?.focus(), 200);
                } }
                type = 'text'
                value = { searchKey ?? '' } />
            <div
                className = { cx(styles.gifContainer,
                parent === IReactionsMenuParent.OverflowDrawer && styles.gifContainerOverflow) }>
                <Grid
                    columns = { columns }
                    fetchGifs = { fetchGifs }
                    gutter = { 6 }
                    hideAttribution = { true }
                    key = { searchKey }
                    noLink = { true }
                    noResultsMessage = { t('giphy.noResults') }
                    onGifClick = { handleGifClick }
                    onGifKeyPress = { handleGifKeyPress }
                    width = { parent === IReactionsMenuParent.OverflowDrawer
                        ? clientWidth - (2 * OVERFLOW_DRAWER_PADDING) - SCROLL_SIZE
                        : parent === IReactionsMenuParent.OverflowMenu ? 201 : 320
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

    return parent === IReactionsMenuParent.OverflowDrawer ? (
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
