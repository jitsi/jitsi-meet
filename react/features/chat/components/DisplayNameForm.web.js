// @flow

import { FieldTextStateless } from '@atlaskit/field-text';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import {
    getLocalParticipant,
    participantDisplayNameChanged
} from '../../base/participants';

/**
 * The type of the React {@code Component} props of {@DisplayNameForm}.
 */
type Props = {

    /**
     * The ID of the local participant.
     */
    _localParticipantId: string,

    /**
     * Invoked to set the local participant display name.
     */
    dispatch: Dispatch<*>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * The type of the React {@code Component} state of {@DisplayNameForm}.
 */
type State = {

    /**
     * User provided display name when the input text is provided in the view.
     */
    displayName: string
};

/**
 * React Component for requesting the local participant to set a display name.
 *
 * @extends Component
 */
class DisplayNameForm extends Component<Props, State> {
    state = {
        displayName: ''
    };

    /**
     * Initializes a new {@code DisplayNameForm} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div id = 'nickname'>
                <span>{ this.props.t('chat.nickname.title') }</span>
                <form onSubmit = { this._onSubmit }>
                    <FieldTextStateless
                        autoFocus = { true }
                        id = 'nickinput'
                        onChange = { this._onDisplayNameChange }
                        placeholder = { t('chat.nickname.popover') }
                        type = 'text'
                        value = { this.state.displayName } />
                </form>
            </div>
        );
    }

    _onDisplayNameChange: (Object) => void;

    /**
     * Dispatches an action update the entered display name.
     *
     * @param {event} event - Keyboard event.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange(event: Object) {
        this.setState({ displayName: event.target.value });
    }

    _onSubmit: (Object) => void;

    /**
     * Dispatches an action to hit enter to change your display name.
     *
     * @param {event} event - Keyboard event
     * that will check if user has pushed the enter key.
     * @private
     * @returns {void}
     */
    _onSubmit(event: Object) {
        event.preventDefault();

        this.props.dispatch(participantDisplayNameChanged(
            this.props._localParticipantId,
            this.state.displayName));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code DisplayNameForm} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _localParticipantId: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        _localParticipantId: getLocalParticipant(state).id
    };
}

export default translate(connect(_mapStateToProps)(DisplayNameForm));
