// @flow

import { withStyles } from '@material-ui/core';
import React from 'react';

import { translate } from '../../../../base/i18n';
import { IconHighlight } from '../../../../base/icons';
import { Label } from '../../../../base/label';
import { connect } from '../../../../base/redux';
import { Tooltip } from '../../../../base/tooltip';
import BaseTheme from '../../../../base/ui/components/BaseTheme';
import AbstractHighlightButton, {
    _abstractMapStateToProps,
    type Props as AbstractProps
} from '../AbstractHighlightButton';

type Props = AbstractProps & {
    _disabled: boolean,

    /**
     * The message to show within the label's tooltip.
     */
    _tooltipKey: string,

    /**
     * Flag controlling visibility of the component.
     */
    _visible: boolean,
};

/**
 * Creates the styles for the component.
 *
 * @param {Object} theme - The current UI theme.
 *
 * @returns {Object}
 */
const styles = theme => {
    return {
        regular: {
            background: theme.palette.field02,
            margin: '0 4px 4px 4px'
        },
        disabled: {
            background: theme.palette.text02,
            margin: '0 4px 4px 4px'
        }
    };
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
            classes,
            t
        } = this.props;


        if (!_visible) {
            return null;
        }

        const className = _disabled ? classes.disabled : classes.regular;
        const tooltipKey = _disabled ? 'recording.highlightMomentDisabled' : 'recording.highlightMoment';

        return (
            <Tooltip
                content = { t(tooltipKey) }
                position = { 'bottom' }>
                <Label
                    className = { className }
                    icon = { IconHighlight }
                    iconColor = { _disabled ? BaseTheme.palette.text03 : BaseTheme.palette.field01 }
                    id = 'highlightMeetingLabel'
                    onClick = { this._onClick } />
            </Tooltip>
        );
    }
}

export default withStyles(styles)(translate(connect(_abstractMapStateToProps)(HighlightButton)));
