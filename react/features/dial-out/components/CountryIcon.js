import React, { Component } from 'react';

/**
 * Implements a React Component to render a country flag icon.
 */
class CountryIcon extends Component {
    /**
     * {@code CountryIcon}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The css style class name.
         */
        className: React.PropTypes.string,

        /**
         * The 2-letter country code.
         */
        countryCode: React.PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const iconClassName
            = `flag-icon flag-icon-${this.props.countryCode}
             flag-icon-squared ${this.props.className}`;

        return <span className = { iconClassName } />;

    }
}

export default CountryIcon;
