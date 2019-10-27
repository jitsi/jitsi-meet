/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { IconRec } from '../../base/icons';
import { ToolbarButton } from '../../toolbox';

/**
 * The type of the React {@code Component} state of
 * {@link LocalRecordingButton}.
 */
type Props = {

    /**
     * Whether or not {@link LocalRecordingInfoDialog} should be displayed.
     */
    isDialogShown: boolean,

    /**
     * Callback function called when {@link LocalRecordingButton} is clicked.
     */
    onClick: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * A React {@code Component} for opening or closing the
 * {@code LocalRecordingInfoDialog}.
 *
 * @extends Component
 */
class LocalRecordingButton extends Component<Props> {

    /**
     * Initializes a new {@code LocalRecordingButton} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { isDialogShown, t } = this.props;

        return (
            <ToolbarButton
                accessibilityLabel
                    = { t('toolbar.accessibilityLabel.localRecording') }
                icon = { IconRec }
                onClick = { this._onClick }
                toggled = { isDialogShown }
                tooltip = { t('localRecording.dialogTitle') } />
        );
    }

    _onClick: () => void;

    /**
     * Callback invoked when the Toolbar button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this.props.onClick();
    }
}

export default translate(LocalRecordingButton);
