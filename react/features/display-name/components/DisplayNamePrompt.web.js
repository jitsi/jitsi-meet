import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FieldTextStateless as TextField } from '@atlaskit/field-text';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import {
    getLocalParticipant,
    participantDisplayNameChanged
} from '../../base/participants';

/**
 * Implements a React {@code Component} for displaying a dialog with an field
 * for setting the local participant's display name.
 *
 * @extends Component
 */
class DisplayNamePrompt extends Component {
    /**
     * {@code DisplayNamePrompt} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The current ID for the local participant. Used for setting the
         * display name on the associated participant.
         */
        _localParticipantID: PropTypes.string,

        /**
         * Invoked to update the local participant's display name.
         */
        dispatch: PropTypes.func,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code DisplayNamePrompt} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * The name to show in the display name text field.
             *
             * @type {string}
             */
            displayName: ''
        };

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
        return (
            <Dialog
                isModal = { true }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.displayNameRequired'
                width = 'small'>
                <TextField
                    autoFocus = { true }
                    compact = { true }
                    label = { this.props.t('dialog.enterDisplayName') }
                    name = 'displayName'
                    onChange = { this._onDisplayNameChange }
                    shouldFitContainer = { true }
                    type = 'text'
                    value = { this.state.displayName } />
            </Dialog>);
    }

    /**
     * Updates the entered display name.
     *
     * @param {Object} event - The DOM event triggered from the entered display
     * name value having changed.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange(event) {
        this.setState({
            displayName: event.target.value
        });
    }

    /**
     * Dispatches an action to update the local participant's display name. A
     * name must be entered for the action to dispatch.
     *
     * @private
     * @returns {void}
     */
    _onSubmit() {
        const { displayName } = this.state;

        if (!displayName.trim()) {
            return false;
        }

        const { dispatch, _localParticipantID } = this.props;

        dispatch(
            participantDisplayNameChanged(_localParticipantID, displayName));

        return true;
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code DisplayNamePrompt}'s
 * props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _localParticipantID: string
 * }}
 */
function _mapStateToProps(state) {
    const { id } = getLocalParticipant(state);

    return {
        /**
         * The current ID for the local participant.
         *
         * @type {string}
         */
        _localParticipantID: id
    };
}

export default translate(connect(_mapStateToProps)(DisplayNamePrompt));
