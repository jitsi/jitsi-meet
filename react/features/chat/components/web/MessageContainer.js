// @flow
import React from 'react';
import { scrollIntoView } from 'seamless-scroll-polyfill';

import { connect } from '../../../base/redux';
import { resetHasNewMessages } from '../../actions.web';
import { MESSAGE_TYPE_REMOTE } from '../../constants';
import AbstractMessageContainer, { type Props }
    from '../AbstractMessageContainer';

import ChatMessageGroup from './ChatMessageGroup';
import NewMessagesButton from './NewMessagesButton';

type State = {
    isScrolledToBottom: boolean;
    hasNewMessages: boolean;
    lastReadMessageId: string;
};

/**
 * Displays all received chat messages, grouped by sender.
 *
 * @augments AbstractMessageContainer
 */
class MessageContainer extends AbstractMessageContainer<Props, State> {
    state: State = {
        isScrolledToBottom: true,
        hasNewMessages: false,
        lastReadMessageId: null
    };


    /**
     * Reference to the HTML element at the end of the list of displayed chat
     * messages. Used for scrolling to the end of the chat messages.
     */
    _messagesListEndRef: Object;

    /**
     * A React ref to the HTML element containing all {@code ChatMessageGroup}
     * instances.
     */
    _messageListRef: Object;

    /**
     * Initializes a new {@code MessageContainer} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code MessageContainer} instance with.
     */
    constructor(props: Props) {
        super(props);

        this._messageListRef = React.createRef();
        this._messagesListEndRef = React.createRef();

        // Bind event handlers so they are only bound once for every instance.
        this._onChatScroll = this._onChatScroll.bind(this);
        this._onGoToFirstUnreadMessage = this._onGoToFirstUnreadMessage.bind(this);

        this.createObserver = this.createObserver.bind(this);
        this.handleIntersect = this.handleIntersect.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        // console.log('my render', this.state);
        // console.log('my render', document.getElementById(this.state?.lastReadMessageId));
        const groupedMessages = this._getMessagesGroupedBySender();
        const messages = groupedMessages.map((group, index) => {
            const messageType = group[0] && group[0].messageType;

            return (
                <ChatMessageGroup
                    className = { messageType || MESSAGE_TYPE_REMOTE }
                    key = { index }
                    messages = { group } />
            );
        });

        return (
            <div
                aria-labelledby = 'chat-header'
                id = 'chatconversation'
                onScroll = { this._onChatScroll }
                ref = { this._messageListRef }
                role = 'log'
                tabIndex = { 0 }>
                <div />
                { messages }
                { !this.state.isScrolledToBottom && this.state.hasNewMessages
                    && <NewMessagesButton
                        inputChatHeight = { this.props._inputChatHeight }
                        onGoToFirstUnreadMessage = { this._onGoToFirstUnreadMessage } /> }
                <div
                    id = 'messagesListEnd'
                    ref = { this._messagesListEndRef } />
            </div>
        );
    }


    /**
     * Implements {@code Component#componentDidUpdate}.
     * When Component mount scroll message container to bottom.
     *
     * @inheritdoc
     */
    componentDidMount() {
        console.log('my did mount');
        this.scrollToBottom(false);

        // this.createObserver();
    }

    componentWillUnmount() {
        console.log('my will un mount');
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     * When components updates if user has the scroll position at bottom and receive a new message
     * scroll automatically to the bottom.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        console.log('my didUpdate');
        const hasNewMessages = this.props.messages !== prevProps.messages
         && this.props.messages.length !== prevProps.messages.length;

        if (hasNewMessages) {
            if (this.state.isScrolledToBottom) {
                this.scrollToBottom(true);
            } else {
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({ hasNewMessages: true });
            }

            // const id = this.props.messages[this.props.messages.length - 1].messageId;
            // const target = document.getElementById(id);

            // console.log('my target', target);
            // // eslint-disable-next-line react/no-did-update-set-state
            // this.setState({
            //     intersectionTarget: target
            // });
            // this.createObserver(target);
        }
    }

    /** Dawadwadawdwadawdawdaw.
     *  MaybeUpdateBottomScroll.
     * Scrolls to the bottom again if the instance had previously been scrolled.
     * To the bottom. This method is used when a resize has occurred below the.
     * Instance and bottom scroll needs to be maintained.
     * Need to double check with TIBI if I need this.
     *
     * @returns {void}
     */
    maybeUpdateBottomScroll() {
        if (this.state.isScrolledToBottom) {
            this.scrollToBottom(false);
        }
    }

    /**
     * Automatically scrolls the displayed chat messages down to the latest.
     *
     * @param {boolean} withAnimation - Whether or not to show a scrolling.
     * @param {HTMLElement} scrollToElement - Where to scroll.
     * animation.
     * @returns {void}
     */
    scrollToBottom(withAnimation: boolean, scrollToElement: HTMLElement = null) {
        const scrollTo = scrollToElement ? scrollToElement : this._messagesListEndRef.current;
        const block = scrollToElement ? 'center' : 'nearest';

        scrollIntoView(scrollTo, {
            behavior: withAnimation ? 'smooth' : 'auto',
            block
        });
    }

    _getMessagesGroupedBySender: () => Array<Array<Object>>;

    _onChatScroll: () => void;

    /** ....................
     *
     * @private
     * @returns {void}
     */
    _onChatScroll() {}


    _onGoToFirstUnreadMessage: () => void;

    /**
     * _onGoToFirstUnreadMessage.
     *
     * @private
     * @returns {void}
     */
    _onGoToFirstUnreadMessage() {
        // here I will scroll into last unread message.
        // const lastReadMessageId = this.state.lastReadMessageId
        //     ? this.state.lastReadMessageId : this.props._lastReadMessage.messageId;

        const lastReadMessageElement = document.getElementById(this.state.lastReadMessageId);


        this.scrollToBottom(true, lastReadMessageElement);

        this.setState({
            lastReadMessageId: null
        });
    }

    createObserver: () => void;

    /**
    * Create Observer.
     *
    * @param {HtmlElement} - - Target.
    * @private
    * @returns {void}
    */
    createObserver(target: HTMLElement) {
        let observer;

        const options = {
            root: document.querySelector('#chatconversation'),
            rootMargin: '16px',
            threshold: 0.8
        };

        console.log('my propst', this.props);

        // const target = document.querySelector('#messagesListEnd');
        // const target = this.state.intersectionTarget;

        if (target) {
            observer = new IntersectionObserver(this.handleIntersect, options);
            observer.observe(target);
        }
    }

    handleIntersect: () => void;

    /** .
* HandleIntersect.
*
* @param {Array} entries - List of entries.
* @private
* @returns {void}
*/
    handleIntersect(entries, observer) {
        console.log('my entries', entries, observer);

        entries.forEach(entry => {
            console.log('my entry', entry);
            if (entry.isIntersecting && this.props.messages.length > 0) {
                const lastMessage = this.props.messages.slice(this.props.messages.length - 1);
                const lastReadMessageId = lastMessage[0].messageId;

                this.setState(
                    {
                        isScrolledToBottom: true,
                        hasNewMessages: false,
                        lastReadMessageId
                    });
            }

            if (!entry.isIntersecting) {
                this.setState(
                    {
                        isScrolledToBottom: false
                    });
            }
        });
    }
}


/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @private
 * @returns {{
 *     _hasNewMessages: boolean,
 *     _inputChatHeight: number
 * }}
 */
function _mapStateToProps(state) {
    const { inputChatHeight, lastReadMessage } = state['features/chat'];

    return {
        _inputChatHeight: inputChatHeight,
        _lastReadMessage: lastReadMessage
    };
}

export default connect(_mapStateToProps)(MessageContainer);


// /**
//  * Implements React's {@link Component#getDerivedStateFromProps()}.
//  *
//  * @inheritdoc
//  */
//  static getDerivedStateFromProps(props, prevState) {
//     console.log('my getDerivedStateFromProps', props, prevState);
//     console.log('my getDerivedStateFromProps', this?.props, prevState);

//     return {
//         ...prevState
//     };
// }


