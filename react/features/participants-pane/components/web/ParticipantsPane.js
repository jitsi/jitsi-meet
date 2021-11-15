// @flow

import { withStyles } from '@material-ui/core';
import React, { Component } from 'react';

import participantsPaneTheme from '../../../base/components/themes/participantsPaneTheme.json';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { Icon, IconClose, IconHorizontalPoints } from '../../../base/icons';
import { isLocalParticipantModerator } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { MuteEveryoneDialog } from '../../../video-menu/components/';
import { close } from '../../actions';
import { classList, findAncestorByClass, getParticipantsPaneOpen } from '../../functions';

import FooterButton from './FooterButton';
import { FooterContextMenu } from './FooterContextMenu';
import LobbyParticipants from './LobbyParticipants';
import MeetingParticipants from './MeetingParticipants';

/**
 * The type of the React {@code Component} props of {@link ParticipantsPane}.
 */
type Props = {

    /**
     * Whether to display the context menu  as a drawer.
     */
    _overflowDrawer: boolean,

    /**
     * Is the participants pane open.
     */
    _paneOpen: boolean,

    /**
     * Whether to show the footer menu.
     */
    _showFooter: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * The i18n translate function.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@link ParticipantsPane}.
 */
type State = {

    /**
     * Indicates if the footer context menu is open.
     */
    contextOpen: boolean,
};

const styles = theme => {
    return {
        container: {
            boxSizing: 'border-box',
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
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
            boxSizing: 'border-box',
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
            padding: `${theme.spacing(4)}px ${participantsPaneTheme.panePadding}px`,

            '& > *:not(:last-child)': {
                marginRight: `${theme.spacing(3)}px`
            }
        },

        footerMoreContainer: {
            position: 'relative'
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
    constructor(props) {
        super(props);

        this.state = {
            contextOpen: false
        };

        // Bind event handlers so they are only bound once per instance.
        this._onClosePane = this._onClosePane.bind(this);
        this._onDrawerClose = this._onDrawerClose.bind(this);
        this._onKeyPress = this._onKeyPress.bind(this);
        this._onMuteAll = this._onMuteAll.bind(this);
        this._onToggleContext = this._onToggleContext.bind(this);
        this._onWindowClickListener = this._onWindowClickListener.bind(this);
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
            _paneOpen,
            _showFooter,
            classes,
            t
        } = this.props;
        const { contextOpen } = this.state;

        // when the pane is not open optimize to not
        // execute the MeetingParticipantList render for large list of participants
        if (!_paneOpen) {
            return null;
        }

        return (
            <div className = { classList('participants_pane', !_paneOpen && 'participants_pane--closed') }>
                <div className = 'participants_pane-content'>
                    <div className = { classes.header }>
                        <div
                            aria-label = { t('participantsPane.close', 'Close') }
                            className = { classes.closeButton }
                            onClick = { this._onClosePane }
                            onKeyPress = { this._onKeyPress }
                            role = 'button'
                            tabIndex = { 0 }>
                            <Icon
                                size = { 24 }
                                src = { IconClose } />
                        </div>
                    </div>
                    <div className = { classes.container }>
                        <LobbyParticipants />
                        <br className = { classes.antiCollapse } />
                        <MeetingParticipants />
                    </div>
                    {_showFooter && (
                        <div className = { classes.footer }>
                            <FooterButton
                                accessibilityLabel = { t('participantsPane.actions.muteAll') }
                                onClick = { this._onMuteAll }>
                                {t('participantsPane.actions.muteAll')}
                            </FooterButton>
                            <div className = { classes.footerMoreContainer }>
                                <FooterButton
                                    accessibilityLabel = { t('participantsPane.actions.moreModerationActions') }
                                    id = 'participants-pane-context-menu'
                                    isIconButton = { true }
                                    onClick = { this._onToggleContext }>
                                    <Icon src = { IconHorizontalPoints } />
                                </FooterButton>
                                <FooterContextMenu
                                    isOpen = { contextOpen }
                                    onDrawerClose = { this._onDrawerClose }
                                    onMouseLeave = { this._onToggleContext } />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    _onClosePane: () => void;

    /**
     * Callback for closing the participant pane.
     *
     * @private
     * @returns {void}
     */
    _onClosePane() {
        this.props.dispatch(close());
    }

    _onDrawerClose: () => void;

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

    _onKeyPress: (Object) => void;

    /**
     * KeyPress handler for accessibility for closing the participants pane.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onKeyPress(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onClosePane();
        }
    }

    _onMuteAll: () => void;

    /**
     * The handler for clicking mute all button.
     *
     * @returns {void}
     */
    _onMuteAll() {
        this.props.dispatch(openDialog(MuteEveryoneDialog));
    }

    _onToggleContext: () => void;

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

    _onWindowClickListener: (event: Object) => void;

    /**
     * Window click event listener.
     *
     * @param {Event} e - The click event.
     * @returns {void}
     */
    _onWindowClickListener(e) {
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
 * @returns {{
 *     _paneOpen: boolean,
 *     _showFooter: boolean
 * }}
 */
function _mapStateToProps(state: Object) {
    const isPaneOpen = getParticipantsPaneOpen(state);

    return {
        _paneOpen: isPaneOpen,
        _showFooter: isPaneOpen && isLocalParticipantModerator(state)
    };
}

export default translate(connect(_mapStateToProps)(withStyles(styles)(ParticipantsPane)));
