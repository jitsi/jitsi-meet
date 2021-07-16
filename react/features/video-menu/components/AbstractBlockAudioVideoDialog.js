// @flow

import { Component } from 'react';

type Props = {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function,

    /**
     * Function to translate i18n labels.
     */
    t: Function
};

/**
 * Abstract dialog to confirm blocking mic and camera for all participants.
 */
export default class AbstractBlockAudioVideoDialog
    extends Component<Props> {
    /**
     * Initializes a new {@code AbstractBlockAudioVideoDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    _onSubmit: () => boolean;

    /**
     * Callback for the confirm button.
     *
     * @private
     * @returns {boolean} - True (to note that the modal should be closed).
     */
    _onSubmit() {

        return true;
    }
}
