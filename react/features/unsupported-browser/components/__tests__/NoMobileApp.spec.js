/* @flow */

import { shallow } from 'enzyme';
import React from 'react';

import HideNotificationBarStyle from '../HideNotificationBarStyle';
import NoMobileApp from '../NoMobileApp';

declare var afterAll: Function;
declare var beforeAll: Function;
declare var describe: Function;
declare var expect: Function;
declare var interfaceConfig: Object;
declare var it: Function;

const oldAppName = interfaceConfig.APP_NAME;
const testAppName = 'TEST_APP_NAME';

/**
 * Test suite related to NoMobileApp component.
 */
describe('NoMobileApp component', () => {

    /**
     * Sets the value of application name in interface config by test data.
     */
    beforeAll(() => {
        interfaceConfig.APP_NAME = testAppName;
    });

    /**
     * Sets the previous value of application name.
     */
    afterAll(() => {
        interfaceConfig.APP_NAME = oldAppName;
    });

    /**
     * Component should render correct application name set in interface
     * config.
     */
    it('should render correct application name', () => {
        const wrapper = shallow(<NoMobileApp />);
        const description = wrapper.find('.no-mobile-app__description');

        interfaceConfig.APP_NAME = testAppName;

        expect(description).toHaveLength(1);
        expect(description.text().match(testAppName)).not.toBeNull();
    });

    /**
     * NoMobileApp should render component containing styles hiding
     * notification bar from lib-jitsi-meet.
     */
    it('should render HideNotificationBarStyle', () => {
        const wrapper = shallow(<NoMobileApp />);

        expect(wrapper.find(HideNotificationBarStyle)).toHaveLength(1);
    });
});
