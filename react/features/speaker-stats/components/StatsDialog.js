// @flow

import React, { Component } from 'react';

import { DialogWithTabs, hideDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect, toState } from '../../base/redux';

import RaisedHandStats from './RaisedHandStats';
import SpeakerStats from './SpeakerStats';

/**
 * The type of the React {@code Component} props of {@link StatsDialog}.
 */
type Props = {

    /**
     * The JitsiConference from which stats will be pulled.
     */
    conference: Object,

    /**
     * Tabs for stats dialog.
     */
    _tabs: Object,

    /**
     * The function to translate human-readable text.
     */
    t: Function,
};

/**
 * A React {@code Component} for displaying a dialog with tabs for speaker stats
 * and raised hand stats. This version is using directly store to get
 * the participants state.
 *
 * @extends Component
 */
class SpeakerDialog extends Component<Props> {
    /**
     * Initializes a new {@code StatsDialog} instance.
     *
     * @param {Props} props - The React {@code Component} props to initialize
     * the new {@code StatsDialog} instance with.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._closeDialog = this._closeDialog.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _tabs } = this.props;

        return (
            <DialogWithTabs
                closeDialog = { this._closeDialog }
                cssClassName = 'settings-dialog'
                hideCancelButton = { true }
                onSubmit = { this._closeDialog }
                tabs = { _tabs }
                titleKey = 'speakerStats.dialogTitle' />
        );
    }

    _closeDialog: () => void;

    /**
     * Callback invoked to close the dialog without saving changes.
     *
     * @private
     * @returns {void}
     */
    _closeDialog() {
        this.props.dispatch(hideDialog());
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code StatsDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     tabs: Array<Object>
 * }}
 */
function _mapStateToProps(state) {
    const stateful = toState(state);
    const { conference } = stateful['features/base/conference'];

    const tabs = [
        {
            name: 'SpeakerStats',
            component: SpeakerStats,
            props: {
                conference
            },
            label: 'speakerStats.speakerStats',
            styles: 'settings-pane'
        },
        {
            name: 'RaisedHandStats',
            component: RaisedHandStats,
            props: {
                conference
            },
            label: 'speakerStats.raisedHandStats',
            styles: 'settings-pane'
        }
    ];

    return {
        _tabs: tabs
    };
}

export default translate(connect(_mapStateToProps)(SpeakerDialog));
