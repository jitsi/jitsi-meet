/* @flow */

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createE2EEEvent, sendAnalytics } from '../../analytics';
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
     * True if the key is being edited.
     */
    editing: boolean,

    /**
     * The current E2EE key.
     */
    key: string
};

/**
 * Implements a React {@code Component} for displaying a security dialog section with a field
 * for setting the E2EE key.
 *
 * @extends Component
 */
class E2EESection extends Component<Props, State> {
    fieldRef: Object;

    /**
     * Initializes a new {@code E2EEDialog  } instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.fieldRef = React.createRef();

        this.state = {
            editing: false,
            key: this.props._key
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onKeyChange = this._onKeyChange.bind(this);
        this._onSet = this._onSet.bind(this);
        this._onToggleSetKey = this._onToggleSetKey.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _everyoneSupportsE2EE, t } = this.props;
        const { editing } = this.state;

        return (
            <div id = 'e2ee-section'>
                <p className = 'title'>
                    { t('dialog.e2eeTitle') }
                </p>
                <p className = 'description'>
                    { translateToHTML(t, 'dialog.e2eeDescription') }
                </p>
                {
                    !_everyoneSupportsE2EE
                        && <span className = 'warning'>
                            { t('dialog.e2eeWarning') }
                        </span>
                }
                <div className = 'key-field'>
                    <label>
                        { t('dialog.e2eeLabel') }:
                    </label>
                    <input
                        disabled = { !editing }
                        name = 'e2eeKey'
                        onChange = { this._onKeyChange }
                        placeholder = { t('dialog.e2eeNoKey') }
                        ref = { this.fieldRef }
                        type = 'password'
                        value = { this.state.key } />
                    { editing && <a onClick = { this._onSet }>
                        { t('dialog.e2eeSet') }
                    </a> }
                    { !editing && <a onClick = { this._onToggleSetKey }>
                        { t('dialog.e2eeToggleSet') }
                    </a> }
                </div>
            </div>
        );
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

    _onSet: () => void;

    /**
     * Dispatches an action to set/unset the E2EE key.
     *
     * @private
     * @returns {void}
     */
    _onSet() {
        const { key } = this.state;

        sendAnalytics(createE2EEEvent(`key.${key ? 'set' : 'unset'}`));
        this.props.dispatch(setE2EEKey(key));

        this.setState({
            editing: false
        });
    }

    _onToggleSetKey: () => void;

    /**
     * Sets the section into edit mode so then the user can set the key.
     *
     * @returns {void}
     */
    _onToggleSetKey() {
        this.setState({
            editing: true
        }, () => {
            this.fieldRef.current.focus();
        });
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

export default translate(connect(mapStateToProps)(E2EESection));
