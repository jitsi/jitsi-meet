// @flow
import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';

import Icon from '../../icons/components/Icon';
import { withPixelLineHeight } from '../../styles/functions.web';
import { COLORS } from '../constants';

import AbstractLabel, {
    type Props as AbstractProps
} from './AbstractLabel';

type Props = AbstractProps & {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * Own CSS class name.
     */
    className: string,

    /**
     * The color of the label.
     */
    color: string,


    /**
     * HTML ID attribute to add to the root of {@code Label}.
     */
    id: string,

    /**
     * Click handler if any.
     */
    onClick?: Function,

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
        label: {
            ...withPixelLineHeight(theme.typography.labelRegular),

            alignItems: 'center',
            background: theme.palette.ui04,
            borderRadius: theme.shape.borderRadius / 2,
            color: theme.palette.text01,
            display: 'flex',
            height: 28,
            margin: '0 0 4px 4px',
            padding: '0 8px'
        },
        withIcon: {
            marginLeft: 8
        },
        clickable: {
            cursor: 'pointer'
        },
        [COLORS.white]: {
            background: theme.palette.text01,
            color: theme.palette.ui04,

            '& svg': {
                fill: theme.palette.ui04
            }
        },
        [COLORS.green]: {
            background: theme.palette.success02
        },
        [COLORS.red]: {
            background: theme.palette.actionDanger
        }
    };
};


/**
 * React Component for showing short text in a circle.
 *
 * @augments Component
 */
class Label extends AbstractLabel<Props, *> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const {
            classes,
            className,
            color,
            icon,
            id,
            onClick,
            text
        } = this.props;
        const labelClassName = clsx(
            classes.label,
            onClick && classes.clickable,
            color && classes[color],
            className
        );

        return (
            <div
                className = { labelClassName }
                id = { id }
                onClick = { onClick }>
                { icon && <Icon
                    size = '16'
                    src = { icon } /> }
                { text && <span className = { icon && classes.withIcon }>{text}</span> }
            </div>
        );
    }
}

export default withStyles(styles)(Label);
