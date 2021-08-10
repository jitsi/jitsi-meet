// @flow

import React, { Component } from 'react';
import { ThemeProvider } from 'styled-components';

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import {
    getParticipantCount,
    isLocalParticipantModerator
} from '../../../base/participants';
import { connect } from '../../../base/redux';
import { MuteEveryoneDialog } from '../../../video-menu/components/';
import { close } from '../../actions';
import { classList, findStyledAncestor, getParticipantsPaneOpen } from '../../functions';
import theme from '../../theme.json';
import { FooterContextMenu } from '../FooterContextMenu';

import { LobbyParticipantList } from './LobbyParticipantList';
import { MeetingParticipantList } from './MeetingParticipantList';
import {
    AntiCollapse,
    Close,
    Container,
    Footer,
    FooterButton,
    FooterEllipsisButton,
    FooterEllipsisContainer,
    Header
} from './styled';

/**
 * The type of the React {@code Component} props of {@link ParticipantsPane}.
 */
type Props = {

    /**
     * Is the participants pane open.
     */
    _paneOpen: boolean,

    /**
     * Whether to show context menu.
     */
    _showContextMenu: boolean,

    /**
     * Whether to show the footer menu.
     */
    _showFooter: boolean,

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

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
            _showContextMenu,
            _showFooter,
            t
        } = this.props;

        // when the pane is not open optimize to not
        // execute the MeetingParticipantList render for large list of participants
        if (!_paneOpen) {
            return null;
        }

        return (
            <ThemeProvider theme = { theme }>
                <div className = { classList('participants_pane', !_paneOpen && 'participants_pane--closed') }>
                    <div className = 'participants_pane-content'>
                        <Header>
                            <Close
                                aria-label = { t('participantsPane.close', 'Close') }
                                onClick = { this._onClosePane }
                                onKeyPress = { this._onKeyPress }
                                role = 'button'
                                tabIndex = { 0 } />
                        </Header>
                        <Container>
                            <LobbyParticipantList />
                            <AntiCollapse />
                            <MeetingParticipantList />
                        </Container>
                        {_showFooter && (
                            <Footer>
                                <FooterButton onClick = { this._onMuteAll }>
                                    {t('participantsPane.actions.muteAll')}
                                </FooterButton>
                                {_showContextMenu && (
                                    <FooterEllipsisContainer>
                                        <FooterEllipsisButton
                                            id = 'participants-pane-context-menu'
                                            onClick = { this._onToggleContext } />
                                        {this.state.contextOpen
                                            && <FooterContextMenu onMouseLeave = { this._onToggleContext } />}
                                    </FooterEllipsisContainer>
                                )}
                            </Footer>
                        )}
                    </div>
                </div>
            </ThemeProvider>
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
        if (this.state.contextOpen && !findStyledAncestor(e.target, FooterEllipsisContainer)) {
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
 *     _showContextMenu: boolean,
 *     _showFooter: boolean
 * }}
 */
function _mapStateToProps(state: Object) {
    const isPaneOpen = getParticipantsPaneOpen(state);

    return {
        _paneOpen: isPaneOpen,
        _showContextMenu: isPaneOpen && getParticipantCount(state) > 2,
        _showFooter: isPaneOpen && isLocalParticipantModerator(state)
    };
}

export default translate(connect(_mapStateToProps)(ParticipantsPane));
