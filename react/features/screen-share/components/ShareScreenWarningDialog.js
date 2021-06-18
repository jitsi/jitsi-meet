// @flow

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import { toggleScreensharing } from '../../base/tracks';

export type Props = {

    /**
     * The redux {@code dispatch} function.
     */
     dispatch: Dispatch<any>,

    /**
     * Whether or not the dialog was opened for the audio screen sharing flow or the normal one.
     */
    _isAudioScreenShareWarning: Boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 *  Component that displays the share audio helper dialog.
 */
class ShareScreenWarningDialog extends Component<Props> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onStopSharing = this._onStopSharing.bind(this);
    }

    _onStopSharing: () => boolean;

    /**
     * Stop current screen sharing session.
     *
     * @returns {boolean}
     */
    _onStopSharing() {
        // Depending on the context from which this dialog is opened we'll either be toggling off an audio only
        // share session or a normal screen sharing one, this is indicated by the _isAudioScreenShareWarning prop.
        this.props.dispatch(toggleScreensharing(undefined,
            !this.props._isAudioScreenShareWarning));

        return true;
    }

    /**
     * Implements {@Component#render}.
     *§
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        let description1, description2, header1, header2, stopSharing, title;

        if (this.props._isAudioScreenShareWarning) {
            header1 = 'dialog.shareAudioWarningH1';
            header2 = 'dialog.shareMediaWarningGenericH2';
            description1 = 'dialog.shareAudioWarningD1';
            description2 = 'dialog.shareAudioWarningD2';
            title = 'dialog.shareAudioWarningTitle';
            stopSharing = 'toolbar.stopScreenSharing';
        } else {
            header1 = 'dialog.shareScreenWarningTitle';
            header2 = 'dialog.shareMediaWarningGenericH2';
            description1 = 'dialog.shareScreenWarningD1';
            description2 = 'dialog.shareScreenWarningD2';
            title = 'dialog.shareScreenWarningTitle';
            stopSharing = 'toolbar.stopAudioSharing';
        }

        return (<Dialog
            hideCancelButton = { false }
            okKey = { t(stopSharing) }
            onSubmit = { this._onStopSharing }
            titleKey = { t(title) }
            width = { 'small' }>
            <div className = 'share-screen-warn-dialog'>
                <p className = 'header'> { t(header1) } </p>
                <p className = 'description' > { t(description1) } </p>
                <div className = 'separator-line' />
                <p className = 'header' > { t(header2) } </p>
                <p className = 'description' > { t(description2) } </p>
            </div>
        </Dialog>);

    }
}

export default translate(connect()(ShareScreenWarningDialog));
