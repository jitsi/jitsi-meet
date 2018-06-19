/* @flow */

import InlineDialog from '@atlaskit/inline-dialog';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { ToolbarButton } from '../../toolbox';

import LocalRecordingInfoDialog from './LocalRecordingInfoDialog';

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
        const iconClasses
            = `icon-thumb-menu ${isDialogShown
                ? 'icon-rec toggled' : 'icon-rec'}`;

        return (
            <div className = 'toolbox-button-wth-dialog'>
                <InlineDialog
                    content = {
                        <LocalRecordingInfoDialog />
                    }
                    isOpen = { isDialogShown }
                    onClose = { this._onCloseDialog }
                    position = { 'top right' }>
                    <ToolbarButton
                        iconName = { iconClasses }
                        onClick = { this._onClick }
                        tooltip = { t('localRecording.dialogTitle') } />
                </InlineDialog>
            </div>
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

    _onCloseDialog: () => void;

    /**
     * Callback invoked when {@code InlineDialog} signals that it should be
     * close.
     *
     * @returns {void}
     */
    _onCloseDialog() {
        // Do nothing for now, because we want the dialog to stay open
        // after certain time, otherwise the moderator might need to repeatly
        // open the dialog to see the stats.
    }
}

export default translate(LocalRecordingButton);
