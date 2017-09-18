import PropTypes from 'prop-types';
import React from 'react';
import { TextInput } from 'react-native';
import Prompt from 'react-native-prompt';
import { connect } from 'react-redux';

import { translate } from '../../i18n';

import AbstractDialog from './AbstractDialog';

/**
 * Implements <tt>AbstractDialog</tt> on react-native using <tt>Prompt</tt>.
 */
class Dialog extends AbstractDialog {
    /**
     * <tt>AbstractDialog</tt>'s React <tt>Component</tt> prop types.
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
            children,
            okDisabled,
            okTitleKey = 'dialog.Ok',
            t,
            titleKey,
            titleString
        } = this.props;

        /* eslint-disable react/jsx-wrap-multilines */

        let element
            = <Prompt
                cancelText = { cancelDisabled ? undefined : t(cancelTitleKey) }
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                placeholder = { t(bodyKey) }
                submitText = { okDisabled ? undefined : t(okTitleKey) }
                title = { titleString || t(titleKey) }
                visible = { true } />;

        /* eslint-enable react/jsx-wrap-multilines */

        if (React.Children.count(children)) {
            // XXX The following implements a workaround with knowledge of the
            // implementation of react-native-prompt.
            element
                = this._replaceFirstElementOfType(
                    // eslint-disable-next-line no-extra-parens, new-cap
                    (new (element.type)(element.props)).render(),
                    TextInput,
                    children);
        }

        return element;
    }

    /**
     * Creates a deep clone of a specific <tt>ReactElement</tt> with the results
     * of calling a specific function on every node of a specific
     * <tt>ReactElement</tt> tree.
     *
     * @param {ReactElement} element - The <tt>ReactElement</tt> to clone and
     * call the specified <tt>f</tt> on.
     * @param {Function} f - The function to call on every node of the
     * <tt>ReactElement</tt> tree represented by the specified <tt>element</tt>.
     * @private
     * @returns {ReactElement}
     */
    _mapReactElement(element, f) {
        if (!element || !element.props || !element.type) {
            return element;
        }

        let mapped = f(element);

        if (mapped === element) {
            mapped
                = React.cloneElement(
                    element,
                    /* props */ undefined,
                    ...React.Children.toArray(React.Children.map(
                        element.props.children,
                        function(element) { // eslint-disable-line no-shadow
                            // eslint-disable-next-line no-invalid-this
                            return this._mapReactElement(element, f);
                        },
                        this)));
        }

        return mapped;
    }

    /**
     * Replaces the first <tt>ReactElement</tt> of a specific type found in a
     * specific <tt>ReactElement</tt> tree with a specific replacement
     * <tt>ReactElement</tt>.
     *
     * @param {ReactElement} element - The <tt>ReactElement</tt> tree to search
     * through and replace in.
     * @param {*} type - The type of the <tt>ReactElement</tt> to be replaced.
     * @param {ReactElement} replacement - The <tt>ReactElement</tt> to replace
     * the first <tt>ReactElement</tt> in <tt>element</tt> of the specified
     * <tt>type</tt>.
     * @private
     * @returns {ReactElement}
     */
    _replaceFirstElementOfType(element, type, replacement) {
        // eslint-disable-next-line no-shadow
        return this._mapReactElement(element, element => {
            if (replacement && element.type === type) {
                /* eslint-disable no-param-reassign */

                element = replacement;
                replacement = undefined;

                /* eslint-enable no-param-reassign */
            }

            return element;
        });
    }
}

export default translate(connect()(Dialog));
