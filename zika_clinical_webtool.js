$(document).ready(function(){
    start.click(function() {
        cdcMetrics.trackEvent("ButtonClicked", "Start");
        introPanel.hide();
        mainPanel.show();
        loadNode("1");
    });

    back.click(function(){
        cdcMetrics.trackEvent("ButtonClicked", "Back");

        var size = nodeHistory.length;
        if(size > 0){
            loadNode(getPreviousNode().node);
            if(debug){
                logNodeHistory();
            }
        }
        else{
            //back should restart the app when on question 1
            triggerRestart();
        }
    });
    nextButton.click(function(){
        nextButtonClicked();
    });
    restart.click(function(){
        cdcMetrics.trackEvent("ButtonClicked", "Restart");
        triggerRestart();
    });
});

//panels
var introPanel = $("#zika-app-intro");
var mainPanel = $("#zika-app-main");

//panel content
var endpointContent = $("#zika-app-endpoint");
var endpointText = $("#zika-app-endpoint-text");
var endpointAdditionalNotes = $("#zika-app-endpoint-additional-notes");
var endpointDisclaimer = $("#zika-app-endpoint-disclaimer");
var questionContent = $("#zika-app-question");
var questionText = $("#question-text");
var questionAnswers = $("#question-answers");
var alertArea = $("#alert-area");

//Nav buttons
var start = $("#start");
var back = $("#back");
var restart = $("#restart");
var nextButton = $("#next");

var debug = false;
var currentQuestionNumber;

//NodeHistory object stores the users activity: node and answer, if applicable
//for each node in the decision tree.
// The nodeName will correspond to an object in the list of nodes.
//Answers will be either a number, string, or array of strings
//for radio, singleSelect, or multiSelect types, respectively.
function NodeHistory(nodeName, answer){
    this.node = nodeName;
    this.answer = answer;
}

/*array to store answers
 Each index of nodeHistory stores a NodeHistory object
 */
var nodeHistory = [];

function logNodeHistory(){
    console.log(nodeHistory);
}

//return Question object from nodes array
function getNode(nodeName){
    return nodes[nodeName];
}

//return previous user answer, if there is one
function getPreviousNode(){
    var numUserAnswers = nodeHistory.length;
    if(numUserAnswers > 0) {
        return nodeHistory[numUserAnswers - 1];
    }
}

//return userAnswer by index, if it exists
function getNodeHistoryByIndex(number){
    if(nodeHistory.length > 0 && number >= 0 && number < nodeHistory.length) {
        return nodeHistory[number];
    }
}

function loadNode(nodeName){
    //set global question number to nextNode
    currentQuestionNumber = "" +nodeName;
    var node = getNode(nodeName);
    switch(node.nodeType){
        case NodeType.QUESTION:
            loadQuestion(nodeName);
            break;
        case NodeType.ENDPOINT:
            loadEndPoint(nodeName);
            break;
        case NodeType.APP_INFO:
            loadAppInfo(nodeName);
            break;
    }
}

function loadQuestion(nextQuestionNumber){
    clearMainPanel();
    nextButton.show();
    questionContent.show();

    var nextQuestionObject = getNode(nextQuestionNumber);
    if(debug){
        var nodeText = "Screen number: " +nextQuestionNumber;
        nodeText += "<br />";
        questionText.html(nodeText);
    }

    var previouslyVisited = false;
    var previousAnswerObject;
    if(nodeHistory.length > 0 && getPreviousNode().node === nextQuestionNumber){
        previouslyVisited = true;
        previousAnswerObject = getPreviousNode();
    }
    if(nextQuestionObject.hasOwnProperty('footnotes')){
        $('#question-footnotes').html(nextQuestionObject.footnotes.text);
    }

    //Build question based on next question's answerType
    switch (nextQuestionObject.answerType){
        case AnswerType.NONE:
            if(previouslyVisited){
                nodeHistory.pop();
            }
            questionText.append('<strong>' +nextQuestionObject.text +'</strong>');
            break;
        case AnswerType.SINGLESELECT:
            questionAnswers.html(populateSingleSelectList(nextQuestionObject)).show();
            if(previouslyVisited){
                $("#singleSelectList").val(previousAnswerObject.answer).trigger("change");
                nodeHistory.pop();
            }

            //clear alerts on country selected
            $("#singleSelectList").change(function(){
                alertArea.html("");
            });
            break;
        case AnswerType.MULTISELECT:
            questionAnswers.html(populateMultiSelectList(nextQuestionObject)).show();
            if(previouslyVisited){
                $("#multiSelectList").find("input:checkbox").each(function(){
                    var answerChecked = previousAnswerObject.answer.indexOf($(this).val());
                    $(this).prop('checked', answerChecked >= 0);
                });
                nodeHistory.pop();
            }
            $("#multiSelectList").multiselect();

            //clear alerts on checkbox checked
            $("input:checkbox").change(function(){
                alertArea.html("");
            });

            break;
        case AnswerType.RADIO:
            questionAnswers.html(populateRadioList(nextQuestionObject)).show();
            if(previouslyVisited) {
                $("input[name=optionsRadios]").each(function () {
                    var answerChecked = previousAnswerObject.answer.indexOf($(this).val());
                    $(this).prop('checked', answerChecked >= 0);
                });
                nodeHistory.pop();
            }

            //clear alerts on radio selected
            $("input[name=optionsRadios]:radio").change(function(){
                alertArea.html("");
            });
            break;
    }
    if(navigator.userAgent.match(/iPhone|iPad|iPod/i)){

    } else {
        $('.scrollable').focus();
    }
}

function loadEndPoint(number){
    clearMainPanel();
    //if previously visited, pop last entry
    if(nodeHistory.length > 0 && getPreviousNode().node === number){
        nodeHistory.pop();
    }
    var nodeObject = getNode(number);
    cdcMetrics.trackEvent("Endpoint Reached", nodeObject.endpointName);

    if(debug){
        var nodeNumText = "Screen number: " +number;
        endpointText.html("<div><strong>" +nodeNumText +"</strong></div></br>");
    }

    endpointText.append($('<div>').load("html/endpoints.html #" +nodeObject.endpointName));
    endpointDisclaimer.load("html/disclaimers.html #allResults");

    endpointContent.show();

    if(navigator.userAgent.match(/iPhone|iPad|iPod/i)){

    } else {
        $('.scrollable').focus();
    }
}

function loadAppInfo(number) {
    introPanel.hide();
    mainPanel.show();
    clearMainPanel();
    var nodeObject = getNode(number);
    if(number === 46){
        $("#zika-app-info").load("/TemplatePackage/contrib/ssi/cdc-privacy-policy-eng.html");
    } else if (number === 37){
        $("#zika-app-info").html(
            '<h4>Embed code</h4>'
            +'Copy the code below and paste it into your webpage.<br/><br/>'
            +'<div contenteditable="true">'
            +cdcCommon.runtime.embedCode
            +'</div>'
        );
    } else {
        $("#zika-app-info").append($('<div>').load("html/endpoints.html #" + nodeObject.endpointName));
    }
    $("#zika-app-info").show();

    if(navigator.userAgent.match(/iPhone|iPad|iPod/i)){

    } else {
        $('.scrollable').focus();
    }
}

function clearMainPanel(){
    $('.scrollable').animate({ scrollTop: 0 }, 0);
    //endpoint
    endpointText.html("");
    endpointAdditionalNotes.html("");
    endpointDisclaimer.html("");
    endpointContent.hide();

    //reset question area
    questionText.html("");
    questionContent.hide();
    questionAnswers.html("");
    questionAnswers.hide();
    $("#question-footnotes").html("");

    //reset app info area
    $("#zika-app-info").html("");
    $("#zika-app-info").hide();

    //hide next button
    nextButton.hide();

    //reset alert area
    alertArea.html("");
}

//populate singleSelect list
var populateSingleSelectList = function(questionObject) {
    var nextQuestionObject = questionObject;
    var listHTML = '';
    listHTML += '<form id="singleSelectListDiv" role="form" class="form-group">';
    listHTML += '<label id="singleSelectLabel" for="singleSelectList">';
    listHTML += nextQuestionObject.text;
    listHTML += '</label>';
    listHTML += '<select id="singleSelectList" class="form-control"><option></option>';
    $.each(nextQuestionObject.getValuesForAnswers(), function (key, value) {
        listHTML += '<option value=' + key + '>' + value.text + '</option>';
    });
    listHTML += '</select></form>';
    return listHTML;
};
//populate multiSelect list
var populateMultiSelectList = function(questionObject) {
    var nextQuestionObject = questionObject;
    var listHTML = "";
    listHTML += '<div id="multiSelectListDiv">';
    listHTML += '<label id="multiSelectLabel" for="multiSelectList">';
    listHTML += nextQuestionObject.text;
    listHTML += '</label>';
    listHTML +='<div role="group" aria-labelledby="multiSelectLabel" id="multiSelectList" class="multiselect">';
    $.each(nextQuestionObject.getValuesForAnswers(), function (key, value) {
        listHTML += '<label><input class="checkboxListItem" style="margin-left: 10px; margin-right: 10px"' +
            ' type="checkbox" name="option[]" value="' + key + '">' + value.text + '</label>';
    });
    listHTML += '</div></div>';
    return listHTML;
};
var populateRadioList = function(questionObject){
    var nextQuestionObject = questionObject;
    var radioButtonsHTML = '';
    radioButtonsHTML += '<div id="radio_label">' +nextQuestionObject.text +'</div>';
    radioButtonsHTML += '<div role="radiogroup" aria-labelledby="' +"radio_label" +'">';

    $.each(nextQuestionObject.getValuesForAnswers(), function (key, value) {
        radioButtonsHTML += '<div class="radio z-risk-rad">';
        radioButtonsHTML += '<label>';
        radioButtonsHTML += '<input type="radio" class="radioAnswer" name="optionsRadios" value="'
            + key + '">';
        radioButtonsHTML += value.text;
        radioButtonsHTML += '</label>';
        radioButtonsHTML += '</div>';
    });
    radioButtonsHTML += '</div>';
    return radioButtonsHTML;
};
function noSelectionAlert(){
    var alert = '<div id="noSelectionAlert" class="alert alert-warning fade in" role="alert">';
    alert += '<a href="#" class="close" id="close-alert" style="text-decoration: none;"data-dismiss="alert"' +
        ' role="button" aria-label="close">&times;</a>';
    alert += '<strong>Please make a selection.</strong>';
    alert += '</div>';
    alertArea.html(alert);

    //return focus to Next button when close alert button is clicked
    if(navigator.userAgent.match(/iPhone|iPad|iPod/i)){

    } else {

        $('#noSelectionAlert').on('closed.bs.alert', function () {

            $('#next').focus();
        });

        //focus on close alert button when noSelectionAlert is displayed
        $('#close-alert').focus();
    }
    $('.scrollable').animate({ scrollTop: 0 }, 0);
}
function triggerRestart(){
    nodeHistory = [];
    clearMainPanel();
    introPanel.show();
    mainPanel.hide();
    $('.scrollable').animate({ scrollTop: 0 }, 0);
    if(navigator.userAgent.match(/iPhone|iPad|iPod/i)){

    } else {
        $('.scrollable').focus();
    }
}

function nextButtonClicked(){
    var answerInput;
    var selection;
    var currentQuestionObject = getNode(currentQuestionNumber);
    var selectedAnswerObject;

    switch(currentQuestionObject.answerType) {
        case AnswerType.MULTISELECT:
            answerInput = $('#multiSelectList input:checkbox:checked');
            selection = $.map(answerInput, function (option) {
                return option.value;
            });
            if(selection.length === 0){
                noSelectionAlert();
                return;
            }
            break;
        case AnswerType.SINGLESELECT:
            selection = $("#singleSelectList").val();
            if(selection === ""){
                noSelectionAlert();
                return;
            }
            break;
        case AnswerType.RADIO:
            selection = $("input[name=optionsRadios]:checked").val();
            if(selection == null){
                noSelectionAlert();
                return;
            }
            break;
        case AnswerType.NONE:
            if(currentQuestionNumber === "2") {
                selection = "Accepted Disclaimer";
                trackAnswer(selection);
            }
            break;
    }
    nodeHistory.push(new NodeHistory(currentQuestionNumber, selection));

    if(debug){
        logNodeHistory();
    }

    selectedAnswerObject = currentQuestionObject.decideChoice(nodeHistory[nodeHistory.length - 1]);
    loadNode(selectedAnswerObject.nextNode);
}

//Used to resize widget when content changes.
//Set parentIFrame size to height of widget-wrapper.
function resizeWidget (intMsDelay) {
    intMsDelay = intMsDelay || 250;
    window.setTimeout(function(){
        if (window.hasOwnProperty('parentIFrame') && window.parentIFrame.hasOwnProperty('size')) {
            window.parentIFrame.size($('.widget-wrapper').height());
            console.log('resize triggered');
        } else {
            console.log('warn resize unavailable, Please ensure this widget is being loaded within the widget framework');
        }
    }, intMsDelay, false);

    return true;
}

//Styles checkboxes to appear similar to a multiple select list.
jQuery.fn.multiselect = function() {
    $(this).each(function() {
        var checkboxes = $(this).find("input:checkbox");
        checkboxes.each(function() {
            var checkbox = $(this);
            // Highlight pre-selected checkboxes
            if (checkbox.prop("checked"))
                checkbox.parent().addClass("multiselect-on");

            // Highlight checkboxes that the user selects
            checkbox.change(function() {
                if (checkbox.prop("checked"))
                    checkbox.parent().addClass("multiselect-on");
                else
                    checkbox.parent().removeClass("multiselect-on");
            });
        });
    });
};

function trackAnswer(answer){
    cdcMetrics.trackEvent("Question " +currentQuestionNumber + " answered", answer);
}
var NodeType = {
    QUESTION: "question",
    ENDPOINT: "endpoint",
    APP_INFO: "app info"
};
var AnswerType = {
    SINGLESELECT: "singleSelect",
    MULTISELECT: "multiSelect",
    RADIO: "radio",
    NONE: "none"
};
var Disclaimers = {

};
var AdditionalNotes = {

};

var nodes = {
    decisionLogic: {
        //Generic logic for radio button answerType
        getRadioAnswer: function(questionNumber, selection){
            var questionObject = getNode(questionNumber);
            var answerObject = questionObject.answers["" +selection];
            trackAnswer(answerObject.text);
            return answerObject;
        },
        getAnswerForNodeByName: function (nodeName) {
            var results = null;
            for(var i = 0; i < nodeHistory.length; i++) {
                var currentAnswer = nodeHistory[i];
                if(currentAnswer.node === nodeName) {
                    results = currentAnswer;
                }
            }

            if(results === null) {
                triggerRestart();
            } else {
                return results;
            }
        },
        getNextNodeFromTestResults: function () {
            var answerTo23 = nodes.decisionLogic.getAnswerForNodeByName('23').answer;
            var answerToZikaNAT = nodes.decisionLogic.getAnswerForNodeByName('24').answer;
            var answerToZikaIgM = null;


            if (answerToZikaNAT === "1") {
                if (answerTo23 === "1") {
                    return {nextNode: 51};
                } else {
                    answerToZikaIgM = nodes.decisionLogic.getAnswerForNodeByName('33').answer;
                    if (answerToZikaIgM === "1") {
                        return {nextNode: 25};
                    } else {
                        return {nextNode: 35};
                    }
                }
            } else {
                if (answerTo23 === "1") {
                    return {nextNode: 32};
                } else {
                    answerToZikaIgM = nodes.decisionLogic.getAnswerForNodeByName('33').answer;
                    if (answerToZikaIgM === "1") {
                        return {nextNode: 26};
                    } else {
                        if (answerTo23 === "2") {
                            return {nextNode: 50};
                        }
                        var answerToDengueIgM = nodes.decisionLogic.getAnswerForNodeByName('39').answer;
                        if(answerToDengueIgM === "1") {
                            return {nextNode: 40};
                        } else {
                            return {nextNode: 34};
                        }

                    }
                }
            }
        }
    },
    1: {
        text: "Select your profession:",
        answers: {
            1: {
                text: "Obstetrician/Gynecologist",
                nextNode: 2
            },
            2: {
                text: "Family Physician",
                nextNode: 2
            },
            3: {
                text: "Nurse",
                nextNode: 2
            },
            4: {
                text: "Nurse-midwife",
                nextNode: 2
            },
            5:{
                text: "Other healthcare provider",
                nextNode: 2
            },
            6:{
                text: "State health department official",
                nextNode: 2
            },
            7:{
                text: "Territorial health department official",
                nextNode: 2
            },
            8:{
                text: "City health department official",
                nextNode: 2
            },
            9:{
                text: "Local health department official",
                nextNode: 2
            },
            10:{
                text: "Other",
                nextNode: 2
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function(){
            return this.answers;
        }
    },
    2: {
        text: "<div>The User acknowledges and agrees that this tool is provided for informational purposes only and that the "
        +"product is not intended to be (nor should it be used as) a substitute for the exercise of your professional "
        +"judgment."
        +"<br /><br />"
        +"The product is being provided for informational purposes only. Therefore, User should continue to check the CDC "
        +"website for the current version of the CDC "
        +"<a target='_blank' href='http://www.cdc.gov/zika/hc-providers/pregnant-woman.html'>Updated Interim Guidance for "
        +"Healthcare Providers Caring for Pregnant Women</a>. This product is provided without warranties of any "
        +"kind, express or implied, and the authors disclaim any liability, loss, or damage caused by it or its content."
        +"<br /><br />"
        +"By clicking the \"Next\" button below, you have indicated your acceptance of these terms.</div>",
        answers: {
            0: {
                nextNode: 3
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.NONE,
        getValuesForAnswers: function(){
            return this.answers;
        },
        decideChoice: function(nodeHistoryObject){
            return this.answers["0"];
        }
    },
    3: {
        text: "To begin, please choose one of the following options to indicate what information you are looking for.",
        answers: {
            1: {
                text: "Information to help decide if Zika virus testing is needed.",
                nextNode: 4
            },
            2: {
                text: "Information to understand how to interpret test results and manage clinical care.",
                nextNode: 23
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function(){
            return this.answers;
        }
    },
    4: {
        text: 'Does your pregnant patient live in an area with a '
        +'<a target="_blank" href="https://www.cdc.gov/zika/geo/countries-territories.html">CDC Zika travel notice</a>'
        +' or <a target="_blank" href="https://www.cdc.gov/zika/geo/index.html">domestic travel guidance</a>?',
        answers: {
            1: {
                text: "Yes",
                nextNode: 17
            },
            2: {
                text: "No",
                nextNode: 5
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    5: {
        text: "<div id='q5'>Has your pregnant patient previously lived in or traveled to "
        +"one of the areas listed below "
        +"during pregnancy or periconceptional period?<br />"
        +"</div>",
        answers: {
            1:{
                text: 'An international area with a '
                +'<a target="_blank" href="https://www.cdc.gov/zika/geo/countries-territories.html">'
                +'current Zika Travel Notice</a>.',
                nextNode: 15
            },
            2:{
                text: 'An area in the <a target="_blank" href="https://www.cdc.gov/zika/geo/index.html">'
                +'United States with a risk of Zika</a>.',
                nextNode: 15
            },
            3:{
                text: 'Other areas with a <a target="_blank" href="https://www.cdc.gov/zika/geo/countries-territories.html">'
                +'risk of Zika</a>.',
                nextNode: 48
            },
            4: {
                text: "None of the above",
                nextNode: 6
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        footnotes:{
            text: '<div>*Please note:'
            +'<ul>'
            +'<li>Many people move fluidly and regularly between areas with and without active Zika transmission to '
            +'live, work, attend school, socialize, and seek medical care. Those who live in areas without active Zika '
            +'transmission may not regard these activities as "travel." This context should be considered when asking '
            +'women about travel history and potential exposure to Zika.</li>'
            +'<li>Periconceptional period is defined as eight weeks before conception or six weeks before last '
            +'menstrual period.</li></ul></div>'
        },
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    6: {
        text: "Has your pregnant patient had sex (vaginal, anal, or oral sex) without a condom with a partner who " +
        "lives in or has traveled to one of the areas listed below?",
        answers: {
            1: {
                text: 'An international area with a <a target="_blank" href="https://www.cdc.gov/zika/geo/countries-territories.html">'
                +'current Zika Travel Notice</a>.',
                nextNode: 7
            },
            2: {
                text: 'An area in the <a target="_blank" href="https://www.cdc.gov/zika/geo/index.html">'
                +'United States with a risk of Zika</a>.',
                nextNode: 7
            },
            3:{
                text: 'Other areas with a <a target="_blank" href="https://www.cdc.gov/zika/geo/countries-territories.html">'
                +'risk of Zika</a>.',
                nextNode: 48
            },
            4: {
                text: "None of the above",
                nextNode: 14
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        footnotes:{
            text: 'Please note:<br/><div><ul>'
            +'<li>This question refers to sexual activity without a condom at any time during pregnancy or during '
            +'the periconceptional period, which is defined as eight weeks before conception or six weeks before '
            +'last menstrual period.</li>'
            +'</ul></div>'
        },
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    7:{
        text: "Does your pregnant patient have one or more symptoms consistent with Zika virus disease: fever, rash, " +
        "arthralgia, or conjunctivitis? ",
        answers:{
            1:{
                text: "Yes",
                nextNode: 8
            },
            2:{
                text: "No",
                nextNode: 12
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function(){
            return this.answers;
        }
    },
    8:{
        text: "How long ago did symptom(s) begin?",
        answers:{
            1:{
                text: "≤12 weeks",
                nextNode: 10
            },
            2:{
                text: ">12 weeks",
                nextNode: 11
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function(){
            return this.answers;
        }
    },
    10: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "zikaAndDengueIgMTests"
    },
    11: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "clinicalManagementOver12weeks"
    },
    12: {
        text: "How long ago was possible exposure (travel or unprotected sex)?",
        answers: {
            1: {
                text: "≤12 weeks",
                nextNode: 13
            },
            2: {
                text: ">12 weeks",
                nextNode: 11
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    13: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "zikaIgMTest"
    },
    14: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "lowRiskOfExposure"
    },
    15: {
        text: "You indicated that your patient has traveled to a Zika affected area. Was this a single trip?",
        answers: {
            1: {
                text: "Yes",
                nextNode: 7
            },
            2: {
                text: "No",
                nextNode: 16
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    16: {
        text: "How frequently do they travel to this area?",
        answers: {
            1: {
                text: "Daily or weekly",
                nextNode: 17
            },
            2: {
                text: "Less frequently than weekly",
                nextNode: 7
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function(){
            return this.answers;
        }
    },
    17: {
        text: "Does your pregnant patient have one or more symptoms consistent with Zika virus disease: fever, rash, " +
        "arthralgia, or conjunctivitis?",
        answers: {
            1: {
                text: "Yes",
                nextNode: 18
            },
            2: {
                text: "No",
                nextNode: 19
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    18: {
        text: "How long ago did symptom(s) begin?",
        answers: {
            1: {
                text: "≤12 weeks",
                nextNode: 10
            },
            2: {
                text: ">12 weeks",
                nextNode: 11
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    19: {
        text: "Has the patient already been tested in this trimester?",
        answers: {
            1: {
                text: "Yes",
                nextNode: 20
            },
            2: {
                text: "No",
                nextNode: 13
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    20: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "clinicalManagementPresentingForCareIn3rdTrimesterAsymptomaticPregnantWomenAtOngoingRiskForExposure"
    },
    21: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "prenatalClinicalManagement3rdTrimester"
    },
    23: {
        /*
            The answer to this node is used by 24, 33, & 39. If this node number changes,
            decisionLogic & decideChoice must be updated for these questions.
         */
        text: "Select results you have received",
        answers: {
            1: {
                text: "Zika virus NAT (Still awaiting IgM results)",
                nextNode: '24'
            },
            2: {
                text: "Zika virus NAT and Zika virus IgM",
                nextNode: '24'
            },
            3:{
                text: "Zika virus NAT, Zika virus IgM and dengue IgM",
                nextNode: '24'
            },
            4: {
                text: "PRNT",
                nextNode: 44
            }

        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    24: {
        text: "What were the results of the Zika virus NAT on serum or urine?",
        /*
            This node uses answer from 23.
            The next node for these answers are determined by decisionLogic.getNextNodeFromTestResults();
         */
        answers: {
            1: {
                text: "Positive on either serum or urine",
                nextNode: -1
            },
            2: {
                text: "Negative on both serum AND urine",
                nextNode: -1
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            var answerObject = this.answers["" +nodeHistoryObject.answer];
            trackAnswer(answerObject.text);
            var answerTo23 = nodes.decisionLogic.getAnswerForNodeByName("23");
            if(answerTo23.answer != "1") {
                return {nextNode: '33'};
            } else {
                return nodes.decisionLogic.getNextNodeFromTestResults();
            }
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    25: {
        text: "<div><strong>Interpretation of test result:</strong> Test results suggest recent maternal Zika virus infection. </div></br><strong>Action needed: Zika virus infection and disease are nationally notifiable conditions. Your patient meets criteria for reporting to the <a target='_blank' href='http://www.cdc.gov/zika/hc-providers/registry.html'>US Zika Pregnancy Registry</a> and to the National Notifiable Disease Surveillance System (NNDSS). </strong> Report information about pregnant women with laboratory evidence of Zika virus to your state, tribal, local, or territorial health department. <ul> <li>If you are a healthcare provider or health department and you have questions about the registry, please <a href='mailto:ZikaMCH@cdc.gov'>email</a> or call 770-488-7100 and ask for the Zika Pregnancy Hotline.</li></ul></div></br><div>Is the patient still pregnant?</div>",
        answers: {
            1: {
                text: "Yes",
                nextNode: 27
            },
            2: {
                text: "No",
                nextNode: 28
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    26: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "presumptiveRecentZikaVirusOrDengueVirusOrFlavivirusInfection"
    },
    27: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "prenatalClinicalManagementRecentZikaInfectionOrFlavivirusNOS"
    },
    28: {
        text: "Did the pregnancy result in a live birth or pregnancy loss?",
        answers: {
            1: {
                text: "Live birth",
                nextNode: 29
            },
            2: {
                text: "Pregnancy loss",
                nextNode: 30
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    29: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "postnatalClinicalManagementRecentZIKVInfectionOrFlavivirusNOSLiveBirth"
    },
    30: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "postnatalClinicalManagementRecentZIKVInfectionOrFlavivirusNOSPregnancyLoss"
    },
    32:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "negativeNATawaitAdditionalTestResults"
    },
    33: {
        text: "What were the results of the Zika IgM test?",
        /*
         This node uses answers from 23 & 24.
         The next node for these answers are determined by decisionLogic.getNextNodeFromTestResults();
         */
        answers:{
            1:{
                text: "Positive, equivocal, presumptive, or possible",
                nextNode: -1
            },
            2:{
                text: "Negative",
                nextNode: -1
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            var answerObject = this.answers["" +nodeHistoryObject.answer];
            trackAnswer(answerObject.text);

            //Check answer 23 to see if dengue result was received
            var answerTo23 = nodes.decisionLogic.getAnswerForNodeByName("23").answer;

            if(answerTo23 === "3") {
                return {nextNode: '39'};
            } else {
                return nodes.decisionLogic.getNextNodeFromTestResults();
            }
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    34:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "noEvidenceOfRecentZIKVInfection"
    },
    35:{
        text: '<div>'
            +'<strong>Interpretation:</strong> Test results suggest recent maternal Zika virus infection. However, '
            +'additional testing may be indicated. <br /><br />'
            +'<strong>Action needed:</strong> Despite the specificity of NAT, false positive NAT results have been '
            +'reported. In a pregnant woman with a positive NAT and a negative IgM result who is asymptomatic or '
            +'the specimen was collected ≥14 days from symptom onset, confirm results by repeat NAT on the original serum '
            +'sample. <br /><br />'
            +' <strong>To order test:</strong> Healthcare and laboratory professionals are instructed to direct Zika '
            +'virus testing requests to their local or state public health laboratory or to a commercial laboratory that '
            +'performs Zika testing using a validated assay with demonstrated analytical and clinical performance. '
            +'Healthcare and laboratory professionals should follow state or local public health department guidance on '
            +'notification procedures for suspect cases of Zika virus infection. Visit '
            +'<a target="_blank" href="http://www.cdc.gov/zika/laboratories/test-specimens-bodyfluids.html">'
            +'CDC’s Collecting & Submitting Body Fluid Specimens for Zika Virus Testing</a> web page for guidance.'
            +'<br /><br />'
            +'<strong>Action needed: Zika virus infection and disease are nationally notifiable conditions. Your '
            +'patient meets criteria for reporting to the '
            +'<a target="_blank" href="http://www.cdc.gov/zika/hc-providers/registry.html">US Zika Pregnancy Registry</a>'
            +' and to the National Notifiable Disease Surveillance System (NNDSS). </strong> Report information about '
            +'pregnant women with laboratory evidence of Zika virus to your state, tribal, local, or territorial '
            +'health department. '
            +'<ul><li>If you are a healthcare provider or health department and you have questions about the registry, '
            +'please <a href="mailto:ZikaMCH@cdc.gov">email</a> or call 770-488-7100 and ask for the Zika Pregnancy '
            +'Hotline.</li></ul>'
            +'Is the patient still pregnant?</div>',
        answers: {
            1: {
                text: "Yes",
                nextNode: 27
            },
            2: {
                text: "No",
                nextNode: 28
            }
        },
        footnotes: {
            text: "<strong>Follow-up action might be needed. Return to this tool for help interpreting the test "
            +"results and determining if additional testing might be needed to confirm or rule out Zika virus "
            +"infection.</strong>"
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function (nodeHistoryObject) {
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function () {
            return this.answers;
        }
    },
    36: {
        text: "<div><strong>Interpretation of test result:</strong> Test results indicate presumptive recent Zika virus infection or recent maternal flavivirus infection, but the specific virus cannot be identified.<div><br/>Is the patient still pregnant?</div>",
        answers: {
            1: {
                text: "Yes",
                nextNode: 38
            },
            2: {
                text: "No",
                nextNode: 52
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    37 : {
        nodeType: NodeType.APP_INFO,
        endpointName: "embed"
    },
    38:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "prenatalClinicalManagementPresumptiveRecentZIKVInfectionOrFlavivirusNOS"
    },
    39: {
        text: "What were the results of the dengue virus IgM test?",
        /*
         This node uses answers from 24 & 33.
         The next node for these answers are determined by decisionLogic.getNextNodeFromTestResults();
         */
        answers: {
            1: {
                text: "Positive or equivocal",
                nextNode: -1
            },
            2: {
                text: "Negative",
                nextNode: -1
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            var answerObject = this.answers["" +nodeHistoryObject.answer];
            trackAnswer(answerObject.text);

            return nodes.decisionLogic.getNextNodeFromTestResults();
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    40:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "prnt"
    },
    44:{
        text: "What were the results of the PRNT tests?",
        answers: {
            1: {
                text: "Zika virus PRNT ≥10 AND dengue virus <10",
                nextNode: 25
            },
            2: {
                text: "Zika virus PRNT ≥10 AND dengue virus PRNT ≥10",
                nextNode: 47
            },
            3:{
                text: "Zika virus PRNT <10",
                nextNode: 34
            },
            4:{
                text: "Other",
                nextNode: 45
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    45:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "IngridsPaper"
    },
    46: {
        nodeType: NodeType.APP_INFO,
        endpointName: "privacy"
    },
    47: {
        text: "<div><strong>Interpretation of test result:</strong> Test results suggest recent maternal flavivirus infection, but the specific virus cannot be identified.</div></br><div>Is the patient still pregnant?</div>",
        answers: {
            1: {
                text: "Yes",
                nextNode: 27
            },
            2: {
                text: "No",
                nextNode: 52
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    48: {
        text: "Does your pregnant patient have one or more symptoms consistent with Zika virus disease: fever, rash, " +
        "arthralgia, or conjunctivitis?",
        answers: {
            1: {
                text: "Yes",
                nextNode: 18
            },
            2: {
                text: "No",
                nextNode: 49
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    49: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "testingNotRoutinelyRecommended"
    },
    50: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "noEvidenceOfRecentZikaVirusInfection"
    },
    51: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "positiveNATawaitAdditionalResults"
    },
    52: {
        text: "Did the pregnancy result in a live birth or pregnancy loss?",
        answers: {
            1: {
                text: "Live birth",
                nextNode: 53
            },
            2: {
                text: "Pregnancy loss",
                nextNode: 54
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function (nodeHistoryObject) {
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function () {
            return this.answers;
        }
    },
    53: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node53"
    },
    54: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node54"
    },
    55: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node55"
    }
};

