import AbstractHandler from './AbstractHandler';

/**
 * Analytics handler for AppInsights.
 */
export default class AppInsightsHandler extends AbstractHandler {

    /**
     * Creates new instance of the AppInsights analytics handler.
     *
     * @param {Object} options -
     * @param {string} options.appInsightInstrumentationKey - The AppInsight instrumentation key
     *      * required by the AppInsights API.
     */
    constructor(options) {
        super(options);

        this._userProperties = {};

        if (!options.appInsightsInstrumentationKey) {
            throw new Error('Failed to initialize AppInsights handler, no instrumentation');
        }

        this._enabled = true;
        this._initAppInsights(options);
    }

    /**
     * Initializes the ga object.
     *
     * @param {Object} options -
     * @param {string} options.appInsightsInstrumentationKey - The AppInsight instrumentation key
     *      * required by the AppInsights API.
     * @returns {void}
     */
    _initAppInsights(options) {
        /**
         * TODO: Keep this local, there's no need to add it to window.
         */
        /* eslint-disable */
        !function(T,l,y){var S=T.location,k="script",D="instrumentationKey",C="ingestionendpoint",I="disableExceptionTracking",E="ai.device.",b="toLowerCase",w="crossOrigin",N="POST",e="appInsightsSDK",t=y.name||"appInsights";(y.name||T[e])&&(T[e]=t);var n=T[t]||function(d){var g=!1,f=!1,m={initialize:!0,queue:[],sv:"5",version:2,config:d};function v(e,t){var n={},a="Browser";return n[E+"id"]=a[b](),n[E+"type"]=a,n["ai.operation.name"]=S&&S.pathname||"_unknown_",n["ai.internal.sdkVersion"]="javascript:snippet_"+(m.sv||m.version),{time:function(){var e=new Date;function t(e){var t=""+e;return 1===t.length&&(t="0"+t),t}return e.getUTCFullYear()+"-"+t(1+e.getUTCMonth())+"-"+t(e.getUTCDate())+"T"+t(e.getUTCHours())+":"+t(e.getUTCMinutes())+":"+t(e.getUTCSeconds())+"."+((e.getUTCMilliseconds()/1e3).toFixed(3)+"").slice(2,5)+"Z"}(),iKey:e,name:"Microsoft.ApplicationInsights."+e.replace(/-/g,"")+"."+t,sampleRate:100,tags:n,data:{baseData:{ver:2}}}}var h=d.url||y.src;if(h){function a(e){var t,n,a,i,r,o,s,c,u,p,l;g=!0,m.queue=[],f||(f=!0,t=h,s=function(){var e={},t=d.connectionString;if(t)for(var n=t.split(";"),a=0;a<n.length;a++){var i=n[a].split("=");2===i.length&&(e[i[0][b]()]=i[1])}if(!e[C]){var r=e.endpointsuffix,o=r?e.location:null;e[C]="https://"+(o?o+".":"")+"dc."+(r||"services.visualstudio.com")}return e}(),c=s[D]||d[D]||"",u=s[C],p=u?u+"/v2/track":d.endpointUrl,(l=[]).push((n="SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details)",a=t,i=p,(o=(r=v(c,"Exception")).data).baseType="ExceptionData",o.baseData.exceptions=[{typeName:"SDKLoadFailed",message:n.replace(/\./g,"-"),hasFullStack:!1,stack:n+"\nSnippet failed to load ["+a+"] -- Telemetry is disabled\nHelp Link: https://go.microsoft.com/fwlink/?linkid=2128109\nHost: "+(S&&S.pathname||"_unknown_")+"\nEndpoint: "+i,parsedStack:[]}],r)),l.push(function(e,t,n,a){var i=v(c,"Message"),r=i.data;r.baseType="MessageData";var o=r.baseData;return o.message='AI (Internal): 99 message:"'+("SDK LOAD Failure: Failed to load Application Insights SDK script (See stack for details) ("+n+")").replace(/\"/g,"")+'"',o.properties={endpoint:a},i}(0,0,t,p)),function(e,t){if(JSON){var n=T.fetch;if(n&&!y.useXhr)n(t,{method:N,body:JSON.stringify(e),mode:"cors"});else if(XMLHttpRequest){var a=new XMLHttpRequest;a.open(N,t),a.setRequestHeader("Content-type","application/json"),a.send(JSON.stringify(e))}}}(l,p))}function i(e,t){f||setTimeout(function(){!t&&m.core||a()},500)}var e=function(){var n=l.createElement(k);n.src=h;var e=y[w];return!e&&""!==e||"undefined"==n[w]||(n[w]=e),n.onload=i,n.onerror=a,n.onreadystatechange=function(e,t){"loaded"!==n.readyState&&"complete"!==n.readyState||i(0,t)},n}();y.ld<0?l.getElementsByTagName("head")[0].appendChild(e):setTimeout(function(){l.getElementsByTagName(k)[0].parentNode.appendChild(e)},y.ld||0)}try{m.cookie=l.cookie}catch(p){}function t(e){for(;e.length;)!function(t){m[t]=function(){var e=arguments;g||m.queue.push(function(){m[t].apply(m,e)})}}(e.pop())}var n="track",r="TrackPage",o="TrackEvent";t([n+"Event",n+"PageView",n+"Exception",n+"Trace",n+"DependencyData",n+"Metric",n+"PageViewPerformance","start"+r,"stop"+r,"start"+o,"stop"+o,"addTelemetryInitializer","setAuthenticatedUserContext","clearAuthenticatedUserContext","flush"]),m.SeverityLevel={Verbose:0,Information:1,Warning:2,Error:3,Critical:4};var s=(d.extensionConfig||{}).ApplicationInsightsAnalytics||{};if(!0!==d[I]&&!0!==s[I]){var c="onerror";t(["_"+c]);var u=T[c];T[c]=function(e,t,n,a,i){var r=u&&u(e,t,n,a,i);return!0!==r&&m["_"+c]({message:e,url:t,lineNumber:n,columnNumber:a,error:i}),r},d.autoExceptionInstrumented=!0}return m}(y.cfg);function a(){y.onInit&&y.onInit(n)}(T[t]=n).queue&&0===n.queue.length?(n.queue.push(a),n.trackPageView({})):a()}(window,document,{
        src: "https://js.monitor.azure.com/scripts/b/ai.2.min.js", // The SDK URL Source
        // name: "appInsights", // Global SDK Instance name defaults to "appInsights" when not supplied
        // ld: 0, // Defines the load delay (in ms) before attempting to load the sdk. -1 = block page load and add to head. (default) = 0ms load after timeout,
        // useXhr: 1, // Use XHR instead of fetch to report failures (if available),
        crossOrigin: "anonymous", // When supplied this will add the provided value as the cross origin attribute on the script tag
        onInit: function(instance) {
            instance.trackPageView();
        }, // Once the application insights instance has loaded and initialized this callback function will be called with 1 argument -- the sdk instance (DO NOT ADD anything to the sdk.queue -- As they won't get called)
        cfg: { // Application Insights Configuration
            instrumentationKey: options.appInsighstInstrumentationKey
            /* ...Other Configuration Options... */
        }});
        /* eslint-enable */
    }

    /**
     * Extracts the integer to use for a AppInsights  event's value field
     * from a lib-jitsi-meet analytics event. 
     *
     * @param {Object} event - The lib-jitsi-meet analytics event.
     * @returns {number} - The integer to use for the 'value' of a AppInsights
     * event, or NaN if the lib-jitsi-meet event doesn't contain a
     * suitable value.
     * @private
     */
    _extractValue(event) {
        let value = event && event.attributes && event.attributes.value;

        // Try to extract an integer from the "value" attribute.
        value = Math.round(parseFloat(value));

        return value;
    }

    /**
     * Sets the permanent properties for the current session.
     *
     * @param {Object} userProps - The permanent properties.
     * @returns {void}
     */
    setUserProperties(userProps = {}) {
        if (!this._enabled) {
            return;
        }

        // user_agent is probably included as part of another object.
        const filter = [ 'user_agent' ];

        this._userProperties
            = Object.keys(userProps)
                .filter(key => filter.indexOf(key) === -1)
                .reduce((item, key) => {
                    item[key] = userProps[key];
                    return item;
                }, {});
    }

    /**
     * This is the entry point of the API. The function sends an event to
     * AppInsights. The format of the event is described in
     * analyticsAdapter in lib-jitsi-meet.
     *
     * @param {Object} event - The event in the format specified by
     * lib-jitsi-meet.
     * @returns {void}
     */
    sendEvent(event) {
        if (this._shouldIgnore(event)) {
            return;
        }

        const value = this._extractValue(event);
        let eventProperties = {
            ...event,
            ...this._userProperties,
            category: 'jitsi-meet'
        };
        if (!isNaN(value)) {
            eventProperties.value = value;
        }

        appInsights.trackEvent({ 
            name: this._extractName(event), 
            properties: eventProperties
        });
    }
    
}
