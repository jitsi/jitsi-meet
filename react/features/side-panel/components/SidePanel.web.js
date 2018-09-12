// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { smileys } from '../smileys.js';
import { toggleChat, toggleSmiley } from '../actions';
import { getLocalUserId, getLocalDisplayName } from '../functions';
import { translate } from '../../base/i18n';
import { processReplacements } from '../Replacement';

import NickNameForm from './NickName.web';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link SidePanel}.
 */
type Props = {

    _messages: Object,

    _conference: Object,

    _room: Object,

    _participants: Object,

    _panelStatus: Boolean,

    _smileyPanelStatus: Boolean,

    _current: String,

    _localUserId: String,

    _localDisplayName: String,

    dispatch: Function,

}

/**
 * The type of the React {@code Component} state of {@SidePanel}.
 */
type State = {


    /**
     * User provided nickname when the input text is provided in the view.
     *
     * @type {String}
     */
    message: string,
};


/**
 * React Component for holding features in a side panel that slides in and out.
 *
 * @extends Component
 */
class SidePanel extends Component<Props, State> {

    /**
     * Initializes a new {@code SidePanel} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {

            /**
             * The message user provides for chat input.
             */
            message: ''
        };

        this._onCloseClick = this._onCloseClick.bind(this);
        this._onSubmitMessage = this._onSubmitMessage.bind(this);
        this._onHandleChange = this._onHandleChange.bind(this);
        this._onEnterPress = this._onEnterPress.bind(this);
        this._onToggleSmiley = this._onToggleSmiley.bind(this);
        this._onAddSmiley = this._onAddSmiley.bind(this);
        this._renderSmiley = this._renderSmiley.bind(this);
    }

    _onCloseClick: () => void;

    /**
     * Callback invoked to hide {@code SidePanel}.
     *
     * @returns {void}
     */
    _onCloseClick() {
        this.props.dispatch(toggleChat());
    }

    _onToggleSmiley: () => void;

    /**
     * Callback invoked to hide or show smileys.
     *
     * @returns {void}
     */
    _onToggleSmiley() {
        this.props.dispatch(toggleSmiley());

    }

    _renderSmiley: () => void;

    /**
     * Renders smiley items.
     *
     * @returns {Array<ReactElement>}
     */
    _renderSmiley() {

        const smileyItems = [];

        for (let i = 1; i <= 21; i++) {
            smileyItems.push(
                <div
                    className = { 'smileyContainer' }
                    id = { `smiley${i}` }>
                    <img
                        className = { 'smiley' }
                        id = { `smiley${i}` }
                        onClick = { this._onAddSmiley }
                        src = { `images/smileys/smiley${i}.svg` } />
                </div>
            );
        }

        return smileyItems;
    }
    _onAddSmiley: (Event) => void;

    /**
     * Adds or appends smileys to chat message.
     *
     * @param {string} event - Keyboard event.
     * @returns {void}
     */
    _onAddSmiley(event: Event) {

        let smileyType;
        const target = event.target;

        if (typeof target.id === 'string') {
            smileyType = target.id;
        }
        const smileyText = smileys[smileyType];
        const smileyMessage = smileyInTextForm => {

            if (this.state.message === '') {
                return smileyInTextForm;
            }

            return `${this.state.message} ${smileyInTextForm} `;
        };

        this.setState({
            message: smileyMessage(smileyText)
        });


        this._onToggleSmiley();

    }

    _onHandleChange: (Event) => void;


    /**
     * Handles changes of message by setting it to state.
     *
     * @param {string} event - Keyboard event.
     * @returns {void}
     */
    _onHandleChange(event: Event) {
        const target = event.target;

        if (typeof target.value === 'string') {
            const currMessage = target.value;

            this.setState({
                message: currMessage
            });
        }
    }

    _onEnterPress: (Event) => void;

    /**
     * On Enter Press, trigger an event that will
     * submit the message in the chat window.
     *
     * @param {string} event - Keyboard event.
     * @returns {void}
     */
    _onEnterPress(event: Event) {
        if (event.keyCode === 13 && event.shiftKey === false) {
            event.preventDefault();
            this._onSubmitMessage(event);
        }
    }

    _renderMessage: (Object) => void;


    /**
     * Called by {@code _onSubmitMessage} to create the chat div.
     *
     * @param {string} message - The user message that was entered.
     * @returns {Array<ReactElement>}
     */
    _renderMessage(message: Object) {

        const localParticipant = this.props._localUserId
        === message.id ? 'localuser' : 'remoteuser';

        return (
            <div
                className = 'chatmessage'
                key = { message.id }>
                <img
                    className = 'chatArrow'
                    src = '../../../../images/chatArrow.svg' />
                <div
                    className = { `${localParticipant} username` }>
                    { message.userName }
                </div>
                <div className = { 'timestamp' }>{ message.timestamp }</div>
                <div
                    className = 'usermessage'
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML = {{ __html: message.message }} />
            </div>
        );
    }

    _onSubmitMessage: (Event) => void;


    /**
     * On Enter Press, submit the form for sending your message.
     *
     * @param {string} event - Keyboard event.
     * @returns {void}
     */
    _onSubmitMessage(event: Event) {

        let message;
        const target = event.target;

        event.preventDefault();
        if (typeof target.value === 'string') {
            message = target.value;

            this.setState({
                message
            });

            const processedMessage = processReplacements(message);

            this.props._conference.sendTextMessage(processedMessage);

            APP.API.notifySendingChatMessage(processedMessage);

            /** Clear state back to empty string */
            this.setState({
                message: ''
            });
        }


    }


    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {

        const sideToolBarClass = this.props._panelStatus
            ? 'slideInExt' : 'slideOutExt';
        const chatContainerClass
            = `sideToolbarContainer__inner is-conversation-mode 
            ${this.props._panelStatus ? 'show' : 'hide'}`;

        const textAreaStyle = {
            wordWrap: 'break-word',
            overflow: 'hidden',
            height: '70px'
        };

        const smileStyle = {
            height: '70px'
        };

        const displaySmileStyle = this.props._smileyPanelStatus
            ? { display: 'block' } : { display: 'none' };

        const chatContainerView = (
            <div
                className = { chatContainerClass }
                id = 'chat_container'>
                <div id = 'chatconversation' >
                    { this.props._messages
                        .map(message => this._renderMessage(message)) }
                </div>
                <div id = 'chat-input' >
                    <form
                        onSubmit = { this._onSubmitMessage }>
                        <textarea
                            data-i18n = '[placeholder]chat.messagebox'
                            id = 'usermsg'
                            onChange = { this._onHandleChange }
                            onKeyDown = { this._onEnterPress }
                            placeholder = { 'Enter Text...' }
                            style = { textAreaStyle }
                            value = { this.state.message } />
                    </form>
                </div>

                <div
                    id = 'smileysarea'
                    style = { smileStyle } >
                    <div id = 'smileys'>
                        <img
                            onClick = { this._onToggleSmiley }
                            src = '../../../../images/smile.svg' />
                    </div>
                </div>
                <div
                    id = { 'smileysContainer' }
                    style = { displaySmileStyle } >
                    { this._renderSmiley() }
                </div>
            </div>
        );

        let SidePanelView;

        if (this.props._localDisplayName) {
            SidePanelView = chatContainerView;
        } else {
            SidePanelView = <NickNameForm />;
        }


        return (
            <div
                className = { sideToolBarClass }
                id = 'sideToolbarContainer'>
                <div
                    className = 'side-toolbar-close'
                    onClick = { this._onCloseClick }>X</div>
                <div id = 'NickNameForm'>
                    { SidePanelView }
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to
 * {@link SidePanel} React {@code Component} props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {{}}
 */
function _mapStateToProps(state) {

    const messages = state['features/chat'].messages;
    const participants = state['features/base/participants'];

    const {
        conference,
        room
    } = state['features/base/conference'];

    const {
        panelStatus,
        current,
        smileyPanelStatus
    } = state['features/side-panel'];

    const localUserId = getLocalUserId(state);
    const localDisplayName = getLocalDisplayName(state);

    return {
        _messages: messages,
        _conference: conference,
        _room: room,
        _participants: participants,
        _panelStatus: panelStatus,
        _smileyPanelStatus: smileyPanelStatus,
        _current: current,
        _localUserId: localUserId,
        _localDisplayName: localDisplayName
    };
}

export default translate(connect(_mapStateToProps)(SidePanel));
