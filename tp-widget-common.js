
(function(window, document, undefined) {

    /*
     TemplatePackage Widget Common Functionality - 03/2015 - G. Ewing

     ** Description / Purpose ***********************************************************************************************

     This file is intended to be called locally by any CDC widget, it will load common widget functionality for
     all widgets.

     The intent is common scripts can be shared in to:
     1. Re Use Core Code / Increase Managability / Decrease Maintenance Time / Redundancy
     2. Reduce completity of individual widget libraries
     3. Share in actual memory vs instantiating new local instances of the same library over & over again (should
     multiple widgets be loaded in the same window in some way - though highly unlikely).

     ***************************************************************************************************************************
     */

    window.CDC = window.CDC || {};
    window.CDC.Widget = window.CDC.Widget || {};
    window.CDC.Widget.Common = window.CDC.Widget.Common || (function () {

            var objCommon = {};

            // SCRIPT LOADER
            objCommon.loadScript = function(script, callback) {
                var eleScript = document.createElement('script'), // NEW SCRIPT TAG
                    eleHead = document.getElementsByTagName('head')[0]; // FIRST SCRIPT TAG IN CALLING PAGE

                // LOAD IF SCRIPT VALID ARGUMENT PASSED
                if (script !== undefined && script.length > 0) {

                    // SET SCRIPT TAG ATTRIBUTES
                    eleScript.src = script; // set the src of the script to your script
                    var fctLocalCallback = function() {

                        // LOGGING
                        objCommon.log('Loading script: ' + script);

                        // CALLBACK PASSED?
                        if (callback !== undefined) {

                            // LOG & EXECUTE CALLBACK
                            objCommon.log('Executing Callback: ' + script);
                            callback();

                        } else {

                            // LOG NO CALLBACK
                            objCommon.log('No Callback Provided for: ' + script);
                        }
                    };

                    // BIND THE EVENT TO THE CALLBACK FUNCTION
                    if (eleScript.addEventListener) {
                        eleScript.addEventListener("load", fctLocalCallback, false); // IE9+, Chrome, Firefox
                    } else if (eleScript.readyState) {
                        eleScript.onreadystatechange = fctLocalCallback; // IE8
                    }

                    // APPEND SCRIPT TO PAGE
                    eleHead.appendChild(eleScript);
                }
            };

            // CSS LOADER
            objCommon.loadCss = function(stylesheetPath /*,callback*/) {
                var file = stylesheetPath,
                    link = document.createElement( "link" ),
                    hostname = objCommon.getSafeHostName();
                link.href = window.location.protocol + "//" + hostname + file.substr( 0, file.lastIndexOf( "." ) ) + ".css";
                link.type = "text/css";
                link.rel = "stylesheet";
                link.media = "screen,print";
                //link.onreadystatechange = callback;

                document.getElementsByTagName( "head" )[0].appendChild( link );
            };

            // STRING STRIPPER
            objCommon.cleanString = function (anyString) {

                // DEFAULT STRING
                anyString = anyString || "";

                // CONVERT TO STRING IF NEEDED
                if (typeof(cleanString) !== 'string') {
                    anyString = anyString.toString();
                }

                // CLEAN IT UP & RETURN IT
                return anyString.replace('\t', '').replace('\r', '').replace('\n', '');
            };

            // RANDOM STRING GENERATOR
            objCommon.s4 = function () {

                return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            };

            // GUID GENERATOR
            objCommon.guid = function () {

                return objCommon.s4() + objCommon.s4() + '-' + objCommon.s4() + '-' + objCommon.s4() + '-' + objCommon.s4() + '-' + objCommon.s4() + objCommon.s4() + objCommon.s4();
            };

            // REPLACE ALL HANDLER
            objCommon.replaceAll = function(find, replace, str) {
                if (find === "|") {
                    find = new RegExp("\\|", 'g');
                } else {
                    find = new RegExp(find, 'g');
                }
                return str.replace(find, replace);
            };

            // INIT HANDLER
            objCommon.init = function(objSettings) {

                // EXECUTE iFrameResizerContentWindow
                objCommon.iFrameResizerContentWindow();

                // URL PARAM INTERPERETING (FROM CALLING PAGE)
                var aryCallParams = window.location.search.replace("?", "").split('&');
                var len = aryCallParams.length;
                while (len--) {
                    var aryNvp = aryCallParams[len].split('=');
                    objCommon.runtime.callParams[aryNvp[0]] = aryNvp[1];
                }

                // LOAD PATTERN BASED WIDGET JS (SHOULD EXIST IF WIDGET CONFORMS TO PATTERN)
                objCommon.loadScript(objCommon.runtime.widgetScript, function(){

                    // INIT COMMON EVENT HANDLERS
                    objCommon.events.init();

                    if (objCommon.runtime.callParams.stylePath) {
                        objCommon.loadCss(objCommon.runtime.callParams.stylePath);
                    }

                    // CHECK FOR PATTERN BASED LOAD METHOD
                    if (window.CDC.Widget.load) {

                        // EXECUTE IF FOUND (PASSING WIDGET FRAMEWORK)
                        CDC.Widget.load(objCommon);
                    }
                });

                // LOG WINDOW RUNTIME STATE AFTER INIT
                objCommon.log('window.CDC.Widget.Common.runtime');
                objCommon.log(objCommon.runtime);
            };

            objCommon.initOnSyndication = function () {

                objCommon.log('** This content is being syndicated (loaded in an iframe) **');
                // GLOBAL "ON SYNDICATION" LOGIC HERE

                // SUPPORT FOR WIDGET SPECIFIC "ON SYNDICATION" LOGIC HERE
                if (window.CDC.Widget.syndicatedLoad) {

                    objCommon.log('** Executing Widget Syndicated Load Hander **');
                    window.CDC.Widget.syndicatedLoad(objCommon);
                }
            };

            objCommon.getCallParam = function(paramName, blnDecode) {
                blnDecode = (typeof(blnDecode) === 'undefined') ? true : blnDecode;
                var anyVar = objCommon.runtime.callParams[paramName] || null;
                return (blnDecode && anyVar !== null) ? decodeURIComponent(anyVar) : anyVar;
            };

            objCommon.getSafeHostName = function () {

                var strReturn, strRequestedHost, match;

                // SET DEFAULT EXTERNAL HOST
                strReturn = objCommon.getCallParam('cHost') || window.location.hostname;

                // SET REQUESTED HOST HANDLING (IF AVAILABLE)
                strRequestedHost = objCommon.getCallParam('host');

                // WAS REQUESTED HOST PASSED IN?
                if (strRequestedHost && strRequestedHost.length) {

                    // SIMPLE REGEX ON REQUESTED HOSTNAME
                    match = strRequestedHost.match(/.cdc.gov$/gi);

                    // CHECK RESULTS
                    if (match && match.length) {

                        // REQUESTED HOSTS MATCHED SAFETY CHECK - ALLOW IT
                        strReturn = strRequestedHost;
                    }
                }

                // RETURN DERIVED HOSTNAME
                return strReturn;
            };

            objCommon.attrToCamelCase = function(strAttribute) {
                var aryDestination = [],
                    arySource, strCurr, i;

                arySource = strAttribute.toLowerCase().replace('data-','').split('-');

                for (i = 0; i < arySource.length; i++) {
                    strCurr = arySource[i];
                    if (i > 0) {
                        strCurr = strCurr.charAt(0).toUpperCase() + strCurr.substring(1);
                    }
                    aryDestination.push(strCurr);
                }

                return aryDestination.join('');
            };

            objCommon.createEmbedCode = function(strWidgetName, aryParameters) {

                // CREATE EMBED CODE

                // DEFAULT ARG VALUE IF NEEDED
                aryParameters = aryParameters || [];

                // LOCAL PARAMETERS
                var aryParamsList, aryEmbedCode = [], objCallParams = objCommon.runtime.callParams;

                //  DEFAULT /GLOBAL LIST TO ALWAYS BE PROPAGATED IF INCLUDED IN EMBED CODE
                aryParamsList = [
                    'data-lang',
                    'data-host',
                    'data-instance-name',
                    'data-style-path',
                    'data-widget-min-width',
                    'data-widget-max-width',
                    'data-widget-min-height',
                    'data-widget-max-height',
                    'data-widget-title'
                ];

                // CONCAT GLOBALS WITH REQUESTED PARAMS
                aryParamsList = aryParamsList.concat(aryParameters);

                // OPEN EMBED DIV
                aryEmbedCode.push('<div data-cdc-widget="' + strWidgetName + '"');

                var strAttrName, strParamName, i, objTrack = {};

                // LOOP DATA ATTR ARRAY
                for (i = aryParamsList.length - 1; i >= 0; i--) {
                    // GET CURRENT DATA-ATTR
                    strAttrName = aryParamsList[i];
                    // GET CAMEL CASED PARAM NAME FROM ATTR
                    strParamName = objCommon.attrToCamelCase(strAttrName);
                    // CHECK RUNTIME FOR PARAM / VERIFY IS HAS NOT ALREADY BEEN TRACKED VIA TRACKER OBJECT (TO DE-DUP LIST)
                    if (objCallParams.hasOwnProperty(strParamName) && !objTrack.hasOwnProperty(strParamName)) {
                        // ADD TO EMBED CODE IF DEFINED
                        aryEmbedCode.push(strAttrName + '="' + objCallParams[strParamName] + '"');
                        // ADD PARAM TO TRACKER OBJECT
                        objTrack[strParamName] = true;
                    }
                };

                // TERMINATE OPEN OF DIV AND THEN CLOSE DIV
                aryEmbedCode.push('></div>');

                // ADD NEW LINE
                aryEmbedCode.push('\n');

                // ADD SCRIPT TAG
                //aryEmbedCode.push('&lt;script src="//' + runtime.strHost + '/TemplatePackage/contrib/widgets/tp-widget-external-loader.js"&gt;&lt;/script&gt;');
                aryEmbedCode.push('<script src="https://tools.cdc.gov/1M1B"></script>');

                // UPDATE THE EMBED CODE (CONCAT PARAMETERS (LEAVE THE SPACE IN THE JOIN))
                objCommon.runtime.embedCode = aryEmbedCode.join(" ");

                // SET THE EMBED CODE
                objCommon.events.setEmbedCode(objCommon.runtime.embedCode);

                // RETURN THE AMBED CODE STRING (IN CASE ANYONE WANTS TO LEVERAGE THE METHOD THIS WAY)
                return objCommon.events.setEmbedCode;
            };

            objCommon.iFrameResizerContentWindow = function () {

                /*
                 * File: iframeResizer.contentWindow.js
                 * Desc: Include this file in any page being loaded into an iframe
                 *       to force the iframe to resize to the content size.
                 * Requires: iframeResizer.js on host page.
                 * Author: David J. Bradshaw - dave@bradshaw.net
                 * Contributor: Jure Mav - jure.mav@gmail.com
                 */

                'use strict';

                var
                    autoResize            = true,
                    base                  = 10,
                    bodyBackground        = '',
                    bodyMargin            = 0,
                    bodyMarginStr         = '',
                    bodyPadding           = '',
                    calculateWidth        = false,
                    doubleEventList       = {'resize':1,'click':1},
                    eventCancelTimer      = 128,
                    height                = 1,
                    firstRun              = true,
                    heightCalcModeDefault = 'offset',
                    heightCalcMode        = heightCalcModeDefault,
                    initLock              = true,
                    initMsg               = '',
                    inPageLinks           = {},
                    interval              = 32,
                    logging               = false,
                    msgID                 = '[iFrameSizer]',  //Must match host page msg ID
                    msgIdLen              = msgID.length,
                    myID                  = '',
                    publicMethods         = false,
                    resetRequiredMethods  = {max:1,scroll:1,bodyScroll:1,documentElementScroll:1},
                    resizeFrom            = 'parent',
                    targetOriginDefault   = '*',
                    target                = window.parent,
                    tolerance             = 0,
                    triggerLocked         = false,
                    triggerLockedTimer    = null,
                    width                 = 1;

                function addEventListener(el,evt,func){
                    if ('addEventListener' in window){
                        el.addEventListener(evt,func, false);
                    } else if ('attachEvent' in window){ //IE
                        el.attachEvent('on'+evt,func);
                    }
                }

                function formatLogMsg(msg){
                    return msgID + '[' + myID + ']' + ' ' + msg;
                }

                function log(msg){
                    if (logging && ('object' === typeof window.console)){
                        console.log(formatLogMsg(msg));
                    }
                }

                function warn(msg){
                    if ('object' === typeof window.console){
                        console.warn(formatLogMsg(msg));
                    }
                }


                function init(){
                    log('Initializing iFrame');

                    // FRAMWEORD PIGGYBACK FOR SYNDICATION HANDLER HERE
                    objCommon.initOnSyndication();

                    // STANDARD INITIALIZATION
                    readData();
                    setMargin();
                    setBodyStyle('background',bodyBackground);
                    setBodyStyle('padding',bodyPadding);
                    injectClearFixIntoBodyElement();
                    checkHeightMode();
                    stopInfiniteResizingOfIFrame();
                    setupPublicMethods();
                    startEventListeners();
                    inPageLinks = setupInPageLinks();
                    sendSize('init','Init message from host page');
                }

                function readData(){

                    var data = initMsg.substr(msgIdLen).split(':');

                    function strBool(str){
                        return 'true' === str ? true : false;
                    }

                    myID               = data[0];
                    bodyMargin         = (undefined !== data[1]) ? Number(data[1])   : bodyMargin; //For V1 compatibility
                    calculateWidth     = (undefined !== data[2]) ? strBool(data[2])  : calculateWidth;
                    logging            = (undefined !== data[3]) ? strBool(data[3])  : logging;
                    interval           = (undefined !== data[4]) ? Number(data[4])   : interval;
                    publicMethods      = (undefined !== data[5]) ? strBool(data[5])  : publicMethods;
                    autoResize         = (undefined !== data[6]) ? strBool(data[6])  : autoResize;
                    bodyMarginStr      = data[7];
                    heightCalcMode     = (undefined !== data[8]) ? data[8]           : heightCalcMode;
                    bodyBackground     = data[9];
                    bodyPadding        = data[10];
                    tolerance          = (undefined !== data[11]) ? Number(data[11]) : tolerance;
                    inPageLinks.enable = (undefined !== data[12]) ? strBool(data[12]): false;
                    resizeFrom         = data[13];
                }

                function chkCSS(attr,value){
                    if (-1 !== value.indexOf('-')){
                        warn('Negative CSS value ignored for '+attr);
                        value='';
                    }
                    return value;
                }

                function setBodyStyle(attr,value){
                    if ((undefined !== value) && ('' !== value) && ('null' !== value)){
                        document.body.style[attr] = value;
                        log('Body '+attr+' set to "'+value+'"');
                    }
                }

                function setMargin(){
                    //If called via V1 script, convert bodyMargin from int to str
                    if (undefined === bodyMarginStr){
                        bodyMarginStr = bodyMargin+'px';
                    }
                    chkCSS('margin',bodyMarginStr);
                    setBodyStyle('margin',bodyMarginStr);
                }

                function stopInfiniteResizingOfIFrame(){
                    document.documentElement.style.height = '';
                    document.body.style.height = '';
                    log('HTML & body height set to "auto"');
                }


                function addTriggerEvent(options){
                    function addListener(eventName){
                        addEventListener(window,eventName,function(e){
                            sendSize(options.eventName,options.eventType);
                        });
                    }

                    if(options.eventNames && Array.prototype.map){
                        options.eventName = options.eventNames[0];
                        options.eventNames.map(addListener);
                    } else {
                        addListener(options.eventName);
                    }

                    log('Added event listener: ' + options.eventType);
                }

                function initEventListeners(){
                    addTriggerEvent({ eventType: 'Animation Start',           eventNames: ['animationstart','webkitAnimationStart'] });
                    addTriggerEvent({ eventType: 'Animation Iteration',       eventNames: ['animationiteration','webkitAnimationIteration'] });
                    addTriggerEvent({ eventType: 'Animation End',             eventNames: ['animationend','webkitAnimationEnd'] });
                    //addTriggerEvent({ eventType: 'Device Orientation Change', eventName:  'deviceorientation' });
                    addTriggerEvent({ eventType: 'Transition End',            eventNames: ['transitionend','webkitTransitionEnd','MSTransitionEnd','oTransitionEnd','otransitionend'] });
                    addTriggerEvent({ eventType: 'Window Clicked',            eventName:  'click' });
                    //addTriggerEvent({ eventType: 'Window Mouse Down',         eventName:  'mousedown' });
                    //addTriggerEvent({ eventType: 'Window Mouse Up',           eventName:  'mouseup' });
                    if('child' === resizeFrom){
                        addTriggerEvent({ eventType: 'IFrame Resized',        eventName:  'resize' });
                    }
                }

                function checkHeightMode(){
                    if (heightCalcModeDefault !== heightCalcMode){
                        if (!(heightCalcMode in getHeight)){
                            warn(heightCalcMode + ' is not a valid option for heightCalculationMethod.');
                            heightCalcMode='bodyScroll';
                        }
                        log('Height calculation method set to "'+heightCalcMode+'"');
                    }
                }

                function startEventListeners(){
                    if ( true === autoResize ) {
                        initEventListeners();
                        setupMutationObserver();
                    }
                    else {
                        log('Auto Resize disabled');
                    }
                }

                function injectClearFixIntoBodyElement(){
                    var clearFix = document.createElement('div');
                    clearFix.style.clear = 'both';
                    clearFix.style.display = 'block'; //Guard against this having been globally redefined in CSS.
                    document.body.appendChild(clearFix);
                }

                function setupInPageLinks(){

                    function getPagePosition (){
                        return {
                            x: (window.pageXOffset !== undefined) ? window.pageXOffset : document.documentElement.scrollLeft,
                            y: (window.pageYOffset !== undefined) ? window.pageYOffset : document.documentElement.scrollTop
                        };
                    }

                    function getElementPosition(el){
                        var
                            elPosition   = el.getBoundingClientRect(),
                            pagePosition = getPagePosition();

                        return {
                            x: parseInt(elPosition.left,10) + parseInt(pagePosition.x,10),
                            y: parseInt(elPosition.top,10)  + parseInt(pagePosition.y,10)
                        };
                    }

                    function findTarget(location){
                        var hash = location.split("#")[1] || "";
                        var hashData = decodeURIComponent(hash);

                        function jumpToTarget(target){
                            var jumpPosition = getElementPosition(target);

                            log('Moving to in page link (#'+hash+') at x: '+jumpPosition.x+' y: '+jumpPosition.y);
                            sendMsg(jumpPosition.y, jumpPosition.x, 'scrollToOffset'); // X&Y reversed at sendMsg uses height/width
                        }

                        var target = document.getElementById(hashData) || document.getElementsByName(hashData)[0];

                        if (target){
                            jumpToTarget(target);
                        } else {
                            log('In page link (#' + hash + ') not found in iFrame, so sending to parent');
                            sendMsg(0,0,'inPageLink','#'+hash);
                        }
                    }

                    function checkLocationHash(){
                        if ('' !== location.hash && '#' !== location.hash){
                            findTarget(location.href);
                        }
                    }

                    function bindAnchors(){
                        function setupLink(el){
                            function linkClicked(e){
                                e.preventDefault();

                                /*jshint validthis:true */
                                findTarget(this.getAttribute('href'));
                            }

                            if ('#' !== el.getAttribute('href')){
                                addEventListener(el,'click',linkClicked);
                            }
                        }

                        Array.prototype.forEach.call( document.querySelectorAll( 'a[href^="#"]' ), setupLink );
                    }

                    function bindLocationHash(){
                        addEventListener(window,'hashchange',checkLocationHash);
                    }

                    function initCheck(){ //check if page loaded with location hash after init resize
                        setTimeout(checkLocationHash,eventCancelTimer);
                    }

                    function enableInPageLinks(){
                        if(Array.prototype.forEach && document.querySelectorAll){
                            log('Setting up location.hash handlers');
                            bindAnchors();
                            bindLocationHash();
                            initCheck();
                        } else {
                            warn('In page linking not fully supported in this browser! (See README.md for IE8 workaround)');
                        }
                    }

                    if(inPageLinks.enable){
                        enableInPageLinks();
                    } else {
                        log('In page linking not enabled');
                    }

                    return {
                        findTarget:findTarget
                    };
                }

                function setupPublicMethods(){
                    if (publicMethods) {
                        log('Enable public methods');

                        window.parentIFrame = {
                            close: function closeF(){
                                sendMsg(0,0,'close');
                            },
                            getId: function getIdF(){
                                return myID;
                            },
                            moveToAnchor: function moveToAnchorF(hash){
                                inPageLinks.findTarget(hash);
                            },
                            reset: function resetF(){
                                resetIFrame('parentIFrame.reset');
                            },
                            scrollTo: function scrollToF(x,y){
                                sendMsg(y,x,'scrollTo'); // X&Y reversed at sendMsg uses height/width
                            },
                            scrollToOffset: function scrollToF(x,y){
                                sendMsg(y,x,'scrollToOffset'); // X&Y reversed at sendMsg uses height/width
                            },
                            sendMessage: function sendMessageF(msg,targetOrigin){
                                sendMsg(0,0,'message',JSON.stringify(msg),targetOrigin);
                            },
                            sendHashChange: function sendMessageF(msg,targetOrigin){
                                // THIS METHOD MUST EXPLICITELY BE CALLED BY A MICROSITE OR WIDGET
                                // WHETHER OR NOT THE CALL DOES ANYTHING IS BASED ON THIS LOGIC
                                var remoteHashEnabled = objCommon.getCallParam('rhEnable');
                                var remoteHashOptMode = objCommon.getCallParam('chashOptMode');

                                // DO WE CALL HASH CHANGE? (DEFAULT IS NO)
                                var allowHashChange = false;

                                // IN OPT-IN MODE - REQUIRE remoteHashEnabled TO BE PASSED AS 'true'
                                if (remoteHashOptMode == 'in') {
                                    allowHashChange = (remoteHashEnabled == 'true');
                                }
                                // IN OPT-OUT MODE - REQUIRE remoteHashEnabled TO BE PASSED AS 'true'
                                if (remoteHashOptMode == 'out') {
                                    allowHashChange = (remoteHashEnabled == null || remoteHashEnabled == true);
                                }

                                // IF ALL CHECKS PASS AND HASH CHANGE SHOULD BE ALLOWED< MAKE THE CALL
                                if (allowHashChange) {
                                    if (typeof(msg) != 'string'){
                                        msg = JSON.stringify(msg);
                                    }
                                    // ONCE SENT IT IS UP TO EXTERNAL LOADER TO DECIDE TO ALLOW IT OR NOT BASED ON CONFIG SETTINGS
                                    sendMsg(0,0,'hashchange',msg,targetOrigin);
                                }
                            },
                            setHeightCalculationMethod: function setHeightCalculationMethodF(heightCalculationMethod){
                                heightCalcMode = heightCalculationMethod;
                                checkHeightMode();
                            },
                            setTargetOrigin: function setTargetOriginF(targetOrigin){
                                log('Set targetOrigin: '+targetOrigin);
                                targetOriginDefault = targetOrigin;
                            },
                            size: function sizeF(customHeight, customWidth){
                                var valString = ''+(customHeight?customHeight:'')+(customWidth?','+customWidth:'');
                                lockTrigger();
                                sendSize('size','parentIFrame.size('+valString+')', customHeight, customWidth);
                            }
                        };
                        objCommon.parentIFrame = window.parentIFrame;
                    }
                }

                function initInterval(){
                    if ( 0 !== interval ){
                        log('setInterval: '+interval+'ms');
                        setInterval(function(){
                            sendSize('interval','setInterval: '+interval);
                        },Math.abs(interval));
                    }
                }

                function setupInjectElementLoadListners(mutations){
                    function addLoadListener(element){
                        if (element.height === undefined || element.width === undefined || 0 === element.height || 0 === element.width){
                            log('Attach listerner to '+element.src);
                            addEventListener(element,'load', function imageLoaded(){
                                sendSize('imageLoad','Image loaded');
                            });
                        }
                    }

                    mutations.forEach(function (mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'src'){
                            addLoadListener(mutation.target);
                        } else if (mutation.type === 'childList'){
                            var images = mutation.target.querySelectorAll('img');
                            Array.prototype.forEach.call(images,function (image) {
                                addLoadListener(image);
                            });
                        }
                    });
                }

                function setupMutationObserver(){

                    var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

                    function createMutationObserver(){
                        var
                            target = document.querySelector('body'),

                            config = {
                                attributes            : true,
                                attributeOldValue     : false,
                                characterData         : true,
                                characterDataOldValue : false,
                                childList             : true,
                                subtree               : true
                            },

                            observer = new MutationObserver(function(mutations) {
                                sendSize('mutationObserver','mutationObserver: ' + mutations[0].target + ' ' + mutations[0].type);
                                setupInjectElementLoadListners(mutations); //Deal with WebKit asyncing image loading when tags are injected into the page
                            });

                        log('Enable MutationObserver');
                        observer.observe(target, config);
                    }

                    if (MutationObserver){
                        if (0 > interval) {
                            initInterval();
                        } else {
                            createMutationObserver();
                        }
                    }
                    else {
                        warn('MutationObserver not supported in this browser!');
                        initInterval();
                    }
                }


                // document.documentElement.offsetHeight is not reliable, so
                // we have to jump through hoops to get a better value.
                function getBodyOffsetHeight(){
                    function getComputedBodyStyle(prop) {
                        function convertUnitsToPxForIE8(value) {
                            var PIXEL = /^\d+(px)?$/i;

                            if (PIXEL.test(value)) {
                                return parseInt(value,base);
                            }

                            var
                                style = el.style.left,
                                runtimeStyle = el.runtimeStyle.left;

                            el.runtimeStyle.left = el.currentStyle.left;
                            el.style.left = value || 0;
                            value = el.style.pixelLeft;
                            el.style.left = style;
                            el.runtimeStyle.left = runtimeStyle;

                            return value;
                        }

                        var
                            el = document.body,
                            retVal = 0;

                        if (('defaultView' in document) && ('getComputedStyle' in document.defaultView)) {
                            retVal = document.defaultView.getComputedStyle(el, null);
                            retVal = (null !== retVal) ? retVal[prop] : 0;
                        } else {//IE8
                            retVal =  convertUnitsToPxForIE8(el.currentStyle[prop]);
                        }

                        return parseInt(retVal,base);
                    }

                    return  document.body.offsetHeight +
                        getComputedBodyStyle('marginTop') +
                        getComputedBodyStyle('marginBottom');
                }

                function getBodyScrollHeight(){
                    return document.body.scrollHeight;
                }

                function getDEOffsetHeight(){
                    return document.documentElement.offsetHeight;
                }

                function getDEScrollHeight(){
                    return document.documentElement.scrollHeight;
                }

                //From https://github.com/guardian/iframe-messenger
                function getLowestElementHeight() {
                    var
                        allElements       = document.querySelectorAll('body *'),
                        allElementsLength = allElements.length,
                        maxBottomVal      = 0,
                        timer             = new Date().getTime();

                    for (var i = 0; i < allElementsLength; i++) {
                        if (allElements[i].getBoundingClientRect().bottom > maxBottomVal) {
                            maxBottomVal = allElements[i].getBoundingClientRect().bottom;
                        }
                    }

                    timer = new Date().getTime() - timer;

                    log('Parsed '+allElementsLength+' HTML elements');
                    log('LowestElement bottom position calculated in ' + timer + 'ms');

                    return maxBottomVal;
                }

                function getAllHeights(){
                    return [
                        getBodyOffsetHeight(),
                        getBodyScrollHeight(),
                        getDEOffsetHeight(),
                        getDEScrollHeight()
                    ];
                }

                function getMaxHeight(){
                    return Math.max.apply(null,getAllHeights());
                }

                function getMinHeight(){
                    return Math.min.apply(null,getAllHeights());
                }

                function getBestHeight(){
                    return Math.max(getBodyOffsetHeight(),getLowestElementHeight());
                }

                var getHeight = {
                    offset                : getBodyOffsetHeight, //Backward compatibility
                    bodyOffset            : getBodyOffsetHeight,
                    bodyScroll            : getBodyScrollHeight,
                    documentElementOffset : getDEOffsetHeight,
                    scroll                : getDEScrollHeight, //Backward compatibility
                    documentElementScroll : getDEScrollHeight,
                    max                   : getMaxHeight,
                    min                   : getMinHeight,
                    grow                  : getMaxHeight,
                    lowestElement         : getBestHeight
                };

                function getWidth(){
                    return Math.max(
                        document.documentElement.scrollWidth,
                        document.body.scrollWidth
                    );
                }

                function sendSize(triggerEvent, triggerEventDesc, customHeight, customWidth){

                    var	currentHeight,currentWidth;

                    function recordTrigger(){
                        if (!(triggerEvent in {'reset':1,'resetPage':1,'init':1})){
                            log( 'Trigger event: ' + triggerEventDesc );
                        }
                    }

                    function resizeIFrame(){
                        height = currentHeight;
                        width  = currentWidth;

                        sendMsg(height,width,triggerEvent);
                    }

                    function isDoubleFiredEvent(){
                        return  triggerLocked && (triggerEvent in doubleEventList);
                    }

                    function isSizeChangeDetected(){
                        function checkTolarance(a,b){
                            var retVal = Math.abs(a-b) <= tolerance;
                            return !retVal;
                        }

                        currentHeight = (undefined !== customHeight)  ? customHeight : getHeight[heightCalcMode]();
                        currentWidth  = (undefined !== customWidth )  ? customWidth  : getWidth();

                        return	checkTolarance(height,currentHeight) ||
                            (calculateWidth && checkTolarance(width,currentWidth));
                    }

                    function isForceResizableEvent(){
                        return !(triggerEvent in {'init':1,'interval':1,'size':1});
                    }

                    function isForceResizableHeightCalcMode(){
                        return (heightCalcMode in resetRequiredMethods);
                    }

                    function logIgnored(){
                        log('No change in size detected');
                    }

                    function checkDownSizing(){
                        if (isForceResizableEvent() && isForceResizableHeightCalcMode()){
                            resetIFrame(triggerEventDesc);
                        } else if (!(triggerEvent in {'interval':1})){
                            recordTrigger();
                            logIgnored();
                        }
                    }

                    if (!isDoubleFiredEvent()){
                        if (isSizeChangeDetected()){
                            recordTrigger();
                            lockTrigger();
                            resizeIFrame();
                        } else {
                            checkDownSizing();
                        }
                    } else {
                        log('Trigger event cancelled: '+triggerEvent);
                    }
                }

                function lockTrigger(){
                    if (!triggerLocked){
                        triggerLocked = true;
                        log('Trigger event lock on');
                    }
                    clearTimeout(triggerLockedTimer);
                    triggerLockedTimer = setTimeout(function(){
                        triggerLocked = false;
                        log('Trigger event lock off');
                        log('--');
                    },eventCancelTimer);
                }

                function triggerReset(triggerEvent){
                    height = getHeight[heightCalcMode]();
                    width  = getWidth();

                    sendMsg(height,width,triggerEvent);
                }

                function resetIFrame(triggerEventDesc){
                    var hcm = heightCalcMode;
                    heightCalcMode = heightCalcModeDefault;

                    log('Reset trigger event: ' + triggerEventDesc);
                    lockTrigger();
                    triggerReset('reset');

                    heightCalcMode = hcm;
                }

                function sendMsg(height,width,triggerEvent,msg,targetOrigin){
                    function setTargetOrigin(){
                        if (undefined === targetOrigin){
                            targetOrigin = targetOriginDefault;
                        } else {
                            log('Message targetOrigin: '+targetOrigin);
                        }
                    }

                    function sendToParent(){
                        var
                            size  = height + ':' + width,
                            message = myID + ':' +  size + ':' + triggerEvent + (undefined !== msg ? ':' + msg : '');

                        //console.log('Sending message to host page (' + message + ')');
                        target.postMessage( msgID + message, targetOrigin);
                    }

                    setTargetOrigin();
                    sendToParent();
                }

                function receiver(event) {
                    function isMessageForUs(){
                        return msgID === (''+event.data).substr(0,msgIdLen); //''+ Protects against non-string messages
                    }

                    function initFromParent(){
                        initMsg = event.data;
                        target  = event.source;
                        init();
                        firstRun = false;
                        setTimeout(function(){ initLock = false;},eventCancelTimer);
                    }

                    function resetFromParent(){
                        if (!initLock){
                            log('Page size reset by host page');
                            triggerReset('resetPage');
                        } else {
                            log('Page reset ignored by init');
                        }
                    }

                    function resizeFromParent(){
                        sendSize('resizeParent','Parent window resized');
                    }

                    function getMessageType(){
                        return event.data.split(']')[1];
                    }

                    function isMiddleTier(){
                        return ('iFrameResize' in window);
                    }

                    function isInitMsg(){
                        //test if this message is from a child below us. This is an ugly test, however, updating
                        //the message format would break backwards compatibity.
                        return event.data.split(':')[2] in {'true':1,'false':1};
                    }

                    if (isMessageForUs()){
                        if (firstRun && isInitMsg()){ //Check msg ID
                            initFromParent();
                        } else if ('reset' === getMessageType()){
                            resetFromParent();
                        } else if ('resize' === getMessageType()){
                            resizeFromParent();
                        } else if (event.data !== initMsg && !isMiddleTier()){
                            warn('Unexpected message ('+event.data+')');
                        }
                    }
                }

                addEventListener(window, 'message', receiver);
            };

            // METRICS MANAGER
            objCommon.metrics = (function () {

                // RETURN OBJECT
                var objMetrics = {};

                // BEACON INITIALIZER
                objMetrics.initBeacon = function (strBeaconUrl) {

                    if (strBeaconUrl) {
                        // GENERATE IMG ELEMENT
                        var img=new Image();
                        img.src = strBeaconUrl;
                    }
                };

                // GLOBAL METRICS TRACKER
                objMetrics.trackData = function(objParamOverrides) {

                    // VERIFY TRACKING IS ENABLED
                    if (objMetrics.trackingEnabled(objParamOverrides)) {

                        var objTranslatedParameters = objMetrics.translateToBeacon(objParamOverrides);

                        // GET URL
                        var strBeaconUrl = objMetrics.getBeaconUrl(objTranslatedParameters);

                        // UPDATE URL OF BEACON TO SEND DATA TRACKER
                        objCommon.log('** BEACON SENDING: **');
                        objCommon.log(strBeaconUrl);
                        objMetrics.initBeacon(strBeaconUrl);
                        objCommon.log('** BEACON SENT **');

                    } else {

                        objCommon.log('** TRACKING DISABLED - BEACON SEND ABORTED **');

                    }

                    // BASIC TRUE RETURN (TO ALLOW EVEN BUBBLING)
                    return true;
                };

                // INTERACTIONS TRACKER (WRAPPER)
                objMetrics.trackEvent = function (objOrStringData, strEventValue) {

                    // DEFAULT VALUE
                    strEventValue = strEventValue || '';

                    // VERIFY ARG PASSED
                    if (objOrStringData) {

                        // CHECK FOR STRING
                        if (typeof(objOrStringData) === 'string') {

                            // SET STRING TO INTERACTION DATA KEY(S)
                            return objMetrics.trackData({
                                c33 : objOrStringData,
                                c14 : strEventValue
                            });

                        } else {

                            // PASS OBJECT THROUGH
                            return objMetrics.trackData(objOrStringData);
                        }
                    }
                };

                // URL GENERATOR (FROM PARAMS - ALLOWING FOR OVERRIDES)
                objMetrics.getBeaconUrl = function (objParamOverrides) {

                    return objMetrics.getBaseUrl() + '?' + objMetrics.getQueryString(objParamOverrides);
                };

                // BASE METRICS API URL CONSTRUCTOR
                objMetrics.getBaseUrl = function () {

                    if (objMetrics.settings.api.url) {
                        return objMetrics.settings.api.url;
                    }

                    return objMetrics.settings.api.urlPrefix + objMetrics.settings.api.urlAccount + objMetrics.settings.api.urlSuffix;
                };

                objMetrics.getCallParam = function(paramName) {
                    return objCommon.getCallParam(paramName);
                };

                // METRICS URL CONVERTER
                objMetrics.getQueryString = function (objParamOverrides) {

                    // GET OR DEFAULT LOCAL OVERRIDES
                    objParamOverrides = objParamOverrides || {};

                    // CREATE PARAM ARRAY
                    var objParams = {},
                        aryParams = [],
                        key, value;

                    // NEW OBJECT NEEDED TO AVOID PERSISTENCE (HANGING ON OF OLD PARAMETERS IN NEW CALLS)
                    // COPY DEFAULT PARAMS TO THIS CALLS PARAMS
                    for (key in objMetrics.settings.params) { objParams[key] = objMetrics.settings.params[key]; }

                    // MERGE IN OVERRIDES TO THIS CALLS PARAMS
                    for (key in objParamOverrides) { objParams[key] = objParamOverrides[key]; }

                    // LOOP METRIC PARAMS
                    for (key in objParams) {

                        // FINALIZE/FORMAT KEY VALUE
                        value = objCommon.cleanString(objParams[key]);

                        // CHECK FOR VALID FINAL VALUE
                        if (value.length) {

                            // PUSH KEY VALUE PAIR TO ARRAY
                            aryParams.push(key + '=' + encodeURIComponent(value));
                        }
                    }

                    // CONVERT ARRAY TO QUERY STRING & RETURN
                    return aryParams.join('&');
                };

                // HELPER: IS TRACKING ENABLED
                objMetrics.trackingEnabled = function (objParamOverrides) {

                    objParamOverrides = objParamOverrides || {};

                    var objSettings = objMetrics.settings.params,
                        anyIsEnabled;

                    // GET ENABLED VALUE (FROM OVERRIDES OR SETTINGS OR FAILOVER TO FALSE)
                    anyIsEnabled = objParamOverrides.useMetrics || objSettings.useMetrics || 'false';

                    // TYPE AGNOSTIC CHECK FOR TRUE
                    return objCommon.cleanString(anyIsEnabled).toLowerCase() !== 'false';
                };

                objMetrics.translateToBeacon = function (objSettings) {
                    var currKey,
                        blnAppend = true,
                        objSettingsReturn = {},
                        objTranslations = {
                            c1 : {
                                to: 'url',
                                description: 'Metrics URL (not sure what this is)'
                            },
                            c2 : {
                                to: 'documenttitle',
                                description: 'Document title'
                            },
                            c3 : {
                                to: 'hostname',
                                description: 'Metrics host name (Not sure what this is)'
                            },
                            c4 : {
                                to: 'registrationid',
                                description: 'Content Syndication registration ID'
                            },
                            c5 : {
                                to: 'language',
                                description: 'Content language'
                            },
                            c16 : {
                                to: 'urlreferrer',
                                description: 'Referrer (manual, not inferred)'
                            },
                            pageName : {
                                to: 'contenttitle',
                                description: 'Content title'
                            },
                            ch : {
                                to: 'omniturechannel',
                                description: 'Omniture channel'
                            }
                        };

                    // BACK FILL VALUES ALREADY SET TO THIS "objSettings" OBJECT
                    for (key in objMetrics.settings.params) {
                        if (!objSettings.hasOwnProperty(key)) {
                            objSettings[key] = objMetrics.settings.params[key];
                        }
                    }

                    // THEN PERFORM TRANSLATIONS TO "objSettings" OBJECT
                    for (currKey in objSettings) {

                        // APPEND MODE?
                        if (blnAppend) {

                            // USES EXISTING SETTING OBJECT & APPENDS NEW NEWS AS NEEDED

                            // DOES TRANSLATION EXIST
                            if (objTranslations[currKey]) {

                                // DOES THE TRANSLATION NOT ALREADY EXIST (WE DONT WANT TO OVERWRITE ALREADY SET PARAMETERS)
                                if (!objSettings.hasOwnProperty(objTranslations[currKey].to)) {

                                    // APPEND MAP KEY VALUE TO TRANSLATION KEY VALUE IN RETURN (APPENDED TO ORIGINAL OBJECT)
                                    objSettings[objTranslations[currKey].to] = objSettings[currKey];
                                }
                            }

                        } else {

                            // CREATES NEW RETURN OBJECT AND ADDS KEYS IN AS NEEDED

                            // DOES TRANSLATION EXIST
                            if (objTranslations[currKey]) {

                                // DOES THE TRANSLATION NOT ALREADY EXIST (WE DONT WANT TO OVERWRITE ALREADY SET PARAMETERS)
                                if (!objSettingsReturn.hasOwnProperty(objTranslations[currKey].to)) {

                                    // MAP KEY VALUE TO TRANSLATION KEY VALUE IN RETURN
                                    objSettingsReturn[objTranslations[currKey].to] = objSettings[currKey];
                                }

                            } else {
                                // ELSE PASS ALONG ORIGINAL KVP
                                objSettingsReturn[currKey] = objSettings[currKey];
                            }
                        }
                    }

                    // IF APPEND MODE, RETURN ORIGINAL OBJECT WITH APPENDED KVP TRANSLATIONS
                    if (blnAppend) {
                        return objSettings;
                    }

                    // ELSE RETURN TRANSLATED OBJECT ONLY
                    return objSettingsReturn;
                };

                objMetrics.getLanguageDefault = function () {

                    // DEFAULT TO EN-US
                    var strLangLocale = 'en-us';

                    // TRY TO RETURN HTML LANG ATTRIBUTE IF AVAILABLE
                    if (document.documentElement.lang) {
                        strLangLocale = document.documentElement.lang.toLowerCase();
                    }

                    // GET DEFAULT LANGUAGE VALUE FROM LOCALE
                    switch (strLangLocale.substring(0,2)) {
                        // CHINESE
                        case "zh":
                            return "chi";
                            break;
                        // SPANISH
                        case "es":
                            return "spa";
                            break;
                        // FRENCH
                        case "fr":
                            return "fra";
                            break;
                        default:
                            return "eng";
                    }
                };

                // INTIALIZER
                objMetrics.init = function (objSettings) {

                    // SET DEFAULT SETTINGS
                    objMetrics.settings = (function () {

                        // HANDLE METRICS ENGINE SWITCHER
                        var objSettingsReturn;

                        objSettingsReturn = {
                            api : {
                                // NOTE THIS IS THE CONTENT SERVICES PROXY API
                                // WHICH IS SUBJECT TO VARIABLE CONVERSION / REPLACEMENT
                                url : window.location.protocol + '//tools.cdc.gov/metrics.aspx'
                            }
                        };

                        objSettingsReturn.trackWidgetAs = (objCommon.getCallParam('mMode') || 'widget');
                        objSettingsReturn.blnPageLevelMetrics = (objCommon.getCallParam('loadPageLevel') || (objSettingsReturn.trackWidgetAs === 'module') || false);

                        // SWITCH PREREQUISITE LIBS AND METRIC PARAMS BY TRACKING TYPE (MODULE, WIDGET, ETC)
                        switch (objSettingsReturn.trackWidgetAs) {

                            // TRACK AS MODULE
                            case "module":
                                objSettingsReturn.params = {
                                    useMetrics: 'true',
                                    server : objMetrics.getCallParam('chost'),
                                    reportsuite : 'devcdc',
                                    c2 : objMetrics.getCallParam('chost') + objMetrics.getCallParam('cpath'),
                                    c5 : objMetrics.getLanguageDefault(),
                                    c26 : document.title,
                                    c30 : document.title,
                                    c31 : objMetrics.getCallParam('cpath'),
                                    c46 : objMetrics.getCallParam('cpath')
                                };
                                break;

                            // TRACK AS MICROSITE
                            case "microsite":
                                objSettingsReturn.params = {
                                    useMetrics: 'true',
                                    server : objMetrics.getCallParam('chost'),
                                    reportsuite : 'devcdc',
                                    c2 : objMetrics.getCallParam('chost') + objMetrics.getCallParam('cpath'),
                                    c5 : objMetrics.getLanguageDefault(),
                                    c26 : document.title,
                                    c30 : document.title,
                                    c31 : objMetrics.getCallParam('cpath'),
                                    c46 : objMetrics.getCallParam('cpath')
                                };
                                break;

                            // TRACK AS WIDGET (DEFAULT)
                            default:
                                /*
                                 c8			= Product Type (Widget / Page / Etc. )
                                 c17		= Syndication Source (Calling Page)
                                 c27		= Delivery Framework: (Default: 'Widget Framework')
                                 c32		= Widget Id
                                 c33	 	= Product Interaction Type
                                 c47	 	= Feed Name

                                 BEACON -> OMNITURE PARAM CONVERSION
                                 OMNITURE 	BEACON PARAM 	DESCTIPTION
                                 beaconUrl 			Base URL for the beacon request URL
                                 omniturereportsuite	Substituted into beacon request URL
                                 pageName	contenttitle				Content title
                                 c2				documenttitle			Document title
                                 ch				omniturechannel		Omniture channel
                                 c4				registrationid			Content Syndication registration ID
                                 c3				hostname				Metrics host name (Not sure what this is)
                                 c1				url 						Metrics URL (not sure what this is)
                                 c5				language				Content language
                                 c16			urlreferrer				Referrer (manual, not inferred)
                                 c8				c8						Product / Related to Podcasts/RSS

                                 GLOBAL 		c33					Widget Interaction Type
                                 GLOBAL 		c14					Widget Interaction Value
                                 */
                                objSettingsReturn.params = {
                                    useMetrics: 'true',
                                    server : objMetrics.getCallParam('chost'),
                                    reportsuite : 'devcdc',
                                    c5 : objMetrics.getLanguageDefault(),
                                    c8: "Widget",
                                    c16: location.host + location.pathname,
                                    c17: objMetrics.getCallParam('chost') + objMetrics.getCallParam('cpath'),
                                    c27: "Widget Framework",
                                    pageName: objMetrics.getCallParam('wn')
                                    // REMOVED PER G.S.
                                    //omniturereportsuite : 'devcdc',
                                    //c1 : location.host + location.pathname,
                                    //c2 : document.title,
                                    //c3 : window.location.hostname,
                                    //hostname : location.hostname,
                                    //prodID: "widget-test",
                                    //channel: "widget-test-channel",
                                    //contentTitle : document.title,
                                    //pageName: objMetrics.getCallParam('wn'),
                                }
                                break;
                        };

                        return objSettingsReturn;

                    } () );

                    // GET OR DEFAULT INIT OVERRIDES
                    objSettings = objSettings || {};

                    // APPLY OVERRIDES TO SETTINGS OBJECT
                    for ( var key in objSettings) {
                        objMetrics.settings.params[key] = objSettings[key];
                    }

                    // LOAD TRACKING LIBRARIES IF/AS NEEDED
                    if (objMetrics.settings.blnPageLevelMetrics) {
                        // MODULE
                        if (objMetrics.settings.trackWidgetAs === "module") {
                            objCommon.loadScript('/JScript/metrics/topic_levels.js', function(){
                                objCommon.loadScript('/JScript/metrics/s_code_v21_cdcgov.js', function(){
                                    // "s" (Will now be available as a global variable)

                                    // Apply overrides to s
                                    for ( var key in objSettings) {
                                        s[key] = objSettings[key];
                                    }

                                    // Update Metrics Engine with Parameters
                                    updateVariables(s);
                                });
                            });
                        } else {
                            objCommon.loadScript('/JScript/metrics/widget/s_code.js', function(){
                                // "s" (Will now be available as a global variable)

                                // Apply overrides to s
                                for ( var key in objSettings) {
                                    s[key] = objSettings[key];
                                }

                                // Update Metrics Engine with Parameters
                                updateVariables(s);
                            });
                        }
                    }

                    // INIT BEACON ELEMENT
                    objMetrics.initBeacon();

                    // TRACK COMMON CORE LOAD
                    // objMetrics.trackEvent('widget-common-core-loaded');
                };

                // UPDATER
                objMetrics.update = function (objSettings) {

                    // GET OR DEFAULT INIT OVERRIDES
                    objSettings = objSettings || {};

                    // APPLY OVERRIDES TO SETTINGS OBJECT
                    for ( var key in objSettings) {
                        objMetrics.settings.params[key] = objSettings[key];
                    };

                    return true;
                };

                return objMetrics;
            } () );

            // COMMON EVENT HANDLERS
            objCommon.events = (function () {

                // RETURN OBJECT
                var objEventHandlers = {};

                // INTIALIZER
                objEventHandlers.init = function (objSettings) {

                    // CACHE ELEMENTS
                    objEventHandlers.elements = {
                        shareModal : document.getElementById('tp-widget-share-modal'),
                        infoModal : document.getElementById('tp-widget-info-modal'),
                        embedElement : document.getElementById('tp-widget-share-code')
                    };

                    // OPEN SHARE
                    objEventHandlers.shareOpen = function () {
                        if (objCommon.events.elements.shareModal) {
                            objCommon.metrics.trackEvent('Share Embed Code');
                            objCommon.events.elements.shareModal.style.display = 'block';
                        }
                    };

                    // CLOSE SHARE
                    objEventHandlers.shareClose = function () {
                        if (objCommon.events.elements.shareModal) {
                            objCommon.metrics.trackEvent('Share Embed Code Close');
                            objCommon.events.elements.shareModal.style.display = 'none';
                        }
                    };

                    // OPEN INFO
                    objEventHandlers.infoOpen = function() {
                        if (objCommon.events.elements.infoModal) {
                            objCommon.metrics.trackEvent('Info, About CDC');
                            objCommon.events.elements.infoModal.style.display = 'block';
                        }
                    };

                    // CLOSE INFO
                    objEventHandlers.infoClose = function() {
                        if (objCommon.events.elements.infoModal) {
                            objCommon.metrics.trackEvent('Info, About CDC Close');
                            objCommon.events.elements.infoModal.style.display = 'none';
                        }
                    };

                    objEventHandlers.logoClick = function() {
                        objCommon.metrics.trackEvent('CDC Logo');
                    }

                    // SET EMBED CODE
                    objEventHandlers.setEmbedCode = function (strEmbedCode) {
                        objCommon.runtime.embedCode = strEmbedCode || ""
                        if (objCommon.events.elements.embedElement) {
                            objCommon.events.elements.embedElement.innerHTML= objCommon.runtime.embedCode;
                        }
                    };

                    objEventHandlers.selectAllText = function () {
                        this.setSelectionRange(0, this.value.length);
                    };
                };

                return objEventHandlers;
            } () );

            // SET RUNTIME DEFAULT
            objCommon.runtime = {
                loggingEnabled : true,
                callParams : {},
                widgetScript : (function(){

                    // GET ROOT ELEMENT OF CALLING PAGE
                    var target = document.documentElement;

                    // GET LAST CHILD THEREOF (AT TIME OF LOAD - SHOULD BE THE SCRIPT TAG)
                    while (target.childNodes.length && target.lastChild.nodeType == 1) {
                        target = target.lastChild;
                    }

                    // LOOK FOR CUSTOM WIDGET SCRIPT ATTRIBUTE
                    if (target && target.getAttribute('data-widget-script')) {

                        // RETURN IT IF FOUND
                        return target.getAttribute('data-widget-script');
                    } else {

                        // OTHERWISE RETURN DEFAULT
                        return './widget.js';
                    }
                } ())
            };

            // LOGGING HANDLER
            objCommon.log = (function () {

                // PARAM CONSOLE IF NEEDED
                var console = window.console || {
                        log : function(){},
                        warn : function(){},
                        error : function(){},
                        time : function(){},
                        timeEnd : function(){}
                    };

                return function(anyArg) {

                    if (objCommon.runtime.loggingEnabled) {
                        // BASIC DEGRADING LOGGING HANDLER
                        if (console && console.log) {
                            if (typeof(anyArg) === 'string') {
                                console.log(objCommon.getCallParam('wid') + ': ' + anyArg);
                            } else {
                                console.log(anyArg);
                            }
                        }
                    }

                    return objCommon.runtime.loggingEnabled;
                };
            } ());

            // RETURN SELF
            return objCommon;
        } () );

    // EXECUTE INIT
    window.CDC.Widget.Common.init();

} (window, document));/**
 * Created by jason on 7/7/16.
 */
