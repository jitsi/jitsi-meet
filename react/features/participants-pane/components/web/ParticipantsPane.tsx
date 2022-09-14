/* eslint-disable lines-around-comment */
import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { IState } from '../../../app/types';
import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
// @ts-ignore
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n/functions';
import { IconClose, IconHorizontalPoints } from '../../../base/icons/svg';
// @ts-ignore
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { connect } from '../../../base/redux/functions';
import Button from '../../../base/ui/components/web/Button';
import ClickableIcon from '../../../base/ui/components/web/ClickableIcon';
import { BUTTON_TYPES } from '../../../base/ui/constants';
// @ts-ignore
import { isAddBreakoutRoomButtonVisible } from '../../../breakout-rooms/functions';
// @ts-ignore
import { MuteEveryoneDialog } from '../../../video-menu/components/';
// @ts-ignore
import { close } from '../../actions';
import {
    findAncestorByClass,
    getParticipantsPaneOpen,
    isMoreActionsVisible,
    isMuteAllVisible
    // @ts-ignore
} from '../../functions';
import { AddBreakoutRoomButton } from '../breakout-rooms/components/web/AddBreakoutRoomButton';
// @ts-ignore
import { RoomList } from '../breakout-rooms/components/web/RoomList';

import { FooterContextMenu } from './FooterContextMenu';
import LobbyParticipants from './LobbyParticipants';
import MeetingParticipants from './MeetingParticipants';

/**
 * The type of the React {@code Component} props of {@link ParticipantsPane}.
 */
interface Props extends WithTranslation {

    /**
     * Whether there is backend support for Breakout Rooms.
     */
    _isBreakoutRoomsSupported: Boolean;

    /**
     * Whether to display the context menu  as a drawer.
     */
    _overflowDrawer: boolean;

    /**
     * Is the participants pane open.
     */
    _paneOpen: boolean;

    /**
     * Should the add breakout room button be displayed?
     */
    _showAddRoomButton: boolean;

    /**
     * Whether to show the footer menu.
     */
    _showFooter: boolean;

    /**
     * Whether to show the more actions button.
     */
    _showMoreActionsButton: boolean;

    /**
     * Whether to show the mute all button.
     */
    _showMuteAllButton: boolean;

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * The Redux dispatch function.
     */
    dispatch: Function;
}

/**
 * The type of the React {@code Component} state of {@link ParticipantsPane}.
 */
type State = {

    /**
     * Indicates if the footer context menu is open.
     */
    contextOpen: boolean;

    /**
     * Participants search string.
     */
    searchString: string;
};

const styles = (theme: Theme) => {
    return {
        container: {
            boxSizing: 'border-box' as const,
            flex: 1,
            overflowY: 'auto' as const,
            position: 'relative' as const,
            padding: `0 ${participantsPaneTheme.panePadding}px`,

            [`& > * + *:not(.${participantsPaneTheme.ignoredChildClassName})`]: {
                marginTop: theme.spacing(3)
            },

            '&::-webkit-scrollbar': {
                display: 'none'
            }
        },

        closeButton: {
            alignItems: 'center',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center'
        },

        header: {
            alignItems: 'center',
            boxSizing: 'border-box' as const,
            display: 'flex',
            height: `${participantsPaneTheme.headerSize}px`,
            padding: '0 20px',
            justifyContent: 'flex-end'
        },

        antiCollapse: {
            fontSize: 0,

            '&:first-child': {
                display: 'none'
            },

            '&:first-child + *': {
                marginTop: 0
            }
        },

        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            padding: `${theme.spacing(4)} ${participantsPaneTheme.panePadding}px`,

            '& > *:not(:last-child)': {
                marginRight: theme.spacing(3)
            }
        },

        footerMoreContainer: {
            position: 'relative' as const
        }
    };
};

/**
 * Implements the participants list.
 */
class ParticipantsPane extends Component<Props, State> {
    /**
     * Initializes a new {@code ParticipantsPane} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            contextOpen: false,
            searchString: ''
        };

        // Bind event handlers so they are only bound once per instance.
        this._onClosePane = this._onClosePane.bind(this);
        this._onDrawerClose = this._onDrawerClose.bind(this);
        this._onMuteAll = this._onMuteAll.bind(this);
        this._onToggleContext = this._onToggleContext.bind(this);
        this._onWindowClickListener = this._onWindowClickListener.bind(this);
        this.setSearchString = this.setSearchString.bind(this);
    }


    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        window.addEventListener('click', this._onWindowClickListener);
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        window.removeEventListener('click', this._onWindowClickListener);
    }

    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _isBreakoutRoomsSupported,
            _paneOpen,
            _showAddRoomButton,
            _showFooter,
            _showMoreActionsButton,
            _showMuteAllButton,
            classes,
            t
        } = this.props;
        const { contextOpen, searchString } = this.state;

        // when the pane is not open optimize to not
        // execute the MeetingParticipantList render for large list of participants
        if (!_paneOpen) {
            return null;
        }

        return (
            <div className = 'participants_pane'>
                <div className = 'participants_pane-content'>
                    <div className = { classes.header }>
                        <ClickableIcon
                            accessibilityLabel = { t('participantsPane.close', 'Close') }
                            icon = { IconClose }
                            onClick = { this._onClosePane } />
                    </div>
                    <div className = { classes.container }>
                        <LobbyParticipants />
                        <br className = { classes.antiCollapse } />
                        <MeetingParticipants
                            searchString = { searchString }
                            setSearchString = { this.setSearchString } />
                        {_isBreakoutRoomsSupported && <RoomList searchString = { searchString } />}
                        {_showAddRoomButton && <AddBreakoutRoomButton />}
                    </div>
                    {_showFooter && (
                        <div className = { classes.footer }>
                            {_showMuteAllButton && (
                                <Button
                                    accessibilityLabel = { t('participantsPane.actions.muteAll') }
                                    labelKey = { 'participantsPane.actions.muteAll' }
                                    onClick = { this._onMuteAll }
                                    type = { BUTTON_TYPES.SECONDARY } />
                            )}
                            {_showMoreActionsButton && (
                                <div className = { classes.footerMoreContainer }>
                                    <Button
                                        accessibilityLabel = { t('participantsPane.actions.moreModerationActions') }
                                        icon = { IconHorizontalPoints }
                                        id = 'participants-pane-context-menu'
                                        onClick = { this._onToggleContext }
                                        type = { BUTTON_TYPES.SECONDARY } />
                                    <FooterContextMenu
                                        isOpen = { contextOpen }
                                        onDrawerClose = { this._onDrawerClose }
                                        onMouseLeave = { this._onToggleContext } />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /**
     * Sets the search string.
     *
     * @param {string} newSearchString - The new search string.
     * @returns {void}
     */
    setSearchString(newSearchString: string) {
        this.setState({
            searchString: newSearchString
        });
    }

    /**
     * Callback for closing the participant pane.
     *
     * @private
     * @returns {void}
     */
    _onClosePane() {
        this.props.dispatch(close());
    }

    /**
     * Callback for closing the drawer.
     *
     * @private
     * @returns {void}
     */
    _onDrawerClose() {
        this.setState({
            contextOpen: false
        });
    }

    /**
     * The handler for clicking mute all button.
     *
     * @returns {void}
     */
    _onMuteAll() {
        this.props.dispatch(openDialog(MuteEveryoneDialog));
    }

    /**
     * Handler for toggling open/close of the footer context menu.
     *
     * @returns {void}
     */
    _onToggleContext() {
        this.setState({
            contextOpen: !this.state.contextOpen
        });
    }

    /**
     * Window click event listener.
     *
     * @param {Event} e - The click event.
     * @returns {void}
     */
    _onWindowClickListener(e: any) {
        if (this.state.contextOpen && !findAncestorByClass(e.target, this.props.classes.footerMoreContainer)) {
            this.setState({
                contextOpen: false
            });
        }
    }


}

/**
 * Maps (parts of) the redux state to the React {@code Component} props of
 * {@code ParticipantsPane}.
 *
 * @param {Object} state - The redux state.
 * @protected
 * @returns {Props}
 */
function _mapStateToProps(state: IState) {
    const isPaneOpen = getParticipantsPaneOpen(state);
    const { conference } = state['features/base/conference'];
    const _isBreakoutRoomsSupported = conference?.getBreakoutRooms()?.isSupported();

    return {
        _isBreakoutRoomsSupported,
        _paneOpen: isPaneOpen,
        _showAddRoomButton: isAddBreakoutRoomButtonVisible(state),
        _showFooter: isLocalParticipantModerator(state),
        _showMuteAllButton: isMuteAllVisible(state),
        _showMoreActionsButton: isMoreActionsVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(ParticipantsPane)));
