import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import { IconHighlight } from '../../../../base/icons/svg';
import Label from '../../../../base/label/components/native/Label';
import BaseTheme from '../../../../base/ui/components/BaseTheme';
import AbstractHighlightButton, {
    IProps as AbstractProps,
    _abstractMapStateToProps
} from '../AbstractHighlightButton';
import styles from '../styles.native';

interface IProps extends AbstractProps {

    _disabled: boolean;

    /**
     * Flag controlling visibility of the component.
     */
    _visible: boolean;
}

/**
 * React {@code Component} responsible for displaying an action that
 * allows users to highlight a meeting moment.
 */
export class HighlightButton extends AbstractHighlightButton<IProps> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            _disabled,
            _visible,
            t
        } = this.props;

        if (!_visible || _disabled) {
            return null;
        }

        return (
            <Label
                icon = { IconHighlight }
                iconColor = { BaseTheme.palette.field01 }
                style = { styles.highlightButton }
                text = { t('recording.highlight') }
                textStyle = { styles.highlightButtonText } />
        );
    }
}

export default translate(connect(_abstractMapStateToProps)(HighlightButton));
