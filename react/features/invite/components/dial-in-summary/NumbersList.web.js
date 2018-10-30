/* @flow */

import React, { Component } from 'react';

import { translate } from '../../../base/i18n';

type Props = {

    /**
     * Whether or not numbers should include links with the telephone protocol.
     */
    clickableNumbers: boolean,

    /**
     * The conference ID for dialing in.
     */
    conferenceID: number,

    /**
     * The phone numbers to display. Can be an array of numbers or an object
     * with countries as keys and an array of numbers as values.
     */
    numbers: { [string]: Array<string> } | Array<string>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * Displays a table with phone numbers to dial in to a conference.
 *
 * @extends Component
 */
class NumbersList extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { numbers, t } = this.props;

        return (
            <table className = 'dial-in-numbers-list'>
                <thead>
                    <tr>
                        { Array.isArray(numbers)
                            ? null
                            : <th>{ t('info.country') }</th> }
                        <th>{ t('info.numbers') }</th>
                    </tr>
                </thead>
                <tbody className = 'dial-in-numbers-body'>
                    { Array.isArray(numbers)
                        ? numbers.map(this._renderNumberRow)
                        : this._renderWithCountries(numbers) }
                </tbody>
            </table>);
    }

    /**
     * Renders rows of countries and associated phone numbers.
     *
     * @param {Object} numbersMapping - Things yeah.
     * @private
     * @returns {ReactElement[]}
     */
    _renderWithCountries(numbersMapping: Object) {
        const rows = [];

        for (const [ country, numbers ] of Object.entries(numbersMapping)) {
            if (!Array.isArray(numbers)) {
                return;
            }

            const formattedNumbers = numbers.map(number => {
                if (typeof number === 'string') {
                    return this._renderNumberDiv(number);
                }

                return null;
            });

            rows.push(
                <tr key = { country }>
                    <td>{ country }</td>
                    <td className = 'dial-in-numbers'>{ formattedNumbers }</td>
                </tr>
            );
        }

        return rows;
    }

    /**
     * Renders a table row for a phone number.
     *
     * @param {string} number - The phone number to display.
     * @private
     * @returns {ReactElement[]}
     */
    _renderNumberRow(number) {
        return (
            <tr key = { number }>
                <td className = 'dial-in-number'>
                    { this._renderNumberLink(number) }
                </td>
            </tr>
        );
    }

    /**
     * Renders a div container for a phone number.
     *
     * @param {string} number - The phone number to display.
     * @private
     * @returns {ReactElement[]}
     */
    _renderNumberDiv(number) {
        return (
            <div
                className = 'dial-in-number'
                key = { number }>
                { this._renderNumberLink(number) }
            </div>
        );
    }

    /**
     * Renders a ReactElement for displaying a telephone number. If the
     * component prop {@code clickableNumbers} is true, then the number will
     * have a link with the telephone protocol.
     *
     * @param {string} number - The phone number to display.
     * @private
     * @returns {ReactElement}
     */
    _renderNumberLink(number) {
        if (this.props.clickableNumbers) {
            return (
                <a
                    href = { `tel:${number}p${this.props.conferenceID}#` }
                    key = { number } >
                    { number }
                </a>
            );
        }

        return number;
    }

}

export default translate(NumbersList);
