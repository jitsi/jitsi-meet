/* @flow */

import { FieldTextStateless as TextField } from '@atlaskit/field-text';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createE2EEEvent, sendAnalytics } from '../../analytics';
import { Dialog } from '../../base/dialog';
import { translate, translateToHTML } from '../../base/i18n';
import { getParticipants } from '../../base/participants';
import { connect } from '../../base/redux';
import { setE2EEKey } from '../actions';


type Props = {

    /**
     * Indicates whether all participants in the conference currently support E2EE.
     */
    _everyoneSupportsE2EE: boolean,

    /**
     * The current E2EE key.
     */
    _key: string,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

type State = {

    /**
     * The current E2EE key.
     */
    key: string
};

/**
 * Implements a React {@code Component} for displaying a dialog with a field
 * for setting the E2EE key.
 *
 * @extends Component
 */
class E2EEDialog extends Component<Props, State> {
    /**
     * Initializes a new {@code E2EEDialog  } instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            key: this.props._key
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onKeyChange = this._onKeyChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _everyoneSupportsE2EE, t } = this.props;

        return (
            <Dialog
                isModal = { false }
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.e2eeTitle'
                width = 'small'>
                <div className = 'e2ee-destription'>
                    { translateToHTML(t, 'dialog.e2eeDescription') }
                </div>
                {
                    !_everyoneSupportsE2EE
                        && <div className = 'e2ee-warn'>
                            { translateToHTML(t, 'dialog.e2eeWarning') }
                        </div>
                }
                <TextField
                    autoFocus = { true }
                    compact = { true }
                    label = { t('dialog.e2eeLabel') }
                    name = 'e2eeKey'
                    onChange = { this._onKeyChange }
                    shouldFitContainer = { true }
                    type = 'password'
                    value = { this.state.key } />
            </Dialog>);
    }

    _onKeyChange: (Object) => void;

    /**
     * Updates the entered key.
     *
     * @param {Object} event - The DOM event triggered from the entered value having changed.
     * @private
     * @returns {void}
     */
    _onKeyChange(event) {
        this.setState({ key: event.target.value.trim() });
    }

    _onSubmit: () => boolean;

    /**
     * Dispatches an action to update the E2EE key.
     *
     * @private
     * @returns {boolean}
     */
    _onSubmit() {
        const { key } = this.state;

        sendAnalytics(createE2EEEvent(`key.${key ? 'set' : 'unset'}`));
        this.props.dispatch(setE2EEKey(key));

        return true;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function mapStateToProps(state) {
    const { e2eeKey } = state['features/e2ee'];
    const participants = getParticipants(state).filter(p => !p.local);

    return {
        _everyoneSupportsE2EE: participants.every(p => Boolean(p.e2eeSupported)),
        _key: e2eeKey || ''
    };
}

export default translate(connect(mapStateToProps)(E2EEDialog));
