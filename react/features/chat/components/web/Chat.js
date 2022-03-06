// @flow

import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { PollsPane } from '../../../polls/components';
import { toggleChat } from '../../actions.web';
import AbstractChat, {
    _mapStateToProps,
    type Props as AbstractProps
} from '../AbstractChat';

import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

type Props = AbstractProps & {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,
}

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        focused: {},
        header: {
            height: '70px',
            position: 'relative',
            width: '100%',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            padding: '16px',
            alignItems: 'center',
            boxSizing: 'border-box',
            color: '#fff',
            fontWeight: '600',
            fontSize: '24px',
            lineHeight: '32px',

            '& .jitsi-icon': {
                cursor: 'pointer'
            }
        },
        noTabs: {
            // extract header height
            height: 'calc(100% - 70px)'
        },
        panel: {
            display: 'flex',
            flexDirection: 'column',

            // extract header + tabs height
            height: 'calc(100% - 102px)'
        },
        sideToolbarContainer: {
            backgroundColor: 'var(--chat-background-color)',
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
            transition: 'width .16s ease-in-out',
            width: 'var(--sidebar-width)',
            zIndex: theme.zIndex.sideToolbarContainer,

            '@media (max-width: 580px)': {
                height: 'fill-available',
                left: 0,
                position: 'fixed',
                right: 0,
                top: 0,
                width: 'auto'
            },

            '& *': {
                webkitUserSelect: 'text',
                userSelect: 'text'
            },

            '& .display-name': {
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '5px',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
            }
        },
        tab: {
            fontSize: '1.2em',
            paddingBottom: '0.5em',
            width: '50%',
            textAlign: 'center',
            color: '#8B8B8B',
            cursor: 'pointer',

            '&$focused': {
                borderBottomStyle: 'solid',
                color: '#FFF'
            }
        },
        tabBadge: {
            backgroundColor: '#165ecc',
            borderRadius: '50%',
            boxSizing: 'border-box',
            fontWeight: '700',
            overflow: 'hidden',
            textAlign: 'center',
            textOverflow: 'ellipsis',
            verticalAlign: 'middle',
            padding: '0 4px',
            color: '#FFF'
        },
        tabsContainer: {
            width: '100%',
            borderBottom: 'thin solid #292929',
            display: 'flex',
            justifyContent: 'space-around'
        },
        tabTitle: {
            marginRight: '8px'
        }
    };
};

/**
 * React Component for holding the chat feature in a side panel that slides in
 * and out of view.
 */
class Chat extends AbstractChat<Props> {

    /**
     * Reference to the React Component for displaying chat messages. Used for
     * scrolling to the end of the chat messages.
     */
    _messageContainerRef: Object;

    /**
     * Initializes a new {@code Chat} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this._messageContainerRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._onChatTabKeyDown = this._onChatTabKeyDown.bind(this);
        this._onChatInputResize = this._onChatInputResize.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
        this._onPollsTabKeyDown = this._onPollsTabKeyDown.bind(this);
        this._onToggleChat = this._onToggleChat.bind(this);
    }

    /**
     * Implements {@code Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this._scrollMessageContainerToBottom(true);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        if (this.props._messages !== prevProps._messages) {
            this._scrollMessageContainerToBottom(true);
        } else if (this.props._isOpen && !prevProps._isOpen) {
            this._scrollMessageContainerToBottom(false);
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _isOpen, _isPollsEnabled, _showNamePrompt, classes } = this.props;

        return (
            _isOpen ? <div
                className = { classes.sideToolbarContainer }
                id = 'sideToolbarContainer'
                onKeyDown = { this._onEscClick } >
                <ChatHeader
                    className = { classes.header }
                    id = 'chat-header'
                    isPollsEnabled = { _isPollsEnabled }
                    onCancel = { this._onToggleChat } />
                { _showNamePrompt
                    ? <DisplayNameForm isPollsEnabled = { _isPollsEnabled } />
                    : this._renderChat() }
            </div> : null
        );
    }

    _onChatInputResize: () => void;

    /**
     * Callback invoked when {@code ChatInput} changes height. Preserves
     * displaying the latest message if it is scrolled to.
     *
     * @private
     * @returns {void}
     */
    _onChatInputResize() {
        this._messageContainerRef.current.maybeUpdateBottomScroll();
    }

    _onChatTabKeyDown: (KeyboardEvent) => void;

    /**
     * Key press handler for the chat tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onChatTabKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChatTab();
        }
    }

    _onEscClick: (KeyboardEvent) => void;

    /**
     * Click handler for the chat sidenav.
     *
     * @param {KeyboardEvent} event - Esc key click to close the popup.
     * @returns {void}
     */
    _onEscClick(event) {
        if (event.key === 'Escape' && this.props._isOpen) {
            event.preventDefault();
            event.stopPropagation();
            this._onToggleChat();
        }
    }

    _onPollsTabKeyDown: (KeyboardEvent) => void;

    /**
     * Key press handler for the polls tab.
     *
     * @param {KeyboardEvent} event - The event.
     * @returns {void}
     */
    _onPollsTabKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            this._onTogglePollsTab();
        }
    }

    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChat() {
        const { _isPollsEnabled, _isPollsTabFocused, classes } = this.props;

        if (_isPollsTabFocused) {
            return (
                <>
                    {_isPollsEnabled && this._renderTabs()}
                    <div
                        aria-labelledby = 'polls-tab'
                        id = 'polls-panel'
                        role = 'tabpanel'>
                        <PollsPane />
                    </div>
                    <KeyboardAvoider />
                </>
            );
        }

        return (
            <>
                {_isPollsEnabled && this._renderTabs()}
                <div
                    aria-labelledby = 'chat-tab'
                    className = { clsx(classes.panel, !_isPollsEnabled && classes.noTabs) }
                    id = 'chat-panel'
                    role = 'tabpanel'>
                    <MessageContainer
                        messages = { this.props._messages }
                        ref = { this._messageContainerRef } />
                    <MessageRecipient />
                    <ChatInput
                        onResize = { this._onChatInputResize }
                        onSend = { this._onSendMessage } />
                    <KeyboardAvoider />
                </div>
            </>
        );
    }

    /**
     * Returns a React Element showing the Chat and Polls tab.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTabs() {
        const { _isPollsEnabled, _isPollsTabFocused, _nbUnreadMessages, _nbUnreadPolls, classes, t } = this.props;

        return (
            <div
                aria-label = { t(_isPollsEnabled ? 'chat.titleWithPolls' : 'chat.title') }
                className = { classes.tabsContainer }
                role = 'tablist'>
                <div
                    aria-controls = 'chat-panel'
                    aria-label = { t('chat.tabs.chat') }
                    aria-selected = { !_isPollsTabFocused }
                    className = { clsx(classes.tab, { [classes.focused]: !_isPollsTabFocused }) }
                    id = 'chat-tab'
                    onClick = { this._onToggleChatTab }
                    onKeyDown = { this._onChatTabKeyDown }
                    role = 'tab'
                    tabIndex = '0'>
                    <span
                        className = { classes.tabTitle }>
                        {t('chat.tabs.chat')}
                    </span>
                    {this.props._isPollsTabFocused
                        && _nbUnreadMessages > 0 && (
                        <span className = { classes.tabBadge }>
                            {_nbUnreadMessages}
                        </span>
                    )}
                </div>
                <div
                    aria-controls = 'polls-panel'
                    aria-label = { t('chat.tabs.polls') }
                    aria-selected = { _isPollsTabFocused }
                    className = { clsx(classes.tab, { [classes.focused]: _isPollsTabFocused }) }
                    id = 'polls-tab'
                    onClick = { this._onTogglePollsTab }
                    onKeyDown = { this._onPollsTabKeyDown }
                    role = 'tab'
                    tabIndex = '0'>
                    <span className = { classes.tabTitle }>
                        {t('chat.tabs.polls')}
                    </span>
                    {!_isPollsTabFocused
                        && this.props._nbUnreadPolls > 0 && (
                        <span className = { classes.tabBadge }>
                            {_nbUnreadPolls}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    /**
     * Scrolls the chat messages so the latest message is visible.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling
     * animation.
     * @private
     * @returns {void}
     */
    _scrollMessageContainerToBottom(withAnimation) {
        if (this._messageContainerRef.current) {
            this._messageContainerRef.current.scrollToBottom(withAnimation);
        }
    }

    _onSendMessage: (string) => void;

    _onToggleChat: () => void;

    /**
    * Toggles the chat window.
    *
    * @returns {Function}
    */
    _onToggleChat() {
        this.props.dispatch(toggleChat());
    }
    _onTogglePollsTab: () => void;
    _onToggleChatTab: () => void;

}

export default translate(connect(_mapStateToProps)(withStyles(styles)(Chat)));
