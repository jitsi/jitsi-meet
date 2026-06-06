import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { updateSettings } from '../../../base/settings/actions';
import { shouldHideShareAudioHelper } from '../../../base/settings/functions.web';
import { toggleScreensharing } from '../../../base/tracks/actions.web';
import Checkbox from '../../../base/ui/components/web/Checkbox';
import Dialog from '../../../base/ui/components/web/Dialog';

/**
 * The type of the React {@code Component} props of {@link ShareAudioDialog}.
 */
export interface IProps extends WithTranslation {

    /**
     * Boolean stored in local storage that determines whether or not the dialog will be displayed again.
     */
    _shouldHideShareAudioHelper: boolean;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];
}

/**
 * Component that displays the audio screen share helper dialog.
 */
class ShareAudioDialog extends Component<IProps> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onContinue = this._onContinue.bind(this);
        this._onSelectHideShareAudioHelper = this._onSelectHideShareAudioHelper.bind(this);
    }

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

    /**
     * Callback invoked when the hide audio helper checkbox has been selected. This setting will be persisted in
     * the local storage, thus the dialog won't be displayed again.
     *
     * @param {Object} e - The key event to handle.
     * @returns {void}
     */
    _onSelectHideShareAudioHelper({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) {
        this.props.dispatch(updateSettings({ hideShareAudioHelper: checked }));
    }

    /**
     * Implements {@Component#render}.
     *
     * @inheritdoc
     */
    override render() {

        const { t } = this.props;

        return (
            <Dialog
                ok = {{ translationKey: 'dialog.shareAudio' }}
                onSubmit = { this._onContinue }
                size = 'large'
                titleKey = { t('dialog.shareAudioTitle') }>
                <div className = 'share-audio-dialog'>
                    <img
                        alt = { t('dialog.shareAudioAltText') }
                        className = 'share-audio-animation'
                        src = 'images/share-audio.gif'
                        tabIndex = { 0 } />
                    <Checkbox
                        checked = { this.props._shouldHideShareAudioHelper }
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
 * @param {IReduxState} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {

    return {
        _shouldHideShareAudioHelper: Boolean(shouldHideShareAudioHelper(state))
    };
}


export default translate(connect(_mapStateToProps)(ShareAudioDialog));
