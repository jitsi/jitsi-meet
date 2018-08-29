// @flow

import React, { Component } from 'react';

declare var APP: Object;

/**
 * The type of the React {@code Component} state of {@NickName}.
 */
type State = {

    /**
     * User provided nickname when the input text is provided in the view.
     *
     * @type {string}
     */
    nickname: string
}

/**
 * The type of the React {@code Component} props of {@link NickName}.
 */
type Props = {

}

/**
 * React Component for nickname view that is a subset of the SidePanel.
 *
 * @extends Component
 */
class NickNameForm extends Component<Props, State> {

    /**
     * Initializes a new {@code Nickname} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {

        super(props);

        this.state = {

            /**
             * The nickname provided by user.
             */
            nickname: ''
        };

        this._onEnterPress = this._onEnterPress.bind(this);
        this._onHandleChange = this._onHandleChange.bind(this);
    }

    _onEnterPress: (Event) => void;

    /**
     * Dispatches an action to hit enter to change your displayname.
     *
     * @private
     * @param {event} event - Keyboard event
     * that will check if user has pushed the enter key.
     * @returns {void}
     */
    _onEnterPress(event: Event) {
        if (event.keyCode === 13 && event.shiftKey === false) {

            event.preventDefault();

            let nickName;
            const target = event.target;

            if (typeof target.value === 'string') {

                nickName = target.value;

                /** Only executing localDisplayName change and clear
                 * of state if message is not empty string **/
                if (target.value !== '') {

                    APP.conference.changeLocalDisplayName(nickName);

                    /** SetState to empty string after name change **/
                    this.setState({
                        nickname: ''
                    });
                }
            }


        }
    }

    _onHandleChange: (Event) => void;

    /**
     * Dispatches an action to change
     * state when user inputs text in the input field.
     *
     * @private
     * @param {event} event - Keyboard event.
     * @returns {void}
     */
    _onHandleChange(event: Event) {
        const target = event.target;

        if (typeof target.value === 'string') {
            this.setState({
                nickname: target.value
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
        return (
            <div id = 'nickname'>
                <span
                    data-i18n = 'chat.nickname.title'>
                    Enter a nickname in the box below</span>
                <form onSubmit = { this._onEnterPress }>
                    <input
                        autoFocus = { true }
                        className = 'input-control'
                        data-i18n = '[placeholder]chat.nickname.popover'
                        id = 'nickinput'
                        onChange = { this._onHandleChange }
                        onKeyDown = { this._onEnterPress }
                        placeholder = 'Choose a nickname'
                        type = 'text'
                        value = { this.state.nickname } />
                </form>
            </div>
        );
    }
}


export default NickNameForm;

