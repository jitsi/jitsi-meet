// @flow

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n';
import { IconArrowUp } from '../../../base/icons';
import { connect } from '../../../base/redux';
import ToolboxButtonWithIconPopup from '../../../base/toolbox/components/web/ToolboxButtonWithIconPopup';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { type ReactionEmojiProps } from '../../constants';
import { getReactionsQueue, isReactionsEnabled } from '../../functions.any';
import { getReactionsMenuVisibility } from '../../functions.web';

import RaiseHandButton from './RaiseHandButton';
import ReactionEmoji from './ReactionEmoji';
import ReactionsMenu from './ReactionsMenu';

type Props = {

    /**
     * Whether or not reactions are enabled.
     */
    _reactionsEnabled: Boolean,

    /**
     * The button's key.
     */
    buttonKey?: string,

    /**
     * Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Click handler for raise hand functionality.
     */
    handleClick: Function,

    /**
     * Whether or not the reactions menu is open.
     */
    isOpen: boolean,

    /**
     * Whether or not it's a mobile browser.
     */
    isMobile: boolean,

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string,

    /**
     * The array of reactions to be displayed.
     */
    reactionsQueue: Array<ReactionEmojiProps>,

    /**
     * Used for translation.
     */
    t: Function
};


declare var APP: Object;

/**
 * Button used for the reactions menu.
 *
 * @returns {ReactElement}
 */
function ReactionsMenuButton({
    _reactionsEnabled,
    buttonKey,
    dispatch,
    handleClick,
    isOpen,
    isMobile,
    notifyMode,
    reactionsQueue,
    t
}: Props) {
    const visible = useSelector(getReactionsMenuVisibility);
    const toggleReactionsMenu = useCallback(() => {
        dispatch(toggleReactionsMenuVisibility());
    }, [ dispatch ]);

    const openReactionsMenu = useCallback(() => {
        !visible && toggleReactionsMenu();
    }, [ visible, toggleReactionsMenu ]);

    const reactionsMenu = (<div className = 'reactions-menu-container'>
        <ReactionsMenu />
    </div>);

    return (
        <div className = 'reactions-menu-popup-container'>
            {!_reactionsEnabled || isMobile ? (
                <RaiseHandButton
                    buttonKey = { buttonKey }
                    handleClick = { handleClick }
                    notifyMode = { notifyMode } />)
                : (
                    <ToolboxButtonWithIconPopup
                        ariaControls = 'reactions-menu-dialog'
                        ariaExpanded = { isOpen }
                        ariaHasPopup = { true }
                        ariaLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                        buttonKey = { buttonKey }
                        icon = { IconArrowUp }
                        iconDisabled = { false }
                        iconId = 'reactions-menu-button'
                        notifyMode = { notifyMode }
                        onPopoverClose = { toggleReactionsMenu }
                        onPopoverOpen = { openReactionsMenu }
                        popoverContent = { reactionsMenu }
                        visible = { visible }>
                        <RaiseHandButton
                            buttonKey = { buttonKey }
                            handleClick = { handleClick }
                            notifyMode = { notifyMode } />
                    </ToolboxButtonWithIconPopup>
                )}
            {reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
                index = { index }
                key = { uid }
                reaction = { reaction }
                uid = { uid } />))}
        </div>
    );
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        _reactionsEnabled: isReactionsEnabled(state),
        isOpen: getReactionsMenuVisibility(state),
        isMobile: isMobileBrowser(),
        reactionsQueue: getReactionsQueue(state)
    };
}

export default translate(connect(mapStateToProps)(ReactionsMenuButton));
