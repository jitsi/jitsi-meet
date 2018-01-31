import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

/**
 * Displays a table with phone numbers to dial in to a conference.
 *
 * @extends Component
 */
class NumbersTable extends Component {
    /**
     * {@code NumbersTable} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * The phone numbers to display. Can be an array of numbers
         * or an object with countries as keys and an array of numbers
         * as values.
         */
        numbers: PropTypes.oneOfType([
            PropTypes.array,
            PropTypes.object
        ]),

        /**
         * Invoked to obtain translated strings.
         */
        t: PropTypes.func
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const showWithoutCountries = Array.isArray(this.props.numbers);

        return (
            <table className = 'dial-in-numbers-table'>
                <thead>
                    <tr>
                        { showWithoutCountries
                            ? null
                            : <th>{ this.props.t('info.country') }</th> }
                        <th>{ this.props.t('info.numbers') }</th>
                    </tr>
                </thead>
                <tbody>
                    { showWithoutCountries
                        ? this._renderWithoutCountries()
                        : this._renderWithCountries() }
                </tbody>
            </table>);
    }

    /**
     * Renders rows of countries and associated phone numbers.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderWithCountries() {
        const rows = [];

        for (const [ country, numbers ] of Object.entries(this.props.numbers)) {
            const formattedNumbers = numbers.map(number =>
                <div key = { number }>{ number }</div>);

            rows.push(
                <tr key = { country }>
                    <td>{ country }</td>
                    <td>{ formattedNumbers }</td>
                </tr>
            );
        }

        return rows;
    }

    /**
     * Renders a column of phone numbers.
     *
     * @private
     * @returns {ReactElement[]}
     */
    _renderWithoutCountries() {
        return this.props.numbers.map(number =>
            <tr key = { number }><td>{ number }</td></tr>);
    }
}

export default translate(NumbersTable);
