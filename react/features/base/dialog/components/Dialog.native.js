// @flow

import _ from 'lodash';
import React from 'react';
import { Modal, StyleSheet, TextInput } from 'react-native';
import Prompt from 'react-native-prompt';
import { connect } from 'react-redux';

import { translate } from '../../i18n';
import { LoadingIndicator } from '../../react';
import { set } from '../../redux';

import AbstractDialog from './AbstractDialog';
import type {
    Props as AbstractDialogProps,
    State as AbstractDialogState
} from './AbstractDialog';
import { dialog as styles } from './styles';

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
 * The type of the React {@code Component} props of {@link Dialog}.
 */
type Props = {
    ...AbstractDialogProps,

    /**
     * I18n key to put as body title.
     */
    bodyKey: string,

    textInputProps: Object
};

/**
 * The type of the React {@code Component} state of {@link Dialog}.
 */
type State = {
    ...AbstractDialogState,

    /**
     * The text of the {@link TextInput} rendered by {@link Prompt} in
     * general and by this {@code Dialog} in particular if no
     * {@code children} are specified to it. It mimics/reimplements the
     * functionality of {@code Prompt} because this {@code Dialog} does not
     * really render the (whole) {@code Prompt}.
     */
    text: string
};

/**
 * Implements {@code AbstractDialog} on react-native using {@code Prompt}.
 */
class Dialog extends AbstractDialog<Props, State> {
    state = {
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
            t /* XXX The following silences flow errors: */ = _.identity,
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

        let el: ?React$Element<*> = ( // eslint-disable-line no-extra-parens
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

        if (el) {
            // eslint-disable-next-line new-cap, no-extra-parens
            el = (new (el.type)(el.props)).render();
        }

        let { children } = this.props;

        children = React.Children.count(children) ? children : undefined;

        // eslint-disable-next-line no-shadow
        el = this._mapReactElement(el, (el: React$Element<*>) => {
            const { type } = el;

            if (type === Modal) {
                // * Modal handles hardware button presses for back navigation.
                //   Firstly, we don't want Prompt's default behavior to merely
                //   hide the Modal - we want this Dialog to be canceled.
                //   Secondly, we cannot get Prompt's default behavior anyway
                //   because we've removed Prompt and we're preserving whatever
                //   it's rendered only.
                return this._cloneElement(el, /* props */ {
                    onRequestClose: this._onCancel,
                    supportedOrientations: [ 'landscape', 'portrait' ]
                });
            }

            if (type === TextInput) {
                // * If this Dialog has children, they are to be rendered
                //   instead of Prompt's TextInput.
                if (children) {
                    // $FlowFixMe
                    el = children; // eslint-disable-line no-param-reassign
                    children = undefined;
                }

            } else {
                let { style } = el.props;

                if (style
                        && (style = StyleSheet.flatten(style))
                        && _TAG_KEY in style) {
                    // $FlowFixMe
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

                    return this._cloneElement(el, /* props */ {
                        style: set(style, _TAG_KEY, undefined)
                    });
                }
            }

            return el;
        });

        return el;
    }

    /**
     * Clones a specific {@code ReactElement} and adds/merges specific props
     * into the clone.
     *
     * @param {ReactElement} el - The {@code ReactElement} to clone.
     * @param {Object} props - The props to add/merge into the clone.
     * @returns {ReactElement} The close of the specified {@code el} with
     * the specified {@code props} added/merged.
     */
    _cloneElement(el: React$Element<*>, props) {
        return (
            React.cloneElement(
                el,
                props,
                ...React.Children.toArray(el.props.children)));
    }

    /**
     * Creates a deep clone of a specific {@code ReactElement} with the results
     * of calling a specific function on every node of a specific
     * {@code ReactElement} tree.
     *
     * @param {ReactElement} el - The {@code ReactElement} to clone and
     * call the specified {@code f} on.
     * @param {Function} f - The function to call on every node of the
     * {@code ReactElement} tree represented by the specified {@code el}.
     * @private
     * @returns {ReactElement}
     */
    _mapReactElement(
            el: ?React$Element<*>,
            f: (React$Element<*>) => ?React$Element<*>): ?React$Element<*> {
        if (!el || !el.props || !el.type) {
            return el;
        }

        let mapped = f(el);

        if (mapped) {
            const { children } = mapped.props;

            if (mapped === el || React.Children.count(children)) {
                mapped
                    = React.cloneElement(
                        mapped,
                        /* props */ {},
                        ...React.Children.toArray(React.Children.map(
                            children,
                            function(el) { // eslint-disable-line no-shadow
                                // eslint-disable-next-line no-invalid-this
                                return this._mapReactElement(el, f);
                            },
                            this)));
            }
        }

        return mapped;
    }

    _onCancel: () => void;

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

    _onSubmit: (?string) => void;

    /**
     * Submits this {@code Dialog} with the value of the {@link TextInput}
     * rendered by {@link Prompt} unless a value is explicitly specified.
     *
     * @override
     * @param {string} [value] - The submitted value if any.
     * @returns {void}
     */
    _onSubmit(value: ?string) {
        // $FlowFixMeState
        super._onSubmit(value || this.state.text);
    }
}

export default translate(connect()(Dialog));
