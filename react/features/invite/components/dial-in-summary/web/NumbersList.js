// @flow

import React, { Component } from 'react';

import { translate } from '../../../../base/i18n';

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

        return this._renderWithCountries(numbers);
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
        let hasFlags = false, numbers;

        if (Array.isArray(numbersMapping)) {
            hasFlags = true;
            numbers = numbersMapping.reduce(
                (resultNumbers, number) => {
                    // The i18n-iso-countries package insists on upper case.
                    const countryCode = number.countryCode.toUpperCase();
                    const countryName
                        = t(`countries:countries.${countryCode}`);

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

                if (Array.isArray(numbersArray)) {
                    /* eslint-disable arrow-body-style */
                    const formattedNumbers = numbersArray.map(number => ({
                        formattedNumber: number
                    }));
                    /* eslint-enable arrow-body-style */

                    numbers[country] = formattedNumbers;
                }
            }
        }

        const rows = [];

        Object.keys(numbers).forEach((countryName: string) => {
            const numbersArray = numbers[countryName];

            rows.push(
                <tr
                    className = 'number-group'
                    key = { countryName }>
                    { this._renderFlag(numbersArray[0].countryCode) }
                    <td className = 'country' >{ countryName }</td>
                    <td className = 'numbers-list-column'>
                        { this._renderNumbersList(numbersArray) }
                    </td>
                    <td className = 'toll-free-list-column' >
                        { this._renderNumbersTollFreeList(numbersArray) }
                    </td>
                </tr>
            );
        });

        return (
            <table className = 'dial-in-numbers-list'>
                <thead>
                    <tr>
                        { hasFlags ? <th /> : null}
                        <th>{ t('info.country') }</th>
                        <th>{ t('info.numbers') }</th>
                        <th />
                    </tr>
                </thead>
                <tbody className = 'dial-in-numbers-body'>
                    { rows }
                </tbody>
            </table>
        );
    }

    /**
     * Renders a div container for a flag for the country of the phone number.
     *
     * @param {string} countryCode - The country code flag to display.
     * @private
     * @returns {ReactElement}
     */
    _renderFlag(countryCode) {
        if (countryCode) {
            return (
                <td className = 'flag-cell'>
                    <i className = { `flag iti-flag ${countryCode}` } />
                </td>);
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
        const numbersListItems = numbers.map(number =>
            (<li
                className = 'dial-in-number'
                key = { number.formattedNumber }>
                { this._renderNumberLink(number.formattedNumber) }
            </li>));

        return (
            <ul className = 'numbers-list'>
                { numbersListItems }
            </ul>
        );
    }

    /**
     * Renders list with a toll free text on the position where there is a
     * number marked as toll free.
     *
     * @param {Array} numbers - The phone number that are displayed.
     * @private
     * @returns {ReactElement[]}
     */
    _renderNumbersTollFreeList(numbers) {
        const { t } = this.props;

        const tollNumbersListItems = numbers.map(number =>
            (<li
                className = 'toll-free'
                key = { number.formattedNumber }>
                { number.tollFree ? t('info.dialInTollFree') : '' }
            </li>));

        return (
            <ul className = 'toll-free-list'>
                { tollNumbersListItems }
            </ul>
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
            // Url encode # to %23, Android phone was cutting the # after
            // clicking it.
            // Seems that using ',' and '%23' works on iOS and Android.
            return (
                <a
                    href = { `tel:${number},${this.props.conferenceID}%23` }
                    key = { number } >
                    { number }
                </a>
            );
        }

        return number;
    }

}

export default translate(NumbersList);
