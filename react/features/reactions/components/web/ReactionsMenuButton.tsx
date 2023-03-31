import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconFaceSmile } from '../../../base/icons/svg';
import { connect } from '../../../base/redux/functions';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import ToolboxButtonWithIconPopup from '../../../base/toolbox/components/web/ToolboxButtonWithIconPopup';
import { toggleReactionsMenuVisibility } from '../../actions.web';
import { IReactionEmojiProps } from '../../constants';
import { getReactionsQueue, isReactionsEnabled } from '../../functions.any';
import { getReactionsMenuVisibility } from '../../functions.web';

// @ts-ignore
import ReactionEmoji from './ReactionEmoji';
import ReactionsMenu from './ReactionsMenu';


/**
 * Implementation of a button for raising hand.
 */
class ReactionsButton extends AbstractButton<AbstractButtonProps, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.raiseHand';
    icon = IconFaceSmile;
    label = 'toolbar.raiseHand';
    toggledLabel = 'toolbar.raiseHand';

    /**
     * Retrieves tooltip dynamically.
     */
    get tooltip() {
        return 'toolbar.raiseHand';
    }

    /**
     * Required by linter due to AbstractButton overwritten prop being writable.
     *
     * @param {string} _value - The value.
     */
    set tooltip(_value) {
        // Unused.
    }
}

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
    _isMobile,
    buttonKey,
    dispatch,
    isOpen,
    isNarrow,
    notifyMode,
    reactionsQueue,
    t
}: IProps) {
    if (!_reactionsEnabled || isNarrow) {
        return null;
    }
    const visible = useSelector(getReactionsMenuVisibility);
    const toggleReactionsMenu = useCallback(() => {
        console.error('Toggle');
        dispatch(toggleReactionsMenuVisibility());
    }, [ dispatch ]);

    const openReactionsMenu = useCallback(() => {
        console.error('Open', visible);
        !visible && toggleReactionsMenu();
    }, [ visible, toggleReactionsMenu ]);

    const closeReactionsMenu = useCallback(() => {
        console.error('Close', visible);
        visible && toggleReactionsMenu();
    }, [ visible, toggleReactionsMenu ]);

    const reactionsMenu = (<div className = 'reactions-menu-container'>
        <ReactionsMenu />
    </div>);

    const reactionsButton = _isMobile ? (
        <ToolboxButtonWithIconPopup
            ariaControls = 'reactions-menu-dialog'
            ariaExpanded = { isOpen }
            ariaHasPopup = { true }
            ariaLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
            disableTouchEvents = { true }
            onPopoverClose = { closeReactionsMenu }
            onPopoverOpen = { openReactionsMenu }
            trigger = { 'click' }
            popoverContent = { reactionsMenu }
            visible = { visible }>
            <ReactionsButton
                buttonKey = { buttonKey }
                // handleClick = { visible ? closeReactionsMenu : openReactionsMenu }
                notifyMode = { notifyMode } />
        </ToolboxButtonWithIconPopup>
    ) : (
        <ToolboxButtonWithIconPopup
            ariaControls = 'reactions-menu-dialog'
            ariaExpanded = { isOpen }
            ariaHasPopup = { true }
            ariaLabel = { t('toolbar.accessibilityLabel.reactionsMenu') }
            onPopoverClose = { toggleReactionsMenu }
            onPopoverOpen = { openReactionsMenu }
            popoverContent = { reactionsMenu }
            visible = { visible }>
            <ReactionsButton
                buttonKey = { buttonKey }
                notifyMode = { notifyMode } />
        </ToolboxButtonWithIconPopup>
    );

    return (
        <div className = 'reactions-menu-popup-container'>
            {reactionsButton}
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
        _isMobile: isMobileBrowser(),
        isOpen: getReactionsMenuVisibility(state),
        isNarrow: isNarrowLayout,
        reactionsQueue: getReactionsQueue(state)
    };
}

export default translate(connect(mapStateToProps)(ReactionsMenuButton));
