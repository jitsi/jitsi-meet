// @flow

import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';

import { translate } from '../../base/i18n';


/**
 * The type of the React {@code Component} props of
 * {@link MicrosoftSignInButton}.
 */
type Props = {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * The callback to invoke when {@code MicrosoftSignInButton} is clicked.
     */
    onClick: Function,

    /**
     * The text to display within {@code MicrosoftSignInButton}.
     */
    text: string,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

const styles = () => {
    /**
     * The Microsoft sign in button must follow Microsoft's brand guidelines.
     * See: https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-branding-guidelines.
     */
    return {
        root: {
            alignItems: 'center',
            background: '#FFFFFF',
            border: '1px solid #8C8C8C',
            boxSizing: 'border-box',
            cursor: 'pointer',
            display: 'inline-flex',
            fontFamily: 'Segoe UI, Roboto, arial, sans-serif',
            height: '41px',
            padding: '12px'
        },
        cta: {
            display: 'inline-block',
            color: '#5E5E5E',
            fontSize: '15px',
            lineHeight: '41px'
        },
        logo: {
            display: 'inline-block',
            marginRight: '12px'
        }
    };
};

/**
 * A React Component showing a button to sign in with Microsoft.
 *
 * @augments Component
 */
class MicrosoftSignInButton extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div
                className = { this.props.classes.root }
                onClick = { this.props.onClick }>
                <img
                    alt = { this.props.t('welcomepage.logo.microsoftLogo') }
                    className = { this.props.classes.logo }
                    src = 'images/microsoftLogo.svg' />
                <div className = { this.props.classes.cta }>
                    { this.props.text }
                </div>
            </div>
        );
    }
}

export default translate(withStyles(styles)(MicrosoftSignInButton));
