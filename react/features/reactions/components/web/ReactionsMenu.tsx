import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createReactionMenuEvent, createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { raiseHand } from '../../../base/participants/actions';
import { getLocalParticipant, hasRaisedHand } from '../../../base/participants/functions';
import GifsMenu from '../../../gifs/components/web/GifsMenu';
import GifsMenuButton from '../../../gifs/components/web/GifsMenuButton';
import { isGifEnabled, isGifsMenuOpen } from '../../../gifs/functions';
import { dockToolbox } from '../../../toolbox/actions.web';
import { addReactionToBuffer } from '../../actions.any';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import {
    GIFS_MENU_HEIGHT_IN_OVERFLOW_MENU,
    RAISE_HAND_ROW_HEIGHT, REACTIONS,
    REACTIONS_MENU_HEIGHT_DRAWER,
    REACTIONS_MENU_HEIGHT_IN_OVERFLOW_MENU
} from '../../constants';
import { IReactionsMenuParent } from '../../types';

import ReactionButton from './ReactionButton';

interface IProps {

    /**
     * Docks the toolbox.
     */
    _dockToolbox: Function;

    /**
     * Whether or not the GIF feature is enabled.
     */
    _isGifEnabled: boolean;

    /**
     * Whether or not the GIF menu is visible.
     */
    _isGifMenuVisible: boolean;

    /**
     * The ID of the local participant.
     */
    _localParticipantID?: string;

    /**
     * Whether or not the local participant's hand is raised.
     */
    _raisedHand: boolean;

    /**
     * The Redux Dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * Indicates the parent of the reactions menu.
     */
    parent: IReactionsMenuParent;

    /**
     * Whether to show the raised hand button.
     */
    showRaisedHand?: boolean;
}

const useStyles = makeStyles<IProps>()((theme, props: IProps) => {
    const { parent, showRaisedHand, _isGifMenuVisible } = props;
    let reactionsMenuHeight = REACTIONS_MENU_HEIGHT_DRAWER;

    if (parent === IReactionsMenuParent.OverflowDrawer || parent === IReactionsMenuParent.OverflowMenu) {
        if (parent === IReactionsMenuParent.OverflowMenu) {
            reactionsMenuHeight = REACTIONS_MENU_HEIGHT_IN_OVERFLOW_MENU;

            if (_isGifMenuVisible) {
                reactionsMenuHeight += GIFS_MENU_HEIGHT_IN_OVERFLOW_MENU;
            }
        }
        if (!showRaisedHand) {
            reactionsMenuHeight -= RAISE_HAND_ROW_HEIGHT;
        }
    }

    return {
        reactionsMenuInOverflowMenu: {
            '&.reactions-menu': {
                '&.with-gif': {
                    width: 'inherit'
                },
                '.reactions-row': {
                    '.toolbox-icon': {
                        width: '24px',
                        height: '24px',

                        'span.emoji': {
                            width: '24px',
                            height: '24px',
                            lineHeight: '24px',
                            fontSize: '16px'
                        }
                    }
                },
                '.raise-hand-row': {
                    '.toolbox-icon': {
                        height: '32px'
                    }
                }
            }
        },
        overflow: {
            width: 'auto',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0), 16px)',
            backgroundColor: theme.palette.ui01,
            boxShadow: 'none',
            borderRadius: 0,
            position: 'relative',
            boxSizing: 'border-box',
            height: `${reactionsMenuHeight}px`
        }
    };
});

const _getReactionButtons = (dispatch: IStore['dispatch'], t: Function) => {
    let modifierKey = 'Alt';

    if (window.navigator?.platform) {
        if (window.navigator.platform.indexOf('Mac') !== -1) {
            modifierKey = '⌥';
        }
    }

    return Object.keys(REACTIONS).map(key => {
        /**
         * Sends reaction message.
         *
         * @returns {void}
         */
        function doSendReaction() {
            dispatch(addReactionToBuffer(key));
            sendAnalytics(createReactionMenuEvent(key));
        }

        return (<ReactionButton
            accessibilityLabel = { t(`toolbar.accessibilityLabel.${key}`) }
            icon = { REACTIONS[key].emoji }
            key = { key }
            // eslint-disable-next-line react/jsx-no-bind
            onClick = { doSendReaction }
            toggled = { false }
            tooltip = { `${t(`toolbar.${key}`)} (${modifierKey} + ${REACTIONS[key].shortcutChar})` } />);
    });
};

const ReactionsMenu = (props: IProps) => {
    const {
        _dockToolbox,
        _isGifEnabled,
        _isGifMenuVisible,
        _raisedHand,
        dispatch,
        parent,
        showRaisedHand = false
    } = props;
    const isInOverflowMenu
        = parent === IReactionsMenuParent.OverflowDrawer || parent === IReactionsMenuParent.OverflowMenu;
    const { classes, cx } = useStyles(props);
    const { t } = useTranslation();

    useEffect(() => {
        _dockToolbox(true);

        return () => {
            _dockToolbox(false);
        };
    }, []);

    const _doToggleRaiseHand = useCallback(() => {
        dispatch(raiseHand(!_raisedHand));
    }, [ _raisedHand ]);

    const _onToolbarToggleRaiseHand = useCallback(() => {
        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !_raisedHand }));
        _doToggleRaiseHand();
        dispatch(toggleReactionsMenuVisibility());
    }, [ _raisedHand ]);

    const buttons = _getReactionButtons(dispatch, t);

    if (_isGifEnabled) {
        buttons.push(<GifsMenuButton parent = { parent } />);
    }

    return (
        <div
            className = { cx('reactions-menu',
                parent === IReactionsMenuParent.OverflowMenu && classes.reactionsMenuInOverflowMenu,
                _isGifEnabled && 'with-gif',
                isInOverflowMenu && `overflow ${classes.overflow}`) }>
            {_isGifEnabled && _isGifMenuVisible
                && <GifsMenu
                    columns = { parent === IReactionsMenuParent.OverflowMenu ? 1 : undefined }
                    parent = { parent } />}
            <div className = 'reactions-row'>
                { buttons }
            </div>
            {showRaisedHand && (
                <div className = 'raise-hand-row'>
                    <ReactionButton
                        accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                        icon = '✋'
                        key = 'raisehand'
                        label = {
                            `${t(`toolbar.${_raisedHand ? 'lowerYourHand' : 'raiseYourHand'}`)}
                                ${isInOverflowMenu ? '' : ' (R)'}`
                        }
                        onClick = { _onToolbarToggleRaiseHand }
                        toggled = { true } />
                </div>
            )}
        </div>
    );
};

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const localParticipant = getLocalParticipant(state);

    return {
        _localParticipantID: localParticipant?.id,
        _isGifEnabled: isGifEnabled(state),
        _isGifMenuVisible: isGifsMenuOpen(state),
        _raisedHand: hasRaisedHand(localParticipant)
    };
}

/**
 * Function that maps parts of Redux actions into component props.
 *
 * @param {Object} dispatch - Redux dispatch.
 * @returns {Object}
 */
function mapDispatchToProps(dispatch: IStore['dispatch']) {
    return {
        dispatch,
        _dockToolbox: (dock: boolean) => dispatch(dockToolbox(dock))
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReactionsMenu);
