import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import Popover from '../../../../base/popover/components/Popover.web';
import { withPixelLineHeight } from '../../../../base/styles/functions.web';
import { setDialOutCountry, setDialOutNumber } from '../../../actions.web';
import { getDialOutCountry, getDialOutNumber } from '../../../functions';
import { getCountryFromDialCodeText } from '../../../utils';

import CountryDropDown from './CountryDropdown';
import CountrySelector from './CountrySelector';

const PREFIX_REG = /^(00)|\+/;

interface IProps {

    /**
     * The country to dial out to.
     */
    dialOutCountry: { code: string; dialCode: string; name: string; };

    /**
     * The number to dial out to.
     */
    dialOutNumber: string;

    /**
     * Handler used when user presses 'Enter'.
     */
    onSubmit: Function;

    /**
     * Sets the dial out country.
     */
    setDialOutCountry: Function;

    /**
     * Sets the dial out number.
     */
    setDialOutNumber: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            border: 0,
            borderRadius: theme.shape.borderRadius,
            display: 'flex',
            backgroundColor: theme.palette.ui03
        },

        input: {
            padding: '0 4px',
            margin: 0,
            border: 0,
            background: 'transparent',
            color: theme.palette.text01,
            flexGrow: 1,
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        }
    };
});

const CountryPicker = (props: IProps) => {
    const [ isOpen, setIsOpen ] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { classes } = useStyles();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const onChange = ({ target: { value: newValue } }: React.ChangeEvent<HTMLInputElement>) => {
        if (PREFIX_REG.test(newValue)) {
            const textWithDialCode = newValue.replace(PREFIX_REG, '');

            if (textWithDialCode.length >= 4) {
                const country = getCountryFromDialCodeText(textWithDialCode);

                if (country) {
                    const rest = textWithDialCode.replace(country.dialCode, '');

                    props.setDialOutCountry(country);
                    props.setDialOutNumber(rest);

                    return;
                }
            }
        }
        props.setDialOutNumber(newValue);
    };

    const onCountrySelectorClick = () => {
        setIsOpen(open => !open);
    };

    const onDropdownClose = () => {
        setIsOpen(false);
    };

    const onEntryClick = (country: { code: string; dialCode: string; name: string; }) => {
        props.setDialOutCountry(country);
        onDropdownClose();
    };

    const onKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            props.onSubmit();
        }
    };

    return (
        /* eslint-disable react/jsx-no-bind */
        <Popover
            content = { <CountryDropDown onEntryClick = { onEntryClick } /> }
            onPopoverClose = { onDropdownClose }
            position = 'bottom'
            trigger = 'click'
            visible = { isOpen }>
            <div className = { classes.container }>
                <CountrySelector
                    country = { props.dialOutCountry }
                    onClick = { onCountrySelectorClick } />
                <input
                    className = { classes.input }
                    onChange = { onChange }
                    onKeyPress = { onKeyPress }
                    ref = { inputRef }
                    value = { props.dialOutNumber } />
            </div>
        </Popover>
    );
};

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    return {
        dialOutCountry: getDialOutCountry(state),
        dialOutNumber: getDialOutNumber(state)
    };
}

/**
 * Maps redux actions to the props of the component.
 *
 * @type {{
 *     setDialOutCountry: Function,
 *     setDialOutNumber: Function
 * }}
 */
const mapDispatchToProps = {
    setDialOutCountry,
    setDialOutNumber
};

export default connect(mapStateToProps, mapDispatchToProps)(CountryPicker);
