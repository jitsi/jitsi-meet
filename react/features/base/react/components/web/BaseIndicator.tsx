import React from 'react';
import { WithTranslation } from 'react-i18next';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../../i18n/functions';
import Icon from '../../../icons/components/Icon';
import Tooltip from '../../../tooltip/components/Tooltip';
import { TOOLTIP_POSITION } from '../../../ui/constants.any';

/**
 * The type of the React {@code Component} props of {@link BaseIndicator}.
 */
interface IProps extends WithTranslation {

    /**
     * Additional CSS class name.
     */
    className?: string;

    /**
     * The icon component to use.
     */
    icon: Function;

    /**
     * The CSS classnames to set on the icon element of the component.
    */
    iconClassName?: string;

    /**
     * The color of the icon.
     */
    iconColor?: string;

    /**
     * Id of the icon to be rendered.
     */
    iconId?: string;

    /**
     * The font size for the icon.
     */
    iconSize: string | number;

    /**
     * The ID attribute to set on the root element of the component.
     */
    id?: string;

    /**
     * The translation key to use for displaying a tooltip when hovering over
     * the component.
     */
    tooltipKey: string;

    /**
     * From which side of the indicator the tooltip should appear from,
     * defaulting to "top".
     */
    tooltipPosition: TOOLTIP_POSITION;
}

const useStyles = makeStyles()(() => {
    return {
        indicator: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    };
});

/**
 * React {@code Component} for showing an icon with a tooltip.
 *
 * @returns {ReactElement}
 */
const BaseIndicator = ({
    className = '',
    icon,
    iconClassName,
    iconColor,
    iconId,
    iconSize,
    id = '',
    t,
    tooltipKey,
    tooltipPosition = 'top'
}: IProps) => {
    const { classes: styles } = useStyles();
    const style: { fontSize?: string | number; } = {};

    if (iconSize) {
        style.fontSize = iconSize;
    }

    return (
        <div className = { styles.indicator }>
            <Tooltip
                content = { t(tooltipKey) }
                position = { tooltipPosition }>
                <span
                    className = { className }
                    id = { id }>
                    <Icon
                        alt = { t(tooltipKey) }
                        className = { iconClassName }
                        color = { iconColor }
                        id = { iconId }
                        src = { icon }
                        style = { style } />
                </span>
            </Tooltip>
        </div>
    );
};

export default translate(BaseIndicator);
