import React, { ReactElement, useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect, useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp, IconFaceSmile } from '../../../base/icons/svg';
import AbstractButton, { type IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import ToolboxButtonWithPopup from '../../../base/toolbox/components/web/ToolboxButtonWithPopup';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { IReactionEmojiProps } from '../../constants';
import { getReactionsQueue, isReactionsEnabled } from '../../functions.any';
import { getReactionsMenuVisibility, isReactionsButtonEnabled } from '../../functions.web';
import { IReactionsMenuParent } from '../../types';

import RaiseHandButton from './RaiseHandButton';
import ReactionEmoji from './ReactionEmoji';
import ReactionsMenu from './ReactionsMenu';

interface IProps extends WithTranslation {

    /**
     * Whether a mobile browser is used or not.
     */
    _isMobile: boolean;

    /**
     * Whether the reactions should be displayed on separate button or not.
     */
    _reactionsButtonEnabled: boolean;

    /**
     * The button's key.
     */
    buttonKey?: string;

    /**
     * Redux dispatch function.
     */
    dispatch: Function;

    /**
     * Click handler for raise hand functionality.
     */
    handleClick: Function;

    /**
     * Whether or not it's narrow mode or mobile browser.
     */
    isNarrow: boolean;

    /**
     * Whether or not the reactions menu is open.
     */
    isOpen: boolean;

    /**
     * Notify mode for `toolbarButtonClicked` event -
     * whether to only notify or to also prevent button click routine.
     */
    notifyMode?: string;

    /**
     * The array of reactions to be displayed.
     */
    reactionsQueue: Array<IReactionEmojiProps>;
}


/**
 * Implementation of a button for reactions.
 */
class ReactionsButtonImpl extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.reactions';
    icon = IconFaceSmile;
    label = 'toolbar.reactions';
    toggledLabel = 'toolbar.reactions';
    tooltip = 'toolbar.reactions';
}

const ReactionsButton = translate(connect()(ReactionsButtonImpl));

/**
 * Button used for the reactions menu.
 *
 * @returns {ReactElement}
 */
function ReactionsMenuButton({
    _reactionsButtonEnabled,
    _isMobile,
    buttonKey,
    dispatch,
    handleClick,
    isOpen,
    isNarrow,
    notifyMode,
    reactionsQueue,
    t
}: IProps) {
    const visible = useSelector(getReactionsMenuVisibility);
    const toggleReactionsMenu = useCallback(() => {
        dispatch(toggleReactionsMenuVisibility());
    }, [ dispatch ]);

    const openReactionsMenu = useCallback(() => {
        !visible && toggleReactionsMenu();
    }, [ visible, toggleReactionsMenu ]);

    const closeReactionsMenu = useCallback(() => {
        visible && toggleReactionsMenu();
    }, [ visible, toggleReactionsMenu ]);

    const reactionsMenu = (<div className = 'reactions-menu-container'>
        <ReactionsMenu parent = { IReactionsMenuParent.Button } />
    </div>);

    let content: ReactElement | null = null;

    if (_reactionsButtonEnabled) {
        content = (
            <ToolboxButtonWithPopup
                ariaControls = 'reactions-menu-dialog'
                ariaExpanded = { isOpen }
                ariaHasPopup = { true }
                ariaLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                onPopoverClose = { _isMobile ? closeReactionsMenu : toggleReactionsMenu }
                onPopoverOpen = { openReactionsMenu }
                popoverContent = { reactionsMenu }
                trigger = { _isMobile ? 'click' : undefined }
                visible = { visible }>
                <ReactionsButton
                    buttonKey = { buttonKey }
                    notifyMode = { notifyMode } />
            </ToolboxButtonWithPopup>);
    } else {
        content = isNarrow
            ? (
                <RaiseHandButton
                    buttonKey = { buttonKey }
                    handleClick = { handleClick }
                    notifyMode = { notifyMode } />)
            : (
                <ToolboxButtonWithPopup
                    ariaControls = 'reactions-menu-dialog'
                    ariaExpanded = { isOpen }
                    ariaHasPopup = { true }
                    ariaLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
                    icon = { IconArrowUp }
                    iconDisabled = { false }
                    iconId = 'reactions-menu-button'
                    onPopoverClose = { toggleReactionsMenu }
                    onPopoverOpen = { openReactionsMenu }
                    popoverContent = { reactionsMenu }
                    visible = { visible }>
                    <RaiseHandButton
                        buttonKey = { buttonKey }
                        handleClick = { handleClick }
                        notifyMode = { notifyMode } />
                </ToolboxButtonWithPopup>);
    }

    return (
        <div className = 'reactions-menu-popup-container'>
            { content }
            {reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
                index = { index }
                key = { uid }
                reaction = { reaction }
                uid = { uid } />))}
        </div>);

}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { isNarrowLayout } = state['features/base/responsive-ui'];

    return {
        _reactionsButtonEnabled: isReactionsButtonEnabled(state),
        _reactionsEnabled: isReactionsEnabled(state),
        _isMobile: isMobileBrowser(),
        isOpen: getReactionsMenuVisibility(state),
        isNarrow: isNarrowLayout,
        reactionsQueue: getReactionsQueue(state)
    };
}

export default translate(connect(mapStateToProps)(ReactionsMenuButton));
