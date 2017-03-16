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
    endpointDisclaimer.load("html/disclaimers.html #allResults")

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
}
var AnswerType = {
    SINGLESELECT: "singleSelect",
    MULTISELECT: "multiSelect",
    RADIO: "radio",
    NONE: "none"
}
var Disclaimers = {

}
var AdditionalNotes = {

}

var nodes = {
    decisionLogic: {
        //Generic logic for radio button answerType
        getRadioAnswer: function(questionNumber, selection){
            var questionObject = getNode(questionNumber);
            var answerObject = questionObject.answers["" +selection];
            trackAnswer(answerObject.text);
            return answerObject;
        },
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
                text: "Information to understand how to interpret INITIAL test results and manage clinical care.",
                nextNode: 23
            },
            3: {
                text: "Information to understand how to interpret SUBSEQUENT test results that were completed to " +
                "confirm or rule out an infection.",
                nextNode: 41
            },
            4: {
                text: "Next steps for a patient who already received a negative rRT-PCR result within 2 weeks of " +
                "possible exposure and returned 2-12 weeks later for a Zika IgM test.",
                nextNode: 13
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
        text: "Does your pregnant patient live in an area (domestic or international) with a risk of Zika?",
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
        footnotes:{
            text: "<div>*To see if your patient lives in an area with a risk of Zika, check this <a target='_blank' href='https://wwwnc.cdc.gov/travel/page/world-map-areas-with-zika'>map</a>.<br/>"+
            "</div>"
        },
        decideChoice: function(nodeHistoryObject){
            return nodes.decisionLogic.getRadioAnswer(nodeHistoryObject.node, nodeHistoryObject.answer);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    5: {
        text: "<div id='q5'>Has your pregnant patient lived in or traveled to "
        +"one of the areas listed below "
        +"during pregnancy or periconceptional period?<br />"
        +"</div>",
        answers: {
            1:{
                text: '<div>An area with a risk of Zika and a current Zika Travel Notice <a target="_blank" '
                +'href="https://wwwnc.cdc.gov/travel/page/zika-travel-information">'
                +'(listed on this Zika travel webpage in the box titled Zika Travel Notices)</a></div>',
                nextNode: 15
            },
            2:{
                text: 'An area with a risk of Zika but no Zika Travel Notice <a target="_blank" '
                +'href="https://wwwnc.cdc.gov/travel/page/zika-travel-information">'
                +'(listed on this Zika travel webpage in the box titled Other Areas with Zika Risk)</a></div>',
                nextNode: 48
            },
            3: {
                text: "Neither",
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
                text: '<div>An area with a risk of Zika in the United States OR in an international area with a current Zika Travel Notice <a target="_blank" '
                +'href="https://wwwnc.cdc.gov/travel/page/zika-travel-information">'
                +'(listed on this Zika travel webpage in the box titled Zika Travel Notices)</a></div>',
                nextNode: 7
            },
            2:{
                text: 'An area with a risk of Zika but no current Zika Travel Notice <a target="_blank" '
                +'href="https://wwwnc.cdc.gov/travel/page/zika-travel-information">'
                +'(listed on this Zika travel webpage in the box titled Other Areas with Zika Risk)</a></div>',
                nextNode: 48
            },
            3: {
                text: "Neither",
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
            +'<li>To see if your patient lives in an area with a risk of Zika, check this '
            +'<a target="_blank" href="https://www.cdc.gov/zika/intheus/maps-zika-us.html">map</a>.</li>'
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
                text: "<2 weeks",
                nextNode: 9
            },
            2:{
                text: "2-12 weeks",
                nextNode: 10
            },
            3:{
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
    9: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "armAInitialrRTPCR"
    },
    10: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "zikaAndDengueIgMTests",
    },
    11: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "clinicalManagementOver12weeks",
    },
    12: {
        text: "How long ago was possible exposure (travel or unprotected sex)?",
        answers: {
            1: {
                text: "<2 weeks",
                nextNode: 9
            },
            2: {
                text: "2-12 weeks",
                nextNode: 13
            },
            3: {
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
        endpointName: "zikaIgMTest",
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
                text: "<2 weeks",
                nextNode: 9
            },
            2: {
                text: "2-12 weeks",
                nextNode: 10
            },
            3: {
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
        text: "Is the patient in her 1st or 2nd trimester?",
        answers: {
            1: {
                text: "Yes",
                nextNode: 13
            },
            2: {
                text: "No",
                nextNode: 20
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
    22: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "nextStepsReturned2to12WeeksLaterForZikaIgMTest"
    },
    23: {
        text: "Choose test performed:",
        answers: {
            1: {
                text: "Zika virus rRT-PCR on serum and urine",
                nextNode: 24
            },
            2: {
                text: "Zika virus IgM on serum",
                nextNode: 33
            },
            3:{
                text: "Zika virus IgM and dengue IgM on serum",
                nextNode: 39
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
        text: "What were the results of the Zika virus rRT-PCR on serum or urine?",
        answers: {
            1: {
                text: "Positive on either serum or urine",
                nextNode: 25
            },
            2: {
                text: "Negative on both serum AND urine",
                nextNode: 31
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
    31:{
        text: "Which of these best describes your patient?",
        answers:{
            1:{
                text: "Symptomatic and seeking care within 2 weeks of symptom onset",
                nextNode: 10
            },
            2:{
                text: "Asymptomatic and <strong>not</strong> living in an area with active Zika virus transmission",
                nextNode: 32
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
    32:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "igMTestReturn2to12Weeks"
    },
    33:{
        text: "What were the results of the IgM tests?",
        answers:{
            1:{
                text: "Zika IgM negative",
                nextNode: 34
            },
            2:{
                text: "Zika IgM positive or equivocal",
                nextNode: 35
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
    34:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "noEvidenceOfRecentZIKVInfection"
    },
    35:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "armBReflexrRTPCR"
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
    37 : {
        nodeType: NodeType.APP_INFO,
        endpointName: "embed"
    },
    38:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "prenatalClinicalManagementPresumptiveRecentZIKVInfectionOrFlavivirusNOS"
    },
    39:{
        text: "What were the results of the IgM tests?",
        answers: {
            1: {
                text: "Negative on both Zika IgM AND dengue IgM",
                nextNode: 34
            },
            2: {
                text: "Zika IgM positive or equivocal and any result on dengue IgM",
                nextNode: 35
            },
            3:{
                text: "Dengue IgM positive or equivocal and Zika IgM negative",
                nextNode: 40
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
    40:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "prnt"
    },
    41:{
        text: "Choose test performed:",
        answers: {
            1: {
                text: "Zika virus IgM or dengue virus IgM (after previous negative rRT-PCR result)",
                nextNode: 42
            },
            2: {
                text: "Zika virus rRT-PCR on serum and urine (after previous positive Zika IgM result)",
                nextNode: 43
            },
            3:{
                text: "Plaque reduction neutralization test (PRNT)",
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
    42:{
        text: "What were the results of the IgM tests?",
        answers: {
            1: {
                text: "Negative on both Zika IgM AND dengue IgM (if both were performed)",
                nextNode: 34
            },
            2: {
                text: "Zika IgM or dengue IgM positive or equivocal",
                nextNode: 26
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
    43:{
        text: "What were the results of the reflex rRT-PCR?",
        answers: {
            1: {
                text: "Negative Zika rRT-PCR",
                nextNode: 26
            },
            2: {
                text: "Positive Zika rRT-PCR on either serum or urine",
                nextNode: 25
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
    44:{
        text: "What were the results of the PRNT tests?",
        answers: {
            1: {
                text: "Zika virus PRNT >=10 AND dengue virus <10",
                nextNode: 25
            },
            2: {
                text: "Zika virus PRNT >= 10 AND dengue virus PRNT >= 10",
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
    }
}

