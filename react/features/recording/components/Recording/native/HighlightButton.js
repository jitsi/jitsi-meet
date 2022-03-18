// @flow

import React from 'react';
import type { Dispatch } from 'redux';

import { translate } from '../../../../base/i18n';
import { IconHighlight } from '../../../../base/icons';
import { Label } from '../../../../base/label';
import { connect } from '../../../../base/redux';
import BaseTheme from '../../../../base/ui/components/BaseTheme';
import AbstractHighlightButton, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractHighlightButton';
import styles from '../styles.native';

type Props = AbstractProps & {
    _disabled: boolean,

    /**
     * Flag controlling visibility of the component.
     */
    _visible: boolean,

    dispatch: Dispatch<any>
};

/**
 * React {@code Component} responsible for displaying an action that
 * allows users to highlight a meeting moment.
 */
export class HighlightButton extends AbstractHighlightButton<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
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
                id = 'highlightMeetingLabel'
                style = { styles.highlightButton }
                text = { t('recording.highlight') }
                textStyle = { styles.highlightButtonText } />
        );
    }
}

export default translate(connect(_abstractMapStateToProps)(HighlightButton));
