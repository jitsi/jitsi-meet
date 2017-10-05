import PropTypes from 'prop-types';
import React from 'react';
import { Modal, StyleSheet, TextInput } from 'react-native';
import Prompt from 'react-native-prompt';
import { connect } from 'react-redux';

import { translate } from '../../i18n';
import { LoadingIndicator } from '../../react';
import { set } from '../../redux';

import AbstractDialog from './AbstractDialog';
import styles from './styles';

/**
 * The value of the style property {@link _TAG_KEY} which identifies the
 * OK/submit button of {@code Prompt}.
 */
const _SUBMIT_TEXT_TAG_VALUE = '_SUBMIT_TEXT_TAG_VALUE';

/**
 * The name of the style property which identifies ancestors of {@code Prompt}
 * such as its OK/submit button for the purposes of workarounds implemented by
 * {@code Dialog}.
 *
 * XXX The value may trigger a react-native warning in the Debug configuration
 * but, unfortunately, I couldn't find a value that wouldn't.
 */
const _TAG_KEY = '_TAG_KEY';

/**
 * Implements {@code AbstractDialog} on react-native using {@code Prompt}.
 */
class Dialog extends AbstractDialog {
    /**
     * {@code AbstractDialog}'s React {@code Component} prop types.
     *
     * @static
     */
    static propTypes = {
        ...AbstractDialog.propTypes,

        /**
         * I18n key to put as body title.
         */
        bodyKey: PropTypes.string
    };

    state = {
        /**
         * The text of the {@link TextInput} rendered by {@link Prompt} in
         * general and by this {@code Dialog} in particular if no
         * {@code children} are specified to it. It mimics/reimplements the
         * functionality of {@code Prompt} because this {@code Dialog} does not
         * really render the (whole) {@code Prompt}.
         *
         * @type {string}
         */
        text: ''
    };

    /**
     * Initailizes a new {@code Dialog} instance.
     *
     * @param {Object} props - The read-only React {@code Component} props with
     * which the new instance is to be initialized.
     */
    constructor(props: Object) {
        super(props);

        // Bind event handlers so they are only bound once per instance.
        this._onChangeText = this._onChangeText.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            bodyKey,
            cancelDisabled,
            cancelTitleKey = 'dialog.Cancel',
            okDisabled,
            okTitleKey = 'dialog.Ok',
            t,
            titleKey,
            titleString
        } = this.props;

        const cancelButtonTextStyle
            = cancelDisabled ? styles.disabledButtonText : styles.buttonText;
        let submitButtonTextStyle
            = okDisabled ? styles.disabledButtonText : styles.buttonText;

        submitButtonTextStyle = {
            ...submitButtonTextStyle,
            [_TAG_KEY]: _SUBMIT_TEXT_TAG_VALUE
        };

        // eslint-disable-next-line no-extra-parens
        let element = (
            <Prompt
                cancelButtonTextStyle = { cancelButtonTextStyle }
                cancelText = { t(cancelTitleKey) }
                defaultValue = { this.state.text }
                onCancel = { this._onCancel }
                onChangeText = { this._onChangeText }
                onSubmit = { this._onSubmit }
                placeholder = { t(bodyKey) }
                submitButtonTextStyle = { submitButtonTextStyle }
                submitText = { t(okTitleKey) }
                textInputProps = { this.props.textInputProps }
                title = { titleString || t(titleKey) }
                visible = { true } />
        );

        // XXX The following implements workarounds with knowledge of
        // react-native-prompt/Prompt's implementation.

        // eslint-disable-next-line no-extra-parens, new-cap
        element = (new (element.type)(element.props)).render();

        let { children } = this.props;

        children = React.Children.count(children) ? children : undefined;

        // eslint-disable-next-line no-shadow
        element = this._mapReactElement(element, element => {
            const { type } = element;

            if (type === Modal) {
                // * Modal handles hardware button presses for back navigation.
                //   Firstly, we don't want Prompt's default behavior to merely
                //   hide the Modal - we want this Dialog to be canceled.
                //   Secondly, we cannot get Prompt's default behavior anyway
                //   because we've removed Prompt and we're preserving whatever
                //   it's rendered only.
                return this._cloneElement(element, /* props */ {
                    onRequestClose: this._onCancel
                });
            }

            if (type === TextInput) {
                // * If this Dialog has children, they are to be rendered
                //   instead of Prompt's TextInput.
                if (children) {
                    element = children; // eslint-disable-line no-param-reassign
                    children = undefined;
                }

            } else {
                let { style } = element.props;

                if (style
                        && (style = StyleSheet.flatten(style))
                        && _TAG_KEY in style) {
                    switch (style[_TAG_KEY]) {
                    case _SUBMIT_TEXT_TAG_VALUE:
                        if (this.state.submitting) {
                            // * If this Dialog is submitting, render a
                            //   LoadingIndicator.
                            return (
                                <LoadingIndicator
                                    color = { submitButtonTextStyle.color }
                                    size = { 'small' } />
                            );
                        }
                        break;
                    }

                    return this._cloneElement(element, /* props */ {
                        style: set(style, _TAG_KEY, undefined)
                    });
                }
            }

            return element;
        });

        return element;
    }

    /**
     * Clones a specific {@code ReactElement} and adds/merges specific props
     * into the clone.
     *
     * @param {ReactElement} element - The {@code ReactElement} to clone.
     * @param {Object} props - The props to add/merge into the clone.
     * @returns {ReactElement} The close of the specified {@code element} with
     * the specified {@code props} added/merged.
     */
    _cloneElement(element, props) {
        return (
            React.cloneElement(
                element,
                props,
                ...React.Children.toArray(element.props.children)));
    }

    /**
     * Creates a deep clone of a specific {@code ReactElement} with the results
     * of calling a specific function on every node of a specific
     * {@code ReactElement} tree.
     *
     * @param {ReactElement} element - The {@code ReactElement} to clone and
     * call the specified {@code f} on.
     * @param {Function} f - The function to call on every node of the
     * {@code ReactElement} tree represented by the specified {@code element}.
     * @private
     * @returns {ReactElement}
     */
    _mapReactElement(element, f) {
        if (!element || !element.props || !element.type) {
            return element;
        }

        let mapped = f(element);

        if (mapped) {
            const { children } = mapped.props;

            if (mapped === element || React.Children.count(children)) {
                mapped
                    = React.cloneElement(
                        mapped,
                        /* props */ undefined,
                        ...React.Children.toArray(React.Children.map(
                            children,
                            function(element) { // eslint-disable-line no-shadow
                                // eslint-disable-next-line no-invalid-this
                                return this._mapReactElement(element, f);
                            },
                            this)));
            }
        }

        return mapped;
    }

    _onChangeText: (string) => void;

    /**
     * Notifies this {@code Dialog} that the text/value of the {@code TextInput}
     * rendered by {@code Prompt} has changed.
     *
     * @param {string} text - The new text/value of the {@code TextInput}
     * rendered by {@code Prompt}.
     * @returns {void}
     */
    _onChangeText(text: string) {
        this.setState({ text });
    }

    /**
     * Submits this {@code Dialog} with the value of the {@link TextInput}
     * rendered by {@link Prompt} unless a value is explicitly specified.
     *
     * @override
     * @param {string} [value] - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value: ?string) {
        super._onSubmit(value || this.state.text);
    }
}

export default translate(connect()(Dialog));
