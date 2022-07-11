/* @flow */

import InlineDialog from '@atlaskit/inline-dialog';
import { withStyles } from '@material-ui/styles';
import React, { Component } from 'react';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { ReactionEmoji, ReactionsMenu } from '../../../reactions/components';
import { type ReactionEmojiProps, REACTIONS_MENU_HEIGHT } from '../../../reactions/constants';
import { getReactionsQueue } from '../../../reactions/functions.any';
import { DRAWER_MAX_HEIGHT } from '../../constants';

import Drawer from './Drawer';
import JitsiPortal from './JitsiPortal';
import OverflowToggleButton from './OverflowToggleButton';

/**
 * The type of the React {@code Component} props of {@link OverflowMenuButton}.
 */
type Props = {

    /**
     * ID of the menu that is controlled by this button.
     */
    ariaControls: String,

    /**
     * A child React Element to display within {@code InlineDialog}.
     */
    children: React$Node,

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * Whether or not the OverflowMenu popover should display.
     */
    isOpen: boolean,

    /**
     * Callback to change the visibility of the overflow menu.
     */
    onVisibilityChange: Function,

    /**
     * Whether to display the OverflowMenu as a drawer.
     */
    overflowDrawer: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * The array of reactions to be displayed.
     */
    reactionsQueue: Array<ReactionEmojiProps>,

    /**
     * Whether or not to display the reactions in the mobile menu.
     */
    showMobileReactions: boolean
};

const styles = () => {
    return {
        overflowMenuDrawer: {
            overflowY: 'auto',
            height: `calc(${DRAWER_MAX_HEIGHT} - ${REACTIONS_MENU_HEIGHT}px - 16px)`
        }
    };
};

/**
 * A React {@code Component} for opening or closing the {@code OverflowMenu}.
 *
 * @augments Component
 */
class OverflowMenuButton extends Component<Props> {
    /**
     * Initializes a new {@code OverflowMenuButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onCloseDialog = this._onCloseDialog.bind(this);
        this._toggleDialogVisibility
            = this._toggleDialogVisibility.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
    }

    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the more actions entries.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props.isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onCloseDialog();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, classes, isOpen, overflowDrawer, reactionsQueue, showMobileReactions } = this.props;

        return (
            <div className = 'toolbox-button-wth-dialog context-menu'>
                {
                    overflowDrawer ? (
                        <>
                            <OverflowToggleButton
                                handleClick = { this._toggleDialogVisibility }
                                isOpen = { isOpen }
                                onKeyDown = { this._onEscClick } />
                            <JitsiPortal>
                                <Drawer
                                    isOpen = { isOpen }
                                    onClose = { this._onCloseDialog }>
                                    <div className = { classes.overflowMenuDrawer }>
                                        {children}
                                    </div>
                                    {showMobileReactions && <ReactionsMenu overflowMenu = { true } />}
                                </Drawer>
                                {showMobileReactions && <div className = 'reactions-animations-container'>
                                    {reactionsQueue.map(({ reaction, uid }, index) => (<ReactionEmoji
                                        index = { index }
                                        key = { uid }
                                        reaction = { reaction }
                                        uid = { uid } />))}
                                </div>}
                            </JitsiPortal>
                        </>
                    ) : (
                        <InlineDialog
                            content = { children }
                            isOpen = { isOpen }
                            onClose = { this._onCloseDialog }
                            placement = 'top-end'>
                            <OverflowToggleButton
                                handleClick = { this._toggleDialogVisibility }
                                isOpen = { isOpen }
                                onKeyDown = { this._onEscClick } />
                        </InlineDialog>
                    )
                }
            </div>
        );
    }

    _onCloseDialog: () => void;

    /**
     * Callback invoked when {@code InlineDialog} signals that it should be
     * close.
     *
     * @private
     * @returns {void}
     */
    _onCloseDialog() {
        this.props.onVisibilityChange(false);
    }

    _toggleDialogVisibility: () => void;

    /**
     * Callback invoked to signal that an event has occurred that should change
     * the visibility of the {@code InlineDialog} component.
     *
     * @private
     * @returns {void}
     */
    _toggleDialogVisibility() {
        sendAnalytics(createToolbarEvent('overflow'));

        this.props.onVisibilityChange(!this.props.isOpen);
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code OverflowMenuButton} component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { overflowDrawer } = state['features/toolbox'];

    return {
        overflowDrawer,
        reactionsQueue: getReactionsQueue(state)
    };
}

export default withStyles(styles)(translate(connect(mapStateToProps)(OverflowMenuButton)));
