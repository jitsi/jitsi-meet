// @flow

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import type { AbstractButtonProps } from '../../../base/toolbox/components';
import React from 'react';

import AbstractTokDetailsButton
    from '../../../base/toolbox/components/AbstractTokDetailsButton';

/**
 * The type of the React {@code Component} props of {@link DownloadButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implements an {@link AbstractSelfieButton} to open the user documentation in a new window.
 */
    ///This class is used to show the tok details
class TokDetails extends AbstractTokDetailsButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.tokDetails';
    label = 'toolbar.tokDetails';
    tooltip = 'TokDetails';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    constructor(props: Props) {
        super(props);
    }


    /**
     * Helper function to perform the download action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _tokDescription() {
    }
}

export default translate(connect()(TokDetails));
