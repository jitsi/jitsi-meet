/* @flow */

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { createE2EEEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { Switch } from '../../base/react';
import { connect } from '../../base/redux';
import { toggleE2EE } from '../actions';
import { doesEveryoneSupportE2EE } from '../functions';

type Props = {

    /**
     * Custom e2ee labels.
     */
    _e2eeLabels: Object,

    /**
     * Whether E2EE is currently enabled or not.
     */
    _enabled: boolean,

    /**
     * Indicates whether all participants in the conference currently support E2EE.
     */
    _everyoneSupportE2EE: boolean,

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
     * True if the switch is toggled on.
     */
    enabled: boolean
};

/**
 * Implements a React {@code Component} for displaying a security dialog section with a field
 * for setting the E2EE key.
 *
 * @extends Component
 */
class E2EESection extends Component<Props, State> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: Props, state: Object) {
        if (props._enabled !== state.enabled) {

            return {
                enabled: props._enabled
            };
        }

        return null;
    }

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            enabled: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onToggle = this._onToggle.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _e2eeLabels, _everyoneSupportE2EE, t } = this.props;
        const { enabled } = this.state;
        const description = _e2eeLabels?.description || t('dialog.e2eeDescription');
        const label = _e2eeLabels?.label || t('dialog.e2eeLabel');
        const warning = _e2eeLabels?.warning || t('dialog.e2eeWarning');

        return (
            <div id = 'e2ee-section'>
                <p
                    aria-live = 'polite'
                    className = 'description'
                    id = 'e2ee-section-description'>
                    { description }
                    { !_everyoneSupportE2EE && <br /> }
                    { !_everyoneSupportE2EE && warning }
                </p>
                <div className = 'control-row'>
                    <label htmlFor = 'e2ee-section-switch'>
                        { label }
                    </label>
                    <Switch
                        id = 'e2ee-section-switch'
                        onValueChange = { this._onToggle }
                        value = { enabled } />
                </div>
            </div>
        );
    }

    _onToggle: () => void;

    /**
     * Callback to be invoked when the user toggles E2EE on or off.
     *
     * @private
     * @returns {void}
     */
    _onToggle() {
        const newValue = !this.state.enabled;

        this.setState({
            enabled: newValue
        });

        sendAnalytics(createE2EEEvent(`enabled.${String(newValue)}`));
        this.props.dispatch(toggleE2EE(newValue));
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
    const { enabled } = state['features/e2ee'];
    const { e2eeLabels } = state['features/base/config'];

    return {
        _e2eeLabels: e2eeLabels,
        _enabled: enabled,
        _everyoneSupportE2EE: doesEveryoneSupportE2EE(state)
    };
}

export default translate(connect(mapStateToProps)(E2EESection));
