import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createReactionMenuEvent, createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { raiseHand } from '../../../base/participants/actions';
import { getLocalParticipant, hasRaisedHand } from '../../../base/participants/functions';
import GifsMenu from '../../../gifs/components/web/GifsMenu';
import GifsMenuButton from '../../../gifs/components/web/GifsMenuButton';
import { isGifEnabled, isGifsMenuOpen } from '../../../gifs/functions';
import { dockToolbox } from '../../../toolbox/actions.web';
import { addReactionToBuffer } from '../../actions.any';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { REACTIONS, REACTIONS_MENU_HEIGHT } from '../../constants';

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
     * Whether or not it's a mobile browser.
     */
    _isMobile: boolean;

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
     * Whether or not it's displayed in the overflow menu.
     */
    overflowMenu?: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        overflow: {
            width: 'auto',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0), 16px)',
            backgroundColor: theme.palette.ui01,
            boxShadow: 'none',
            borderRadius: 0,
            position: 'relative',
            boxSizing: 'border-box',
            height: `${REACTIONS_MENU_HEIGHT}px`
        }
    };
});

const ReactionsMenu = ({
    _dockToolbox,
    _isGifEnabled,
    _isGifMenuVisible,
    _isMobile,
    _raisedHand,
    dispatch,
    overflowMenu
}: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();

    useEffect(() => {
        _dockToolbox(true);

        return () => {
            _dockToolbox(false);
        };
    }, []);

    const _doToggleRaiseHand = () => {
        dispatch(raiseHand(!_raisedHand));
    };

    const _onToolbarToggleRaiseHand = useCallback(() => {
        sendAnalytics(createToolbarEvent(
            'raise.hand',
            { enable: !_raisedHand }));
        _doToggleRaiseHand();
        dispatch(toggleReactionsMenuVisibility());
    }, [ _raisedHand ]);

    const _getReactionButtons = () => {
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

    return (
        <div
            className = { cx('reactions-menu', _isGifEnabled && 'with-gif',
                overflowMenu && `overflow ${classes.overflow}`) }>
            {_isGifEnabled && _isGifMenuVisible && <GifsMenu />}
            <div className = 'reactions-row'>
                {_getReactionButtons()}
                {_isGifEnabled && <GifsMenuButton />}
            </div>
            {_isMobile && (
                <div className = 'raise-hand-row'>
                    <ReactionButton
                        accessibilityLabel = { t('toolbar.accessibilityLabel.raiseHand') }
                        icon = '✋'
                        key = 'raisehand'
                        label = {
                            `${t(`toolbar.${_raisedHand ? 'lowerYourHand' : 'raiseYourHand'}`)}
                                ${overflowMenu ? '' : ' (R)'}`
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
    const { isNarrowLayout } = state['features/base/responsive-ui'];

    return {
        _localParticipantID: localParticipant?.id,
        _isMobile: isMobileBrowser() || isNarrowLayout,
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
