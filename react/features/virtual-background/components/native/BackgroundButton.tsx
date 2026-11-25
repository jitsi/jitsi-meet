import React from 'react';
import { connect } from 'react-redux';

import { openSheet } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconImage } from '../../../base/icons/svg';
import AbstractButton, { IProps } from '../../../base/toolbox/components/AbstractButton';

import BackgroundPicker from './BackgroundPicker';

/** Opens the native background picker from the toolbox. */
class BackgroundButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.selectBackground';
    override icon = IconImage;
    override label = 'toolbar.selectBackground';

    /**
     * Opens the background picker bottom sheet.
     *
     * @returns {void}
     */
    override _handleClick() {
        this.props.dispatch(openSheet(BackgroundPicker));
    }
}

const ConnectedButton = translate(connect()(BackgroundButton));

/**
 * Renders the connected toolbox button that opens the background picker.
 *
 * @param {IProps} props - Props for the toolbox button.
 * @returns {JSX.Element} The connected toolbox button.
 */
export default function BackgroundButtonContainer(props: IProps) {
    return (
        <ConnectedButton
            { ...props }
            afterClick = { undefined }
            handleClick = { undefined } />
    );
}
