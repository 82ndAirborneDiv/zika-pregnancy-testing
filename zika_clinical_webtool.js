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
            questionText.append(nextQuestionObject.text);
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
                nextNode: '4a'
            },
            2: {
                text: "Information to understand how to interpret test results.",
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
    '4a': {
        text: "<div>Before you begin, ask your patient about travel or residence to any "
        +"<a target='_blank' href='https://wwwnc.cdc.gov/travel/page/zika-travel-information'>area with risk of Zika</a> and potential "
        +"sexual exposure, including <strong>before</strong> and <strong>during</strong> her current pregnancy. "
        +"Example questions are shown below:"
        +"<ul>"
        +"<li>Have you traveled during pregnancy?</li>"
        +"<li>Have you lived in any area with risk of Zika during your pregnancy?</li>"
        +"<li>Has your partner lived in or traveled to any area with risk of Zika during your pregnancy?</li>"
        +"<li>Did you live in any area with risk of Zika <i>before</i> you became pregnant?</li>"
        +"<li>Have you frequently traveled (for example, daily or weekly) to one of these areas <i>before</i> you became pregnant?</li>"
        +"</ul>"
        +"<br />"
        +"If your patient previously lived in or frequently traveled to an area with risk of Zika "
        +"virus, she may have been infected with Zika before pregnancy, and she may have already developed antibodies "
        +"against Zika virus. If she was infected before pregnancy, Zika antibody test results during pregnancy may not "
        +"tell you if she was infected in the past or if she was infected recently during her current pregnancy."
        +"<br /><br />"
        +"<strong>Action Needed:</strong> Ask pregnant women about possible exposure to Zika virus, both before and "
        +"during their current pregnancy, to help interpret Zika antibody test results and provide appropriate "
        +"counseling before and after testing. Counseling includes a discussion of the limitations of the tests and the "
        +"potential risks of misinterpretation of test results, including false positives and false negatives.</div>",
        answers: {
            0: {
                nextNode: 4
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
    4: {
        text: 'Does your pregnant patient currently live in an area with a '
        +'<a target="_blank" href="https://wwwnc.cdc.gov/travel/page/world-map-areas-with-zika">risk of Zika</a>?',
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
        text: "<div id='q5'>Has your pregnant patient previously lived in or traveled to any "
        +"<a href='https://wwwnc.cdc.gov/travel/page/world-map-areas-with-zika' target='_blank'>area with risk of Zika</a> "
        +"during this current pregnancy or periconceptional period*?"
        +"</div>",
        answers: {
            1:{
                text: 'Yes',
                nextNode: 15
            },
            2:{
                text: 'No',
                nextNode: 6
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        footnotes:{
            text: '<div>*Please note:'
            +'<ul>'
            +'<li>In some areas of the country, many people move fluidly and regularly between areas with and without '
            +'active Zika transmission to live, work, attend school, socialize, and seek medical care. Those who live '
            +'in areas without active Zika transmission may not regard these activities as "travel." This context '
            +'should be considered when asking women about travel history and potential exposure to Zika.</li>'
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
        text: "<div>Has your pregnant patient had sex (vaginal, anal, or oral sex) without a condom with a partner who "
        +"lives in or has traveled to "
        +"<a target='_blank' href='https://wwwnc.cdc.gov/travel/page/world-map-areas-with-zika'>an area with risk of Zika</a>?</div>",
        answers: {
            1: {
                text: 'Yes',
                nextNode: 7
            },
            2: {
                text: 'No',
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
                nextNode: '12a'
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
        endpointName: "node10"
    },
    11: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node11"
    },
    '12a': {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node12a"
    },
    12: {
        text: "How long ago was possible exposure (travel or unprotected sex)?",
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
    13: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node13"
    },
    14: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node14"
    },
    15: {
        text: "You indicated that your patient was exposed to a Zika affected area during her current pregnancy. "
        +"Was this a single trip?",
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
        text: "Has your patient already been tested during her current pregnancy?",
        answers: {
            1: {
                text: "Yes",
                nextNode: '19a'
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
    '19a': {
        text: "Did your patient receive a diagnosis of <strong><i>laboratory–confirmed</i></strong> Zika virus "
        +"infection during her pregnancy?",
        answers: {
            1: {
                text: "Yes",
                nextNode: '19b'
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
    '19b': {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node19b"
    },
    20: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node20"
    },
    23: {
        text: "Select results you have received",
        answers: {
            1: {
                text: "Zika virus NAT (Only ordered NAT testing; Not waiting on IgM)",
                nextNode: '23a'
            },
            2: {
                text: "Zika virus NAT (Still awaiting IgM results)",
                nextNode: 24
            },
            3:{
                text: "Zika virus NAT and Zika virus IgM",
                nextNode: '24a'
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
    '23a': {
        text: "What were the results of the Zika virus NAT on serum and urine?",
        answers: {
            1: {
                text: "Positive on both serum AND urine",
                nextNode: 51
            },
            2: {
                text: "Positive on either serum or urine",
                nextNode: '35a'
            },
            3: {
                text: "Negative on both serum AND urine",
                nextNode: '32a'
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
        answers: {
            1: {
                text: "Positive on both serum AND urine",
                nextNode: 51
            },
            2: {
                text: "Positive on either serum or urine",
                nextNode: 32
            },
            3: {
                text: "Negative on both serum AND urine",
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
    '24a': {
        text: "What were the results of the Zika virus NAT on serum or urine?",
        answers: {
            1: {
                text: "Positive on both serum AND urine",
                nextNode: 51
            },
            2: {
                text: "Positive on either serum or urine",
                nextNode: 33
            },
            3: {
                text: "Negative on both serum AND urine",
                nextNode: 33
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
        nodeType: NodeType.ENDPOINT,
        endpointName: "node25"
    },
    '25a': {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node25a"
    },
    26: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node26"
    },
    32:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "node32"
    },
    '32a':{
        nodeType: NodeType.ENDPOINT,
        endpointName: "node32a"
    },
    33: {
        text: "What were the results of the Zika IgM test?",
        answers:{
            1:{
                text: "Positive Zika NAT on either serum or urine specimen AND Positive Zika virus IgM",
                nextNode: 25
            },
            2:{
                text: "Positive Zika NAT on either serum or urine AND Negative Zika virus IgM",
                nextNode: 35
            },
            3:{
                text: "Negative Zika virus RNA NAT AND Zika IgM Positive (or equivocal)…",
                nextNode: 26
            },
            4:{
                text: "Negative Zika virus RNA NAT AND Negative Zika virus IgM",
                nextNode: 50
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
    35:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "node35"
    },
    '35a': {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node35a"
    },
    36: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node36"
    },
    37 : {
        nodeType: NodeType.APP_INFO,
        endpointName: "embed"
    },
    44:{
        text: "What were the results of the PRNT tests?",
        answers: {
            1: {
                text: "Zika virus PRNT ≥10 AND dengue virus <10",
                nextNode: '25a'
            },
            2: {
                text: "Zika virus PRNT ≥10 AND dengue virus PRNT ≥10",
                nextNode: 47
            },
            3:{
                text: "Zika virus PRNT <10",
                nextNode: 50
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
        endpointName: "node45"
    },
    46: {
        nodeType: NodeType.APP_INFO,
        endpointName: "node46"
    },
    47: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node47"
    },
    50: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node50"
    },
    51: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "node51"
    }
};

