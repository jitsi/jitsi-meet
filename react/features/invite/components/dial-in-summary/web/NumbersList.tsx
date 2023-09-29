import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import React, { useCallback, useMemo } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconSip } from '../../../../base/icons/svg';

countries.registerLocale(en);

interface INormalizedNumber {

    /**
     * The country code.
     */
    countryCode?: string;

    /**
     * The formatted number.
     */
    formattedNumber: string;

    /**
     * Whether the number is toll-free.
     */
    tollFree?: boolean;
}

interface INumbersMapping {
    [countryName: string]: Array<INormalizedNumber>;
}

interface IProps extends WithTranslation {

    /**
     * Whether or not numbers should include links with the telephone protocol.
     */
    clickableNumbers: boolean;

    /**
     * The conference ID for dialing in.
     */
    conferenceID: number | null;

    /**
     * The phone numbers to display. Can be an array of number Objects or an
     * object with countries as keys and an array of numbers as values.
     */
    numbers: INumbersMapping | null;

}

const NumbersList: React.FC<IProps> = ({ t, conferenceID, clickableNumbers, numbers: numbersMapping }) => {
    const renderFlag = useCallback((countryCode: string) => {
        if (countryCode) {
            return (
                <td className = 'flag-cell'>
                    {countryCode === 'SIP' || countryCode === 'SIP_AUDIO_ONLY'
                        ? <Icon src = { IconSip } />
                        : <i className = { `flag iti-flag ${countryCode}` } />
                    }
                </td>);
        }

        return null;
    }, []);

    const renderNumberLink = useCallback((number: string) => {
        if (clickableNumbers) {
            // Url encode # to %23, Android phone was cutting the # after
            // clicking it.
            // Seems that using ',' and '%23' works on iOS and Android.
            return (
                <a
                    href = { `tel:${number},${conferenceID}%23` }
                    key = { number } >
                    {number}
                </a>
            );
        }

        return number;
    }, [ conferenceID, clickableNumbers ]);

    const renderNumbersList = useCallback((numbers: Array<INormalizedNumber>) => {
        const numbersListItems = numbers.map(number =>
            (<li
                className = 'dial-in-number'
                key = { number.formattedNumber }>
                {renderNumberLink(number.formattedNumber)}
            </li>));

        return (
            <ul className = 'numbers-list'>
                {numbersListItems}
            </ul>
        );
    }, []);

    const renderNumbersTollFreeList = useCallback((numbers: Array<INormalizedNumber>) => {
        const tollNumbersListItems = numbers.map(number =>
            (<li
                className = 'toll-free'
                key = { number.formattedNumber }>
                {number.tollFree ? t('info.dialInTollFree') : ''}
            </li>));

        return (
            <ul className = 'toll-free-list'>
                {tollNumbersListItems}
            </ul>
        );
    }, []);

    const renderNumbers = useMemo(() => {
        let numbers: INumbersMapping;

        if (!numbersMapping) {
            return;
        }

        if (Array.isArray(numbersMapping)) {
            numbers = numbersMapping.reduce(
                (resultNumbers: any, number: any) => {
                    // The i18n-iso-countries package insists on upper case.
                    const countryCode = number.countryCode.toUpperCase();
                    let countryName;

                    if (countryCode === 'SIP') {
                        countryName = t('info.sip');
                    } else if (countryCode === 'SIP_AUDIO_ONLY') {
                        countryName = t('info.sipAudioOnly');
                    } else {
                        countryName = t(`countries:countries.${countryCode}`);

                        // Some countries have multiple names as US ['United States of America', 'USA']
                        // choose the first one if that is the case
                        if (!countryName) {
                            countryName = t(`countries:countries.${countryCode}.0`);
                        }
                    }

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

        const rows: [JSX.Element] = [] as unknown as [JSX.Element];

        Object.keys(numbers).forEach((countryName: string) => {
            const numbersArray: Array<INormalizedNumber> = numbers[countryName];
            const countryCode = numbersArray[0].countryCode
                || countries.getAlpha2Code(countryName, 'en')?.toUpperCase()
                || countryName;

            rows.push(
                <>
                    <tr
                        key = { countryName }>
                        {renderFlag(countryCode)}
                        <td className = 'country' >{countryName}</td>
                    </tr>
                    <tr>
                        <td />
                        <td className = 'numbers-list-column'>
                            {renderNumbersList(numbersArray)}
                        </td>
                        <td className = 'toll-free-list-column' >
                            {renderNumbersTollFreeList(numbersArray)}
                        </td>
                    </tr>
                </>
            );
        });

        return rows;
    }, [ numbersMapping ]);

    return (
        <table className = 'dial-in-numbers-list'>
            <tbody className = 'dial-in-numbers-body'>
                {renderNumbers}
            </tbody>
        </table>
    );
};

export default translate(NumbersList);
