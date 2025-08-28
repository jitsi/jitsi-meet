/*
 * Copyright @ 2018-present 8x8, Inc.
 * Copyright @ 2017-2018 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import ClockKit


class ComplicationController: NSObject, CLKComplicationDataSource {

    // MARK: - Timeline Configuration

    func getSupportedTimeTravelDirections(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimeTravelDirections) -> Void) {
        handler([])
    }

    func getPrivacyBehavior(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationPrivacyBehavior) -> Void) {
        handler(.showOnLockScreen)
    }

    // MARK: - Timeline Population

    func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
        // Call the handler with the current timeline entry
        getLocalizableSampleTemplate(for: complication) {template in
            guard let template = template else {
                handler(nil)
                return
            }
            handler(CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template))
        }
    }

    func getTimelineEntries(for complication: CLKComplication, before date: Date, limit: Int, withHandler handler: @escaping ([CLKComplicationTimelineEntry]?) -> Void) {
        // Call the handler with the timeline entries prior to the given date
        handler(nil)
    }

    func getTimelineEntries(for complication: CLKComplication, after date: Date, limit: Int, withHandler handler: @escaping ([CLKComplicationTimelineEntry]?) -> Void) {
        // Call the handler with the timeline entries after to the given date
        handler(nil)
    }

    // MARK: - Placeholder Templates

    func getLocalizableSampleTemplate(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTemplate?) -> Void) {
        // This method will be called once per supported complication, and the results will be cached

        let imageProvider = CLKImageProvider(onePieceImage: UIImage(named: "jitsi")!)
        if complication.family == .circularSmall {
            let small = CLKComplicationTemplateCircularSmallRingImage()
            small.imageProvider = imageProvider
            small.ringStyle = .closed
            small.fillFraction = 0
            handler(small)
        } else if complication.family == .utilitarianSmall {
            let utilitarian = CLKComplicationTemplateUtilitarianSmallSquare()
            utilitarian.imageProvider = imageProvider
            handler(utilitarian)
        } else if complication.family == .modularSmall {
            let modular = CLKComplicationTemplateModularSmallRingImage()
            modular.imageProvider = imageProvider
            modular.ringStyle = .closed
            modular.fillFraction = 0
            handler(modular)
        }
    }

}
