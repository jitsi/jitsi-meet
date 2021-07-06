// @flow

import { Checkbox } from '@atlaskit/checkbox';
import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import { Dialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import {
    updateSettings,
    shouldHideShareAudioHelper
} from '../../base/settings';
import { toggleScreensharing } from '../../base/tracks';

/**
 * The type of the React {@code Component} props of {@link ShareAudioDialog}.
 */
export type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Boolean stored in local storage that determines whether or not the dialog will be displayed again.
     */
     _shouldHideShareAudioHelper: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Component that displays the audio screen share helper dialog.
 */
class ShareAudioDialog extends Component<Props> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onContinue = this._onContinue.bind(this);
        this._onSelectHideShareAudioHelper = this._onSelectHideShareAudioHelper.bind(this);
    }

    _onContinue: () => boolean;

    /**
     * Continue the normal screen sharing flow when the user clicks continue.
     *
     * @returns {boolean}
     */
    _onContinue() {
        // Pass undefined as the first parameter so the underlying logic decides weather or not to stop screen sharing.
        this.props.dispatch(toggleScreensharing(undefined, true));

        return true;
    }

    _onSelectHideShareAudioHelper: (Object) => void;

    /**
     * Callback invoked when the hide audio helper checkbox has been selected. This setting will be persisted in
     * the local storage, thus the dialog won't be displayed again.
     *
     * @param {Object} e - The key event to handle.
     * @returns {void}
     */
    _onSelectHideShareAudioHelper({ target: { checked } }) {
        this.props.dispatch(updateSettings({ hideShareAudioHelper: checked }));
    }

    /**
     * Implements {@Component#render}.
     *
     * @inheritdoc
     */
    render() {

        const { t } = this.props;

        return (
            <Dialog
                hideCancelButton = { false }
                okKey = { t('dialog.shareAudio') }
                onSubmit = { this._onContinue }
                titleKey = { t('dialog.shareAudioTitle') }
                width = { 'medium' } >
                <div className = 'share-audio-dialog'>
                    <img
                        className = 'share-audio-animation'
                        src = 'images/share-audio.gif' />
                    <Checkbox
                        isChecked = { this.props._shouldHideShareAudioHelper }
                        label = { t('dialog.hideShareAudioHelper') }
                        name = 'hide-share-audio-helper'
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = { this._onSelectHideShareAudioHelper } />
                </div>
            </Dialog>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: Object): $Shape<Props> {

    return {
        _shouldHideShareAudioHelper: shouldHideShareAudioHelper(state)
    };
}


export default translate(connect(_mapStateToProps)(ShareAudioDialog));
