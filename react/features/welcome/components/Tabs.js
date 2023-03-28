// @flow
import React, { useCallback, useEffect, useState } from 'react';

/**
 * The type of the React {@code Component} props of {@link Tabs}.
 */
type Props = {

    /**
     * Accessibility label for the tabs container.
     *
     */
    accessibilityLabel: string,

    /**
     * Tabs information.
     */
    tabs: Object
};

/**
 * A React component that implements tabs.
 *
 * @returns {ReactElement} The component.
 */
const Tabs = ({ accessibilityLabel, tabs }: Props) => {
    const [ current, setCurrent ] = useState(0);

    const onClick = useCallback(index => event => {
        event.preventDefault();
        setCurrent(index);
    }, []);

    const onKeyDown = useCallback(index => event => {
        let newIndex = null;

        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            newIndex = index === 0 ? tabs.length - 1 : index - 1;
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            newIndex = index === tabs.length - 1 ? 0 : index + 1;
        }

        if (newIndex !== null) {
            setCurrent(newIndex);
        }
    }, [ tabs ]);

    useEffect(() => {
        // this test is needed to make sure the effect is triggered because of user actually changing tab
        if (document.activeElement?.getAttribute('role') === 'tab') {
            document.querySelector(`#${`${tabs[current].id}-tab`}`)?.focus();
        }

    }, [ current, tabs ]);

    return (
        <div className = 'tab-container'>
            { tabs.length > 1
                ? (
                    <>
                        <div
                            aria-label = { accessibilityLabel }
                            className = 'tab-buttons'
                            role = 'tablist'>
                            {tabs.map((tab, index) => (
                                <button
                                    aria-controls = { `${tab.id}-panel` }
                                    aria-selected = { current === index ? 'true' : 'false' }
                                    id = { `${tab.id}-tab` }
                                    key = { tab.id }
                                    onClick = { onClick(index) }
                                    onKeyDown = { onKeyDown(index) }
                                    role = 'tab'
                                    tabIndex = { current === index ? undefined : -1 }>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {tabs.map((tab, index) => (
                            <div
                                aria-labelledby = { `${tab.id}-tab` }
                                className = { current === index ? 'tab-content' : 'hide' }
                                id = { `${tab.id}-panel` }
                                key = { tab.id }
                                role = 'tabpanel'
                                tabIndex = { 0 }>
                                {tab.content}
                            </div>
                        ))}
                    </>
                )
                : (
                    <>
                        <h2 className = 'sr-only'>{accessibilityLabel}</h2>
                        <div className = 'tab-content'>{tabs[0].content}</div>
                    </>
                )
            }
        </div>
    );
};

export default Tabs;
