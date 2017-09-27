import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Tooltip from '@atlaskit/tooltip';

import { translate } from '../../../base/i18n';

/**
 * React {@code Component} for showing an icon with a tooltip.
 *
 * @extends Component
 */
class BaseIndicator extends Component {
    /**
     * Default values for {@code BaseIndicator} component's properties.
     *
     * @static
     */
    static defaultProps = {
        className: '',
        iconClassName: '',
        iconSize: 'auto',
        id: '',
        tooltipPosition: 'top'
    };

    /**
     * {@code BaseIndicator} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Additional CSS class names to set on the icon container.
         */
        className: PropTypes.string,

        /**
         * The CSS classnames to set on the icon element of the component.
         */
        iconClassName: PropTypes.string,

        /**
         * The font size for the icon.
         */
        iconSize: PropTypes.string,

        /**
         * The ID attribue to set on the root element of the component.
         */
        id: PropTypes.string,

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func,

        /**
         * The translation key to use for displaying a tooltip when hovering
         * over the component.
         */
        tooltipKey: PropTypes.string,

        /**
         * From which side of the indicator the tooltip should appear from.
         * Defaults to "top".
         */
        tooltipPosition: PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            className,
            iconClassName,
            iconSize,
            id,
            t,
            tooltipKey,
            tooltipPosition
        } = this.props;

        const iconContainerClassName = `indicator-icon-container ${className}`;

        return (
            <div className = 'indicator-container'>
                <Tooltip
                    description = { t(tooltipKey) }
                    position = { tooltipPosition }>
                    <span
                        className = { iconContainerClassName }
                        id = { id }>
                        <i
                            className = { iconClassName }
                            style = {{ fontSize: iconSize }} />
                    </span>
                </Tooltip>
            </div>
        );
    }
}

export default translate(BaseIndicator);
