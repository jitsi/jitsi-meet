// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Dialog, DialogContent } from '../../base/dialog';
import { translate } from '../../base/i18n';

import { clearRecentList } from '../actions';

type Props = {

    /**
     * The Redux Dispatch function.
     */
    dispatch: Function,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements a confirm dialog for clearing the recent list.
 *
 * @extends Component
 */
class ClearRecentListDialog extends Component<Props> {
    /**
     * Initializes a new {@code ClearRecentListDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okTitleKey = 'dialog.confirm'
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.confirm'
                width = 'small'>
                <DialogContent>
                    { this.props.t('recentList.confirmClear') }
                </DialogContent>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;

    /**
     * Clears the recent list.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {
        this.props.dispatch(clearRecentList());

        return true;
    }
}

export default translate(connect()(ClearRecentListDialog));
