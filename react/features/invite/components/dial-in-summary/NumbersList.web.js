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
     * The phone numbers to display. Can be an array of number Objects or an
     * object with countries as keys and an array of numbers as values.
     */
    numbers: { [string]: Array<string> } | Array<Object>,

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
        const { numbers } = this.props;

        return (
            <div className = 'dial-in-numbers-list'>
                { this._renderWithCountries(numbers) }
            </div>);
    }

    /**
     * Renders rows of countries and associated phone numbers.
     *
     * @param {Object|Array<Object>} numbersMapping - An object with country
     * names as keys and values as arrays of phone numbers.
     * @private
     * @returns {ReactElement[]}
     */
    _renderWithCountries(
            numbersMapping: { numbers: Array<string> } | Array<Object>) {
        const { t } = this.props;
        let numbers;

        if (Array.isArray(numbersMapping)) {
            numbers = numbersMapping.reduce(
                (resultNumbers, number) => {
                    const countryName
                        = t(`countries:countries.${number.countryCode}`);

                    if (resultNumbers[countryName]) {
                        resultNumbers[countryName].push(number);
                    } else {
                        resultNumbers[countryName] = [ number ];
                    }

                    return resultNumbers;
                }, {});
        } else {
            numbers = {};

            for (const [ country, numbersArray ]
                of Object.entries(numbersMapping.numbers)) {
                if (!Array.isArray(numbersArray)) {
                    return;
                }

                /* eslint-disable arrow-body-style */
                const formattedNumbers = numbersArray.map(number => ({
                    formattedNumber: number
                }));
                /* eslint-enable arrow-body-style */

                numbers[country] = formattedNumbers;
            }
        }

        let hrKey = 0;
        const rows = [ <hr key = { hrKey++ } /> ];

        Object.keys(numbers).forEach((countryName: string) => {
            const numbersArray = numbers[countryName];

            rows.push(
                <div
                    className = 'number-group'
                    key = { countryName }>
                    {this._renderFlag(numbersArray[0].countryCode)}
                    <div className = 'numbers-and-country' >
                        <div className = 'country' > { countryName } </div>
                        <ul className = 'numbers-list'>
                            {this._renderNumbersList(numbersArray)}
                        </ul>
                        <ul className = 'toll-free-list' >
                            {this._renderNumbersTollFreeList(numbersArray)}
                        </ul>
                    </div>
                </div>
            );
            rows.push(<hr key = { hrKey++ } />);
        });

        return rows;
    }

    /**
     * Renders a div container for a phone number.
     *
     * @param {string} countryCode - The phone number to display.
     * @private
     * @returns {ReactElement}
     */
    _renderFlag(countryCode) {
        const OFFSET = 127397;

        if (countryCode) {
            // ensure country code is all caps
            const cc = countryCode.toUpperCase();

            // return the emoji flag corresponding to country_code or null
            const countryFlag = /^[A-Z]{2}$/.test(cc)
                ? String.fromCodePoint(...[ ...cc ]
                    .map(c => c.charCodeAt() + OFFSET))
                : null;

            return <div className = 'flag'>{ countryFlag }</div>;
        }

        return null;
    }

    /**
     * Renders a div container for a phone number.
     *
     * @param {Array} numbers - The phone number to display.
     * @private
     * @returns {ReactElement[]}
     */
    _renderNumbersList(numbers) {
        return numbers.map(number =>
            (<li
                className = 'number-row'
                key = { number.formattedNumber }>
                { number.formattedNumber }
            </li>));
    }

    /**
     * Renders a div container for a phone number.
     *
     * @param {Array} numbers - The phone number to display.
     * @private
     * @returns {ReactElement[]}
     */
    _renderNumbersTollFreeList(numbers) {
        return numbers.map(number =>
            (<li
                className = 'toll-free'
                key = { number.formattedNumber }>
                { number.tollFree ? 'Toll Free' : '' }
            </li>));
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
