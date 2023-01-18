import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp } from '../../../base/icons/svg';
import { connect } from '../../../base/redux/functions';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import ToolboxButtonWithIconPopup from '../../../base/toolbox/components/web/ToolboxButtonWithIconPopup';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { IReactionEmojiProps } from '../../constants';
import { getReactionsQueue, isReactionsEnabled } from '../../functions.any';
import { getReactionsMenuVisibility } from '../../functions.web';

// @ts-ignore
import RaiseHandButton from './RaiseHandButton';
import ReactionEmoji from './ReactionEmoji';
import ReactionsMenu from './ReactionsMenu';

interface IProps extends WithTranslation {

    /**
     * Whether or not reactions are enabled.
     */
    _reactionsEnabled: Boolean;

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

    const reactionsMenu = (<div className = 'reactions-menu-container'>
        <ReactionsMenu />
    </div>);

    return (
        <div className = 'reactions-menu-popup-container'>
            {!_reactionsEnabled || isNarrow ? (
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
function mapStateToProps(state: IReduxState) {
    const { isNarrowLayout } = state['features/base/responsive-ui'];

    return {
        _reactionsEnabled: isReactionsEnabled(state),
        isOpen: getReactionsMenuVisibility(state),
        isNarrow: isMobileBrowser() || isNarrowLayout,
        reactionsQueue: getReactionsQueue(state)
    };
}

export default translate(connect(mapStateToProps)(ReactionsMenuButton));
