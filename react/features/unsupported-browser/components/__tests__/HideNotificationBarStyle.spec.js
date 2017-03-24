/* @flow */

import { render } from 'enzyme';
import React from 'react';

import HideNotificationBarStyle from '../HideNotificationBarStyle';

declare var describe: Function;
declare var expect: Function;
declare var it: Function;

/**
 * Test suite related to HideNotificationBarStyle component.
 */
describe('HideNotificationBarStyle component', () => {

    /**
     * HideNotificationBarStyle should render style element hiding notification
     * bar.
     */
    it('should render style element', () => {
        const wrapper = render(<HideNotificationBarStyle />);

        expect(wrapper.find('style')).toHaveLength(1);
    });
});
