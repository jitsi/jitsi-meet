// @flow

import React from 'react';
import Transition from 'react-transition-group/Transition';

import { translate } from '../../../base/i18n';
import { Icon, IconClose } from '../../../base/icons';
import { connect } from '../../../base/redux';

import AbstractChat, {
    _mapDispatchToProps,
    _mapStateToProps,
    type Props
} from '../AbstractChat';
import ChatInput from './ChatInput';
import DisplayNameForm from './DisplayNameForm';
import MessageContainer from './MessageContainer';
import MessageRecipient from './MessageRecipient';

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

        // Bind event handlers so they are only bound once for every instance.
        this._onChatInputResize = this._onChatInputResize.bind(this);
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
        return (
            <Transition
                in = { this.props._isOpen }
                timeout = { 500 }>
                { this._renderPanelContent }
            </Transition>
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
                <MessageContainer
                    messages = { this.props._messages }
                    ref = { this._messageContainerRef } />
                <MessageRecipient />
                <ChatInput
                    onResize = { this._onChatInputResize }
                    onSend = { this.props._onSendMessage } />
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
            <div className = 'chat-header'>
                <div
                    className = 'chat-close'
                    onClick = { this.props._onToggleChat }>
                    <Icon src = { IconClose } />
                </div>
            </div>
        );
    }

    _renderPanelContent: (string) => React$Node | null;

    /**
     * Renders the contents of the chat panel, depending on the current
     * animation state provided by {@code Transition}.
     *
     * @param {string} state - The current display transition state of the
     * {@code Chat} component, as provided by {@code Transition}.
     * @private
     * @returns {ReactElement | null}
     */
    _renderPanelContent(state) {
        this._isExited = state === 'exited';

        const { _isOpen, _showNamePrompt } = this.props;
        const ComponentToRender = !_isOpen && state === 'exited'
            ? null
            : (
                <>
                    { this._renderChatHeader() }
                    { _showNamePrompt
                        ? <DisplayNameForm /> : this._renderChat() }
                </>
            );
        let className = '';

        if (_isOpen) {
            className = 'slideInExt';
        } else if (this._isExited) {
            className = 'invisible';
        }

        return (
            <div
                className = { `sideToolbarContainer ${className}` }
                id = 'sideToolbarContainer'>
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
}

export default translate(connect(_mapStateToProps, _mapDispatchToProps)(Chat));
