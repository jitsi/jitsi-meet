// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { toggleChat } from '../../actions.web';
import AbstractChat, {
    _mapStateToProps,
    type Props
} from '../AbstractChat';

import ChatDialog from './ChatDialog';
import Header from './ChatDialogHeader';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import KeyboardAvoider from './KeyboardAvoider';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';
import TouchmoveHack from './TouchmoveHack';

/**
 * React Component for holding the chat feature in a side panel that slides in
 * and out of view.
 */
class Chat extends AbstractChat<Props> {

    /**
     * Whether or not the {@code Chat} component is off-screen, having finished
     * its hiding animation.
     */
    _isExited: boolean;

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

        this._isExited = true;
        this._messageContainerRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._renderPanelContent = this._renderPanelContent.bind(this);
        this._onChatInputResize = this._onChatInputResize.bind(this);
        this._onEscClick = this._onEscClick.bind(this);
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

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <>
                { this._renderPanelContent() }
            </>
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

    /**
     * Returns a React Element for showing chat messages and a form to send new
     * chat messages.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChat() {
        return (
            <>
                <TouchmoveHack isModal = { this.props._isModal }>
                    <MessageContainer
                        messages = { this.props._messages }
                        ref = { this._messageContainerRef } />
                </TouchmoveHack>
                <MessageRecipient />
                <ChatInput
                    onResize = { this._onChatInputResize }
                    onSend = { this._onSendMessage } />
                <KeyboardAvoider />
            </>
        );
    }

    /**
     * Instantiates a React Element to display at the top of {@code Chat} to
     * close {@code Chat}.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderChatHeader() {
        return (
            <Header
                className = 'chat-header'
                id = 'chat-header'
                onCancel = { this._onToggleChat } />
        );
    }

    _renderPanelContent: () => React$Node | null;

    /**
     * Renders the contents of the chat panel.
     *
     * @private
     * @returns {ReactElement | null}
     */
    _renderPanelContent() {
        const { _isModal, _isOpen, _showNamePrompt } = this.props;
        let ComponentToRender = null;

        if (_isOpen) {
            if (_isModal) {
                ComponentToRender = (
                    <ChatDialog>
                        { _showNamePrompt ? <DisplayNameForm /> : this._renderChat() }
                    </ChatDialog>
                );
            } else {
                ComponentToRender = (
                    <>
                        { this._renderChatHeader() }
                        { _showNamePrompt ? <DisplayNameForm /> : this._renderChat() }
                    </>
                );
            }
        }
        let className = '';

        if (_isOpen) {
            className = 'slideInExt';
        } else if (this._isExited) {
            className = 'invisible';
        }

        return (
            <div
                aria-haspopup = 'true'
                className = { `sideToolbarContainer ${className}` }
                id = 'sideToolbarContainer'
                onKeyDown = { this._onEscClick } >
                { ComponentToRender }
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

}

export default translate(connect(_mapStateToProps)(Chat));
