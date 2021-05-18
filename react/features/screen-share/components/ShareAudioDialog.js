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
import { isAudioOnlySharing, isScreenVideoShared } from '../functions';

/**
 * The type of the React {@code Component} props of {@link ShareAudioDialog}.
 */
export type Props = {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * TODO
     */
    _isAudioOnlySharing: boolean,

     /**
      * TODO
      */
    _isScreenVideoShared: boolean,

    /**
     * TODO
     */
     _shouldHideShareAudioHelper: boolean,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Component that displays the share audio helper dialog.
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
    }

    _onContinue: () => void;

    /**
     * TODO.
     *
     * @returns {void}
     */
    _onContinue() {
        const enable = !this.props._isAudioOnlySharing;

        // First parameter is only used in the mobile flow, and this feature is only
        // available on web, so it doesn't have any effect but we add it for consistency.
        this.props.dispatch(toggleScreensharing(enable, true));

        return true;
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
                    <Checkbox
                        isChecked = { this.props._shouldHideShareAudioHelper }
                        label = { t('dialog.hideShareAudioHelper') }
                        name = 'hide-share-audio-helper'
                        // eslint-disable-next-line react/jsx-no-bind
                        onChange = {
                            ({ target: { checked } }) =>
                                this.props.dispatch(updateSettings({ hideShareAudioHelper: checked }))
                        } />
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
function _mapStateToProps(state): Object {

    return {
        _isAudioOnlySharing: isAudioOnlySharing(state),
        _isScreenVideoShared: isScreenVideoShared(state),
        _shouldHideShareAudioHelper: shouldHideShareAudioHelper(state)

    };
}


export default translate(connect(_mapStateToProps)(ShareAudioDialog));
