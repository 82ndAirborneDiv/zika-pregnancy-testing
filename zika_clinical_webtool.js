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

var singleSelectListSurround = $("#singleSelectListDiv");
var singleSelectList = $("#singleSelectList");
var singleSelectLabel = $('#singleSelectLabel');
var multiSelectListSurround = $("#multiSelectListDiv");
var multiSelectList = $("#multiSelectList");
var multiSelectLabel = $('#multiSelectLabel');

//Nav buttons
var start = $("#start");
var back = $("#back");
var restart = $("#restart");
var nextButton = $("#next");

var debug = true;

/*array to store answers
Each index of nodeHistory stores a NodeHistory object
*/
var nodeHistory = [];

//NodeHistory stores the users activity: node and answer, if applicable
//for each node in the decision tree.
// The nodeName will correspond to an object in the list of nodes.
//Answers will be either a number, string, or array of strings
//for radio, singleSelect, or multiSelect types, respectively.
function NodeHistory(nodeName, answer){
    this.node = nodeName;
    this.answer = answer;
}

var currentQuestionNumber;

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
function getUserAnswerByIndex(number){
    var numUserAnswers = nodeHistory.length;
    if(numUserAnswers > 0 && number >= 0 && number < numUserAnswers) {
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
    }
}
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
//populate singleSelect list
var populateSingleSelectList = function(list) {
    var listHTML = "";
    listHTML += '<option></option>';
        $.each(list, function (key, value) {
            listHTML += '<option value=' + key + '>' + value.text + '</option>';
        });
    singleSelectList.html(listHTML);
}
//populate multiSelect list
var populateMultiSelectList = function(list) {
    var listHTML = "";
    $.each(list, function (key, value) {
       listHTML += '<label><input class="checkboxListItem" style="margin-left: 10px; margin-right: 10px"' +
            ' type="checkbox" name="option[]" value="' + key + '">' + value.text + '</label>';
    });
    multiSelectList.html(listHTML);
}
var populateRadioList = function(question){

}
function noSelectionAlert(){
    var alert = '<div id="noSelectionAlert" class="alert alert-warning fade in" role="alert">';
    alert += '<a href="#" class="close" id="close-alert" style="text-decoration: none;"data-dismiss="alert"' +
        ' role="button" aria-label="close">&times;</a>';
    alert += '<strong>Please make a selection.</strong>';
    alert += '</div>';
    alertArea.html(alert);

    //return focus to Next button when close alert button is clicked
    $('#noSelectionAlert').on('closed.bs.alert', function(){
        nextButton.focus();
    });

    //focus on close alert button when noSelectionAlert is displayed
    $('#close-alert').focus();
    resizeWidget();
}
function triggerRestart(){
    nodeHistory = [];
    clearMainPanel();
    introPanel.show().focus();
    mainPanel.hide();
    $('.panel-body').focus();

    $('.scrollable').animate({ scrollTop: 0 }, 0);
}
function loadQuestion(nextQuestionNumber){
    clearMainPanel();
    nextButton.show();
    questionContent.show();

    var nextQuestionObject = getNode(nextQuestionNumber);
    var nextQuestionText = nextQuestionObject.text;
    if(debug){
        nextQuestionText = "Node number: " +nextQuestionNumber;
        nextQuestionText += "<br />";
        nextQuestionText += nextQuestionObject.text;
    }
    var nextQuestionAnswers = nextQuestionObject.getValuesForAnswers();

    var previouslyVisited = false;
    var previousAnswerObject;
    if(nodeHistory.length > 0 && getPreviousNode().node === nextQuestionNumber){
        previouslyVisited = true;
        previousAnswerObject = getPreviousNode();
    }

    //Build question based on next question's answerType
    switch (nextQuestionObject.answerType){
        case AnswerType.NONE:
            if(previouslyVisited){
                nodeHistory.pop();
            }
            questionText.html('<strong>' +nextQuestionText +'</strong>');
            break;
        case AnswerType.SINGLESELECT:
            singleSelectListSurround.show();
            populateSingleSelectList(nextQuestionObject.getValuesForAnswers());
            if(previouslyVisited){
                singleSelectList.val(previousAnswerObject.answer).trigger("change");
                nodeHistory.pop();
            }
            singleSelectLabel.html(nextQuestionText);

            //clear alerts on country selected
            singleSelectList.change(function(){
                alertArea.html("");
            });
            break;
        case AnswerType.MULTISELECT:
            populateMultiSelectList(countries);
            if(previouslyVisited){
                multiSelectList.find("input:checkbox").each(function(){
                    var answerChecked = previousAnswerObject.answer.indexOf($(this).val());
                    $(this).prop('checked', answerChecked >= 0);
                });
                nodeHistory.pop();
            }
            multiSelectLabel.html(nextQuestionText);
            multiSelectList.multiselect();
            multiSelectListSurround.show();

            //clear alerts on checkbox checked
            $("input:checkbox").change(function(){
                alertArea.html("");
            });

            break;
        case AnswerType.RADIO:
            var radioButtonsHTML = '';
            radioButtonsHTML += '<div id="radio_label">' +nextQuestionText +'</div>';
            radioButtonsHTML += '<div role="radiogroup" aria-labelledby="' +"radio_label" +'">';

            $.each(nextQuestionAnswers, function (key, value) {
                radioButtonsHTML += '<div class="radio z-risk-rad">';
                radioButtonsHTML += '<label>';
                if (previouslyVisited && previousAnswerObject.answer === key) {
                    radioButtonsHTML += '<input type="radio" class="radioAnswer" name="optionsRadios" value="'
                        +"" +key + '" checked>';
                    nodeHistory.pop();
                    previouslyVisited = false;
                }
                else {
                    radioButtonsHTML += '<input type="radio" class="radioAnswer" name="optionsRadios" value="'
                        + key + '">';
                }
                radioButtonsHTML += value.text;
                radioButtonsHTML += '</label>';
                radioButtonsHTML += '</div>';
            });
            radioButtonsHTML += '</div>';
            questionAnswers.html(radioButtonsHTML).show();

            //clear alerts on radio selected
            $("input[name=optionsRadios]:radio").change(function(){
                alertArea.html("");
            });
            break;
    }

    $('.panel-body').focus();

    resizeWidget();
}

function loadEndPoint(number){
    clearMainPanel();
    //if previously visited, pop last entry
    if(nodeHistory.length > 0 && getPreviousNode().node === number){
        nodeHistory.pop();
    }
    cdcMetrics.trackEvent("Endpoint Reached", number);
    var nodeObject = getNode(number);

    if(debug){
        var nodeNumText = "Node number: " +number;
        endpointText.html("<div>" +nodeNumText +"</div>");
    }

    endpointText.append($('<div>').load("endpoints.html #" +nodeObject.endpointName));
    endpointDisclaimer.load("disclaimers.html #allResults")

    endpointContent.show();
    resizeWidget();
    $('.panel-body').focus();
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
            selection = singleSelectList.val();
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

    selectedAnswerObject = currentQuestionObject.decideChoice(currentQuestionNumber, selection);

    loadNode(selectedAnswerObject.nextNode);
}

function clearMainPanel(){
    //endpoint
    endpointText.html("");
    endpointAdditionalNotes.html("");
    endpointDisclaimer.html("");
    endpointContent.hide();

    //reset question area
    multiSelectList.animate({ scrollTop: 0 }, 0);
    questionText.html("");
    questionContent.hide();
    questionAnswers.html("");
    questionAnswers.hide();
    singleSelectList.html("");
    multiSelectList.html("");
    singleSelectListSurround.hide();
    multiSelectListSurround.hide();

    //Remove checked state and css from all checkboxes
    $("input:checkbox").prop("checked", false).parent().removeClass("multiselect-on");
    //Reset selection on single country list to null
    singleSelectList.val(null).trigger("change");

    //hide next button
    nextButton.hide();

    //reset alert area
    alertArea.html("");

    resizeWidget();
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
    ENDPOINT: "endpoint"
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
        //Specific logic for multi select nodes regarding potential Zika countries
        multiCountryCheckForZika : function(questionNumber, selections){
            var questionObject = getNode(questionNumber);
            var zika = false;
            for(var i = 0; i < selections.length; i++){
                if(getRiskForCountry(selections[i]) == RiskCategory.ZIKA){
                    zika = true;
                    break;
                }
            }
            if(zika){
                trackAnswer("Answer set included Zika country(ies)");
                return questionObject.answers["1"];
            }
            else{
                trackAnswer("Answer set did not include a Zika country");
                return questionObject.answers["2"];
            }
        },
        //Specific logic for single select nodes regarding potential Zika countries
        singleCountryCheckForZika : function(questionNumber, selection){
            var questionObject = getNode(questionNumber);
            trackAnswer(selection);

            //question 1 requires disclaimer for non-US countries
            if(currentQuestionNumber === "4" && selection === "US"){
                questionObject = getNode(4);
                return questionObject.answers["3"];
            }
            else{
                if (getRiskForCountry(selection) == RiskCategory.ZIKA) { //Zika country
                    return questionObject.answers["1"];
                }
                else { //non-Zika country
                    return questionObject.answers["2"];
                }
            }
        },
        //Specific logic for multi select nodes regarding potential Zika states
        multiStateCheckForZika : function(questionNumber, selections){
            var questionObject = getNode(questionNumber);
            var zika = false;
            for(var i = 0; i < selections.length; i++){
                if(getRiskForState(selections[i]) == RiskCategory.ZIKA){
                    zika = true;
                    break;
                }
            }
            if(zika){
                trackAnswer("Answer set included Zika state(s)");
                return questionObject.answers["1"];
            }
            else{
                trackAnswer("Answer set did not include a Zika state");
                return questionObject.answers["2"];
            }
        },
        //Specific logic for single select nodes regarding potential Zika countries
        singleStateCheckForZika : function(questionNumber, selection){
            var questionObject = getNode(questionNumber);
            trackAnswer(selection);

            //question 1 requires disclaimer for non-US countries
            if(currentQuestionNumber === "4" && selection === "US"){
                questionObject = getNode(4);
                return questionObject.answers["3"];
            }
            else{
                if (getRiskForState(selection) == RiskCategory.ZIKA) { //Zika country
                    return questionObject.answers["1"];
                }
                else { //non-Zika country
                    return questionObject.answers["2"];
                }
            }
        },
        //Generic logic for radio button answerType
        getRadioAnswer: function(questionNumber, selection){
            var questionObject = getNode(questionNumber);
            var answerObject = questionObject.answers["" +selection];
            trackAnswer(answerObject.text);
            return answerObject;
        },
        //disclaimer logic for country selections based on Zika risk
        disclaimerBasedOnCountryZikaRisk: function(userAnswer){
            var questionObject = getNode(userAnswer.node);
            var answerObject;
            switch(questionObject.answerType) {
                case AnswerType.MULTISELECT:
                    answerObject = nodes.decisionLogic
                        .multiCountryCheckForZika(userAnswer.question, userAnswer.answer);
                    break;
                case AnswerType.SINGLESELECT:
                    answerObject = nodes.decisionLogic
                        .singleCountryCheckForZika(userAnswer.question, userAnswer.answer);
                    break;
            }
            if (answerObject.hasOwnProperty("disclaimer")) {
                return answerObject.disclaimer;
            } else {
                return null;
            }
        },
        //additionalNotes logic for country selections based on Zika risk
        additionalNotesBasedOnCountryZikaRisk: function(userAnswer){
            var questionObject = getNode(userAnswer.node);
            var answerObject;
            switch(questionObject.answerType) {
                case AnswerType.MULTISELECT:
                    answerObject = nodes.decisionLogic
                        .multiCountryCheckForZika(userAnswer.question, userAnswer.answer);
                    break;
                case AnswerType.SINGLESELECT:
                    answerObject = nodes.decisionLogic
                        .singleCountryCheckForZika(userAnswer.question, userAnswer.answer);
                    break;
            }
            if (answerObject.hasOwnProperty("additionalNotes")) {
                return answerObject.additionalNotes;
            } else {
                return null;
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
            3:{
                text: "State health department official",
                nextNode: 2
            },
            4:{
                text: "Local health department official",
                nextNode: 2
            },
            5:{
                text: "Other",
                nextNode: 2
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function(){
            return this.answers;
        },
        getDisclaimer: function(input){
            return nodes.decisionLogic.disclaimerBasedOnCountryZikaRisk(input);
        }
    },
    2: {
        text: "<div>The User acknowledges and agrees that this tool will be used only as a reference aid, "
        +"and that the information contained in the product is not intended to be (nor should it be "
        +"used as) a substitute for the exercise of professional judgment.<br /><br />"
        +"In view of the possibility of human error or changes in medical science, the User should "
        +"confirm the information in the product conforms to the current version of the CDC "
        +"Updated Interim Guidance for Healthcare Providers Caring for Pregnant Women by "
        +"checking for <a target='_blank' href='http://www.cdc.gov/zika/hc-providers/pregnant-woman.html'>guidance</a> updates. This product is provided without warranties of any kind, "
        +"express or implied, and the authors disclaim any liability, loss, or damage caused by it or "
        +"its content.<br /><br />"
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
        decideChoice: function(){
            return this.answers["0"];
        }
    },
    3: {
        text: "To begin, please select what information you are looking for.",
        answers: {
            1: {
                text: "Your patient is initiating care and you need to decide if Zika virus testing is needed.",
                nextNode: 4
            },
            2: {
                text: "You recently received test results for your patient and you need to understand how to "
                +"interpret the results and manage clinical care.",
                nextNode: 22
            },
            3: {
                text: "Your patient already received a negative rRT-PCR result within 2 weeks of possible exposure "
                +"and has returned 2-12 weeks later for a Zika IgM test.",
                nextNode: 10
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function(){
            return this.answers;
        }
    },
    4: {
        text: "Where does your pregnant patient live?",
        answers: {
            1: {
                text: "Ongoing Exposure",
                nextNode: 17
            },
            2: {
                text: "No Ongoing Exposure",
                nextNode: 5
            },
            3: {
                text: "US",
                nextNode: 46
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.singleCountryCheckForZika(qNum, input);
        },
        getValuesForAnswers: function() {
            return countries;
        }
    },
    5: {
        text: "<div id='q5'>Has your pregnant patient traveled during pregancy or periconceptional "
        +"period? (Periconceptional period is defined as eight weeks before conception or six weeks "
        +"before last missed period).<br /> "
        +"</div>",
        answers: {
            1:{
                text: "Yes",
                nextNode: 48
            },
            2: {
                text: "No",
                nextNode: 6
            },
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    6: {
        text: "Has your pregnant patient had unprotected sexual activity (vaginal, anal, or oral sex, or shared "
        +"sex toys without a condom) with a partner who has traveled to or lives in an area with "
        +"active Zika virus transmission during her pregnancy or the periconceptional period "
        +"(eight weeks before conception or six weeks before last missed period)?",
        answers: {
            1: {
                text: "Yes",
                nextNode: 7
            },
            2: {
                text: "No",
                nextNode: 14
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        text: "Does your pregnant patient regularly travel to area?",
        answers: {
            1: {
                text: "Yes",
                nextNode: 16
            },
            2: {
                text: "No",
                nextNode: 12
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    16: {
        text: "How frequently do they travel to this area?",
        answers: {
            1: {
                text: "Daily or weekly.",
                nextNode: 17
            },
            2: {
                text: "Less frequently than weekly.",
                nextNode: 12
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input)
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        text: "Have you received results from the first test you ordered (initial result) or are you following " +
        "up on a subsequent test to confirm or rule out infection (follow-up result)?",
        answers: {
            1: {
                text: "Initial result",
                nextNode: 23
            },
            2: {
                text: "Follow-Up result",
                nextNode: 41
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function(){
            return this.answers;
        }
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
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    24: {
        text: "What were the results of the Zika virus rRT-PCR on serum or urine?",
        answers: {
            1: {
                text: "Positive on either serum or urine.",
                nextNode: 25
            },
            2: {
                text: "Negative on both serum AND urine.",
                nextNode: 31
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    25: {
        nodeType: NodeType.ENDPOINT,
        endpointName: "clinicalManagementRecentZikaInfection"
    },
    26: {
        text: "Is the patient still pregnant?",
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
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
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
                text: "Symptomatic and seeking care within 2 weeks of symptom onset.",
                nextNode: 10
            },
            2:{
                text: "Asymptomatic and not living in an area with active Zika virus transmission.",
                nextNode: 32
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.RADIO,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
                text: "Negative Zika IgM",
                nextNode: 34
            },
            2:{
                text: "Zika IgM positive or equivocal",
                nextNode: 35
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
    36:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "clinicalManagementPresumptiveRecentZikaVirusInfectionOrRecentFlavivirusInfectionNOS"
    },
    37:{
        text: "Is the patient still pregnant?",
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
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
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
                text: "dengue IgM positive or equivocal and Zika IgM negative",
                nextNode: 40
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
                text: "Zika virus rRT-PCR on serum and urine (after previous positive IgM result)",
                nextNode: 43
            },
            3:{
                text: "PRNT",
                nextNode: 44
            }

        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
                nextNode: 40
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
                nextNode: 40
            },
            2: {
                text: "Positive Zika rRT-PCR on either serum or urine",
                nextNode: 25
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
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
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.getRadioAnswer(qNum, input);
        },
        getValuesForAnswers: function() {
            return this.answers;
        }
    },
    45:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "IngridsPaper"
    },
    46:{
        text: "What state?",
        answers: {
            1: {
                text: "Zika area",
                nextNode: 17
            },
            2: {
                text: "Non-Zika area",
                nextNode: 5
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.SINGLESELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.singleStateCheckForZika(qNum, input);
        },
        getValuesForAnswers: function() {
            return states;
        }
    },
    47:{
        nodeType: NodeType.ENDPOINT,
        endpointName: "clinicalManagementRecentFlavivirusInfectionNOS"
    },
    48:{
        text: "Where has your patient traveled?",
        answers: {
            1: {
                text: "Zika area",
                nextNode: 15
            },
            2: {
                text: "Non-Zika area",
                nextNode: 6
            }
        },
        nodeType: NodeType.QUESTION,
        answerType: AnswerType.MULTISELECT,
        decideChoice: function(qNum, input){
            return nodes.decisionLogic.multiCountryCheckForZika(qNum, input);
        },
        getValuesForAnswers: function() {
            return countries;
        }
    }
}

var RiskCategory = {
    NONE : "none",
    ZIKA: "zika"
}

function getCountryById(name){
    return countries[name];
}
function getStateById(name){
    return states[name];
}


//Returns riskCategory of country
function getRiskForCountry(country){
    return getCountryById(country).riskCategory;
}

function getRiskForState(state){
    return getStateById(state).riskCategory;
}
function getCountriesByRiskCategory(riskCategory){
    var numCountries = Object.keys(countries).length;
    var matchingCountries = {};
    var currentCountry;
    for(var i = 0; i < numCountries; i++){
        currentCountry = countries[Object.keys(countries)[i]];
        if(currentCountry.riskCategory === riskCategory){
            matchingCountries[Object.keys(countries)[i]] = currentCountry;
        }
    }
    return matchingCountries;
}
/*
 Countries object was built from the State Dept list of countries. Countries/Territories listed on
 the active Zika countries page that were missing from the State Dept list were added.
 */
var countries = {
    'US': {
        text: "United States (USA)",
        riskCategory: RiskCategory.NONE
    },
    'AF': {
        text: "Afghanistan",
        riskCategory: RiskCategory.NONE
    },
    'AL': {
        text: "Albania",
        riskCategory: RiskCategory.NONE
    },
    'DZ': {
        text: "Algeria",
        riskCategory: RiskCategory.NONE
    },
    'AS': {
        text: "American Samoa",
        riskCategory: RiskCategory.ZIKA
    },
    'AD': {
        text: "Andorra",
        riskCategory: RiskCategory.NONE
    },
    'AO': {
        text: "Angola",
        riskCategory: RiskCategory.NONE
    },
    'AI': {
        text: "Anguilla",
        riskCategory: RiskCategory.ZIKA
    },
    'AG': {
        text: "Antigua and Barbuda",
        riskCategory: RiskCategory.ZIKA
    },
    'AR': {
        text: "Argentina",
        riskCategory: RiskCategory.ZIKA
    },
    'AM': {
        text: "Armenia",
        riskCategory: RiskCategory.NONE
    },
    'AW': {
        text: "Aruba",
        riskCategory: RiskCategory.ZIKA
    },
    'AU': {
        text: "Australia",
        riskCategory: RiskCategory.NONE
    },
    'AT': {
        text: "Austria",
        riskCategory: RiskCategory.NONE
    },
    'AZ': {
        text: "Azerbaijan",
        riskCategory: RiskCategory.NONE
    },
    'BS': {
        text: "Bahamas, The",
        riskCategory: RiskCategory.ZIKA
    },
    'BH': {
        text: "Bahrain",
        riskCategory: RiskCategory.NONE
    },
    'BD': {
        text: "Bangladesh",
        riskCategory: RiskCategory.NONE
    },
    'BB': {
        text: "Barbados",
        riskCategory: RiskCategory.ZIKA
    },
    'BY': {
        text: "Belarus",
        riskCategory: RiskCategory.NONE
    },
    'BE': {
        text: "Belgium",
        riskCategory: RiskCategory.NONE
    },
    'BZ': {
        text: "Belize",
        riskCategory: RiskCategory.ZIKA
    },
    'BJ': {
        text: "Benin",
        riskCategory: RiskCategory.NONE
    },
    'BT': {
        text: "Bhutan",
        riskCategory: RiskCategory.NONE
    },
    'BO': {
        text: "Bolivia",
        riskCategory: RiskCategory.ZIKA
    },
    'BQ': {
        text: "Bonaire",
        riskCategory: RiskCategory.ZIKA
    },
    'BA': {
        text: "Bosnia and Herzegovina",
        riskCategory: RiskCategory.NONE
    },
    'BW': {
        text: "Botswana",
        riskCategory: RiskCategory.NONE
    },
    'BR': {
        text: "Brazil",
        riskCategory: RiskCategory.ZIKA
    },
    'VG' : {
        text: "British Virgin Islands",
        riskCategory: RiskCategory.ZIKA
    },
    'BN': {
        text: "Brunei",
        riskCategory: RiskCategory.NONE
    },
    'BG': {
        text: "Bulgaria",
        riskCategory: RiskCategory.NONE
    },
    'BF': {
        text: "Burkina Faso",
        riskCategory: RiskCategory.NONE
    },
    'MM': {
        text: "Burma",
        riskCategory: RiskCategory.NONE
    },
    'BI': {
        text: "Burundi",
        riskCategory: RiskCategory.NONE
    },
    'KH': {
        text: "Cambodia",
        riskCategory: RiskCategory.NONE
    },
    'CM': {
        text: "Cameroon",
        riskCategory: RiskCategory.NONE
    },
    'CA': {
        text: "Canada",
        riskCategory: RiskCategory.NONE
    },
    'CV': {
        text: "Cape Verde",
        riskCategory: RiskCategory.ZIKA
    },
    'KY' :{
        text: "Cayman Islands",
        riskCategory: RiskCategory.ZIKA
    },
    'CF': {
        text: "Central African Republic",
        riskCategory: RiskCategory.NONE
    },
    'TD': {
        text: "Chad",
        riskCategory: RiskCategory.NONE
    },
    'CL': {
        text: "Chile",
        riskCategory: RiskCategory.NONE
    },
    'CN': {
        text: "China",
        riskCategory: RiskCategory.NONE
    },
    'CO': {
        text: "Colombia",
        riskCategory: RiskCategory.ZIKA
    },
    'PR': {
        text: "Commonwealth of Puerto Rico",
        riskCategory: RiskCategory.ZIKA
    },
    'CD': {
        text: "Congo, Democratic Republic of the",
        riskCategory: RiskCategory.NONE
    },
    'CG': {
        text: "Congo, Republic of the",
        riskCategory: RiskCategory.NONE
    },
    'CR': {
        text: "Costa Rica",
        riskCategory: RiskCategory.ZIKA
    },
    'CI': {
        text: "Cote d'Ivoire",
        riskCategory: RiskCategory.ZIKA
    },
    'HR': {
        text: "Croatia",
        riskCategory: RiskCategory.NONE
    },
    'CU': {
        text: "Cuba",
        riskCategory: RiskCategory.ZIKA
    },
    'CW': {
        text: "Curacao",
        riskCategory: RiskCategory.ZIKA
    },
    'CY': {
        text: "Cyprus",
        riskCategory: RiskCategory.NONE
    },
    'CZ': {
        text: "Czech Republic",
        riskCategory: RiskCategory.NONE
    },
    'DK': {
        text: "Denmark",
        riskCategory: RiskCategory.NONE
    },
    'DJ': {
        text: "Djibouti",
        riskCategory: RiskCategory.NONE
    },
    'DM': {
        text: "Dominica",
        riskCategory: RiskCategory.ZIKA
    },
    'DO': {
        text: "Dominican Republic",
        riskCategory: RiskCategory.ZIKA
    },
    'EC': {
        text: "Ecuador",
        riskCategory: RiskCategory.ZIKA
    },
    'EG': {
        text: "Egypt",
        riskCategory: RiskCategory.NONE
    },
    'SV': {
        text: "El Salvador",
        riskCategory: RiskCategory.ZIKA
    },
    'GQ': {
        text: "Equatorial Guinea",
        riskCategory: RiskCategory.NONE
    },
    'ER': {
        text: "Eritrea",
        riskCategory: RiskCategory.NONE
    },
    'EE': {
        text: "Estonia",
        riskCategory: RiskCategory.NONE
    },
    'ET': {
        text: "Ethiopia",
        riskCategory: RiskCategory.NONE
    },
    'FJ': {
        text: "Fiji",
        riskCategory: RiskCategory.ZIKA
    },
    'FI': {
        text: "Finland",
        riskCategory: RiskCategory.NONE
    },
    'FR': {
        text: "France",
        riskCategory: RiskCategory.NONE
    },
    'GF': {
        text: "French Guiana",
        riskCategory: RiskCategory.ZIKA
    },
    'GA': {
        text: "Gabon",
        riskCategory: RiskCategory.NONE
    },
    'GM': {
        text: "Gambia, The",
        riskCategory: RiskCategory.NONE
    },
    'GE': {
        text: "Georgia",
        riskCategory: RiskCategory.NONE
    },
    'DE': {
        text: "Germany",
        riskCategory: RiskCategory.NONE
    },
    'GH': {
        text: "Ghana",
        riskCategory: RiskCategory.NONE
    },
    'GR': {
        text: "Greece",
        riskCategory: RiskCategory.NONE
    },
    'GD': {
        text: "Grenada",
        riskCategory: RiskCategory.ZIKA
    },
    'GP': {
        text: "Guadeloupe",
        riskCategory: RiskCategory.ZIKA
    },
    'GT': {
        text: "Guatemala",
        riskCategory: RiskCategory.ZIKA
    },
    'GN': {
        text: "Guinea",
        riskCategory: RiskCategory.NONE
    },
    'GW': {
        text: "Guinea-Bissau",
        riskCategory: RiskCategory.NONE
    },
    'GY': {
        text: "Guyana",
        riskCategory: RiskCategory.ZIKA
    },
    'HT': {
        text: "Haiti",
        riskCategory: RiskCategory.ZIKA
    },
    'VA': {
        text: "Holy See",
        riskCategory: RiskCategory.NONE
    },
    'HN': {
        text: "Honduras",
        riskCategory: RiskCategory.ZIKA
    },
    'HK': {
        text: "Hong Kong",
        riskCategory: RiskCategory.NONE
    },
    'HU': {
        text: "Hungary",
        riskCategory: RiskCategory.NONE
    },
    'IS': {
        text: "Iceland",
        riskCategory: RiskCategory.NONE
    },
    'IN': {
        text: "India",
        riskCategory: RiskCategory.NONE
    },
    'ID': {
        text: "Indonesia",
        riskCategory: RiskCategory.NONE
    },
    'IR': {
        text: "Iran",
        riskCategory: RiskCategory.NONE
    },
    'IQ': {
        text: "Iraq",
        riskCategory: RiskCategory.NONE
    },
    'IE': {
        text: "Ireland",
        riskCategory: RiskCategory.NONE
    },
    'IL': {
        text: "Israel",
        riskCategory: RiskCategory.NONE
    },
    'IT': {
        text: "Italy",
        riskCategory: RiskCategory.NONE
    },
    'JM': {
        text: "Jamaica",
        riskCategory: RiskCategory.ZIKA
    },
    'JP': {
        text: "Japan",
        riskCategory: RiskCategory.NONE
    },
    'JO': {
        text: "Jordan",
        riskCategory: RiskCategory.NONE
    },
    'KZ': {
        text: "Kazakhstan",
        riskCategory: RiskCategory.NONE
    },
    'KE': {
        text: "Kenya",
        riskCategory: RiskCategory.NONE
    },
    'KI': {
        text: "Kiribati",
        riskCategory: RiskCategory.NONE
    },
    'FM': {
        text: "Kosrae, Federated States of Micronesia",
        riskCategory: RiskCategory.ZIKA
    },
    'XK': {
        text: "Kosovo",
        riskCategory: RiskCategory.NONE
    },
    'KW': {
        text: "Kuwait",
        riskCategory: RiskCategory.NONE
    },
    'KG': {
        text: "Kyrgyzstan",
        riskCategory: RiskCategory.NONE
    },
    'LA': {
        text: "Laos",
        riskCategory: RiskCategory.NONE
    },
    'LV': {
        text: "Latvia",
        riskCategory: RiskCategory.NONE
    },
    'LB': {
        text: "Lebanon",
        riskCategory: RiskCategory.NONE
    },
    'LS': {
        text: "Lesotho",
        riskCategory: RiskCategory.NONE
    },
    'LR': {
        text: "Liberia",
        riskCategory: RiskCategory.NONE
    },
    'LY': {
        text: "Libya",
        riskCategory: RiskCategory.NONE
    },
    'LI': {
        text: "Liechtenstein",
        riskCategory: RiskCategory.NONE
    },
    'LT': {
        text: "Lithuania",
        riskCategory: RiskCategory.NONE
    },
    'LU': {
        text: "Luxembourg",
        riskCategory: RiskCategory.NONE
    },
    'MO': {
        text: "Macau",
        riskCategory: RiskCategory.NONE
    },
    'MK': {
        text: "Macedonia",
        riskCategory: RiskCategory.NONE
    },
    'MG': {
        text: "Madagascar",
        riskCategory: RiskCategory.NONE
    },
    'MW': {
        text: "Malawi",
        riskCategory: RiskCategory.NONE
    },
    'MY': {
        text: "Malaysia",
        riskCategory: RiskCategory.NONE
    },
    'MV': {
        text: "Maldives",
        riskCategory: RiskCategory.NONE
    },
    'ML': {
        text: "Mali",
        riskCategory: RiskCategory.NONE
    },
    'MT': {
        text: "Malta",
        riskCategory: RiskCategory.NONE
    },
    'MH': {
        text: "Marshall Islands",
        riskCategory: RiskCategory.ZIKA
    },
    'MQ': {
        text: "Martinique",
        riskCategory: RiskCategory.ZIKA
    },
    'MR': {
        text: "Mauritania",
        riskCategory: RiskCategory.NONE
    },
    'MU': {
        text: "Mauritius",
        riskCategory: RiskCategory.NONE
    },
    'MX': {
        text: "Mexico",
        riskCategory: RiskCategory.ZIKA
    },
    'MD': {
        text: "Moldova",
        riskCategory: RiskCategory.NONE
    },
    'MC': {
        text: "Monaco",
        riskCategory: RiskCategory.NONE
    },
    'MN': {
        text: "Mongolia",
        riskCategory: RiskCategory.NONE
    },
    'ME': {
        text: "Montenegro",
        riskCategory: RiskCategory.NONE
    },
    'MA': {
        text: "Morocco",
        riskCategory: RiskCategory.NONE
    },
    'MZ': {
        text: "Mozambique",
        riskCategory: RiskCategory.NONE
    },
    'MA': {
        text: "Namibia",
        riskCategory: RiskCategory.NONE
    },
    'NR': {
        text: "Nauru",
        riskCategory: RiskCategory.NONE
    },
    'NP': {
        text: "Nepal",
        riskCategory: RiskCategory.NONE
    },
    'NL': {
        text: "Netherlands",
        riskCategory: RiskCategory.NONE
    },
    'AN': {
        text: "Netherlands Antilles",
        riskCategory: RiskCategory.NONE
    },
    'NC': {
        text: "New Caledonia",
        riskCategory: RiskCategory.ZIKA
    },
    'NZ': {
        text: "New Zealand",
        riskCategory: RiskCategory.NONE
    },
    'NI': {
        text: "Nicaragua",
        riskCategory: RiskCategory.ZIKA
    },
    'NE': {
        text: "Niger",
        riskCategory: RiskCategory.NONE
    },
    'NG': {
        text: "Nigeria",
        riskCategory: RiskCategory.NONE
    },
    'KP': {
        text: "North Korea",
        riskCategory: RiskCategory.NONE
    },
    'NO': {
        text: "Norway",
        riskCategory: RiskCategory.NONE
    },
    'OM': {
        text: "Oman",
        riskCategory: RiskCategory.NONE
    },
    'PK': {
        text: "Pakistan",
        riskCategory: RiskCategory.NONE
    },
    'PW': {
        text: "Palau",
        riskCategory: RiskCategory.NONE
    },
    'PS': {
        text: "Palestinian Territories",
        riskCategory: RiskCategory.NONE
    },
    'PA': {
        text: "Panama",
        riskCategory: RiskCategory.ZIKA
    },
    'PG': {
        text: "Papua New Guinea",
        riskCategory: RiskCategory.ZIKA
    },
    'PY': {
        text: "Paraguay",
        riskCategory: RiskCategory.ZIKA
    },
    'PE': {
        text: "Peru",
        riskCategory: RiskCategory.ZIKA
    },
    'PH': {
        text: "Philippines",
        riskCategory: RiskCategory.NONE
    },
    'PL': {
        text: "Poland",
        riskCategory: RiskCategory.NONE
    },
    'PT': {
        text: "Portugal",
        riskCategory: RiskCategory.NONE
    },
    'QA': {
        text: "Qatar",
        riskCategory: RiskCategory.NONE
    },
    'RO': {
        text: "Romania",
        riskCategory: RiskCategory.NONE
    },
    'RU': {
        text: "Russia",
        riskCategory: RiskCategory.NONE
    },
    'RW': {
        text: "Rwanda",
        riskCategory: RiskCategory.NONE
    },
    'BQ': {
        text: "Saba",
        riskCategory: RiskCategory.ZIKA
    },
    'BL': {
        text: "Saint Barthelemy",
        riskCategory: RiskCategory.ZIKA
    },
    'KN': {
        text: "Saint Kitts and Nevis",
        riskCategory: RiskCategory.ZIKA
    },
    'LC': {
        text: "Saint Lucia",
        riskCategory: RiskCategory.ZIKA
    },
    'MF': {
        text: "Saint Martin",
        riskCategory: RiskCategory.ZIKA
    },
    'VC': {
        text: "Saint Vincent and the Grenadines",
        riskCategory: RiskCategory.ZIKA
    },
    'WS': {
        text: "Samoa",
        riskCategory: RiskCategory.ZIKA
    },
    'SM': {
        text: "San Marino",
        riskCategory: RiskCategory.NONE
    },
    'ST': {
        text: "Sao Tome and Principe",
        riskCategory: RiskCategory.NONE
    },
    'SA': {
        text: "Saudi Arabia",
        riskCategory: RiskCategory.NONE
    },
    'SN': {
        text: "Senegal",
        riskCategory: RiskCategory.NONE
    },
    'RS': {
        text: "Serbia",
        riskCategory: RiskCategory.NONE
    },
    'SC': {
        text: "Seychelles",
        riskCategory: RiskCategory.NONE
    },
    'SL': {
        text: "Sierra Leone",
        riskCategory: RiskCategory.NONE
    },
    'SG': {
        text: "Singapore",
        riskCategory: RiskCategory.ZIKA
    },
    'BQ': {
        text: "Sint Eustatius",
        riskCategory: RiskCategory.ZIKA
    },
    'SX': {
        text: "Sint Maarten",
        riskCategory: RiskCategory.ZIKA
    },
    'SK': {
        text: "Slovakia",
        riskCategory: RiskCategory.NONE
    },
    'SI': {
        text: "Slovenia",
        riskCategory: RiskCategory.NONE
    },
    'SB': {
        text: "Solomon Islands",
        riskCategory: RiskCategory.NONE
    },
    'SO': {
        text: "Somalia",
        riskCategory: RiskCategory.NONE
    },
    'ZA': {
        text: "South Africa",
        riskCategory: RiskCategory.NONE
    },
    'KR': {
        text: "South Korea",
        riskCategory: RiskCategory.NONE
    },
    'SS': {
        text: "South Sudan",
        riskCategory: RiskCategory.NONE
    },
    'ES': {
        text: "Spain",
        riskCategory: RiskCategory.NONE
    },
    'LK': {
        text: "Sri Lanka",
        riskCategory: RiskCategory.NONE
    },
    'SD': {
        text: "Sudan",
        riskCategory: RiskCategory.NONE
    },
    'SR': {
        text: "Suriname",
        riskCategory: RiskCategory.ZIKA
    },
    'SZ': {
        text: "Swaziland",
        riskCategory: RiskCategory.NONE
    },
    'SE': {
        text: "Sweden",
        riskCategory: RiskCategory.NONE
    },
    'CH': {
        text: "Switzerland",
        riskCategory: RiskCategory.NONE
    },
    'SY': {
        text: "Syria",
        riskCategory: RiskCategory.NONE
    },
    'TW': {
        text: "Taiwan",
        riskCategory: RiskCategory.NONE
    },
    'TJ': {
        text: "Tajikistan",
        riskCategory: RiskCategory.NONE
    },
    'TZ': {
        text: "Tanzania",
        riskCategory: RiskCategory.NONE
    },
    'TH': {
        text: "Thailand",
        riskCategory: RiskCategory.NONE
    },
    'TL': {
        text: "Timor-Leste",
        riskCategory: RiskCategory.NONE
    },
    'TG': {
        text: "Togo",
        riskCategory: RiskCategory.NONE
    },
    'TO': {
        text: "Tonga",
        riskCategory: RiskCategory.ZIKA
    },
    'TT': {
        text: "Trinidad and Tobago",
        riskCategory: RiskCategory.ZIKA
    },
    'TN': {
        text: "Tunisia",
        riskCategory: RiskCategory.NONE
    },
    'TR': {
        text: "Turkey",
        riskCategory: RiskCategory.NONE
    },
    'TM': {
        text: "Turkmenistan",
        riskCategory: RiskCategory.NONE
    },
    'TC' : {
        text: "Turks and Caicos",
        riskCategory: RiskCategory.ZIKA
    },
    'TV': {
        text: "Tuvalu",
        riskCategory: RiskCategory.NONE
    },
    'VI': {
        text: "U.S. Virgin Islands",
        riskCategory: RiskCategory.ZIKA
    },
    'UG': {
        text: "Uganda",
        riskCategory: RiskCategory.NONE
    },
    'UA': {
        text: "Ukraine",
        riskCategory: RiskCategory.NONE
    },
    'AE': {
        text: "United Arab Emirates (UAE)",
        riskCategory: RiskCategory.NONE
    },
    'GB': {
        text: "United Kingdom (UK)",
        riskCategory: RiskCategory.NONE
    },
    'UY': {
        text: "Uruguay",
        riskCategory: RiskCategory.NONE
    },
    'UZ': {
        text: "Uzbekistan",
        riskCategory: RiskCategory.NONE
    },
    'VU': {
        text: "Vanuatu",
        riskCategory: RiskCategory.NONE
    },
    'VE': {
        text: "Venezuela",
        riskCategory: RiskCategory.ZIKA
    },
    'VN': {
        text: "Vietnam",
        riskCategory: RiskCategory.NONE
    },
    'YE': {
        text: "Yemen",
        riskCategory: RiskCategory.NONE
    },
    'ZM': {
        text: "Zambia",
        riskCategory: RiskCategory.NONE
    },
    'ZW': {
        text: "Zimbabwe",
        riskCategory: RiskCategory.NONE
    }
}

var states = {
    'AL':{
        text: "Alabama",
        riskCategory: RiskCategory.NONE
    },
    'AK':{
        text: "Alaska",
        riskCategory: RiskCategory.NONE
    },
    'AZ':{
        text: "Arizona",
        riskCategory: RiskCategory.NONE
    },
    'AR':{
        text: "Arkansas",
        riskCategory: RiskCategory.NONE
    },
    'CA':{
        text: "California",
        riskCategory: RiskCategory.NONE
    },
    'CO':{
        text: "Colorado",
        riskCategory: RiskCategory.NONE
    },
    'CT':{
        text: "Connecticut",
        riskCategory: RiskCategory.NONE
    },
    'DE':{
        text: "Delaware",
        riskCategory: RiskCategory.NONE
    },
    'FL':{
        text: "Florida",
        riskCategory: RiskCategory.ZIKA
    },
    'GA':{
        text: "Georgia",
        riskCategory: RiskCategory.NONE
    },
    'HI':{
        text: "Hawaii",
        riskCategory: RiskCategory.NONE
    },
    'ID':{
        text: "Idaho",
        riskCategory: RiskCategory.NONE
    },
    'IL':{
        text: "Illinois",
        riskCategory: RiskCategory.NONE
    },
    'IN':{
        text: "Indiana",
        riskCategory: RiskCategory.NONE
    },
    'IA':{
        text: "Iowa",
        riskCategory: RiskCategory.NONE
    },
    'KS':{
        text: "Kansas",
        riskCategory: RiskCategory.NONE
    },
    'KY':{
        text: "Kentucky",
        riskCategory: RiskCategory.NONE
    },
    'LA':{
        text: "Louisiana",
        riskCategory: RiskCategory.NONE
    },
    'ME':{
        text: "Maine",
        riskCategory: RiskCategory.NONE
    },
    'MD':{
        text: "Maryland",
        riskCategory: RiskCategory.NONE
    },
    'MA':{
        text: "Massachusetts",
        riskCategory: RiskCategory.NONE
    },
    'MI':{
        text: "Michigan",
        riskCategory: RiskCategory.NONE
    },
    'MN':{
        text: "Minnesota",
        riskCategory: RiskCategory.NONE
    },
    'MS':{
        text: "Mississippi",
        riskCategory: RiskCategory.NONE
    },
    'MO':{
        text: "Missouri",
        riskCategory: RiskCategory.NONE
    },
    'MT':{
        text: "Montana",
        riskCategory: RiskCategory.NONE
    },
    'NE':{
        text: "Nebraska",
        riskCategory: RiskCategory.NONE
    },
    'NV':{
        text: "Nevada",
        riskCategory: RiskCategory.NONE
    },
    'NH':{
        text: "New Hampshire",
        riskCategory: RiskCategory.NONE
    },
    'NJ':{
        text: "New Jersey",
        riskCategory: RiskCategory.NONE
    },
    'NM':{
        text: "New Mexico",
        riskCategory: RiskCategory.NONE
    },
    'NY':{
        text: "New York",
        riskCategory: RiskCategory.NONE
    },
    'NC':{
        text: "North Carolina",
        riskCategory: RiskCategory.NONE
    },
    'ND':{
        text: "North Dakota",
        riskCategory: RiskCategory.NONE
    },
    'OH':{
        text: "Ohio",
        riskCategory: RiskCategory.NONE
    },
    'OK':{
        text: "Oklahoma",
        riskCategory: RiskCategory.NONE
    },
    'OR':{
        text: "Oregon",
        riskCategory: RiskCategory.NONE
    },
    'PA':{
        text: "Pennsylvania",
        riskCategory: RiskCategory.NONE
    },
    'RI':{
        text: "Rhode Island",
        riskCategory: RiskCategory.NONE
    },
    'SC':{
        text: "South Carolina",
        riskCategory: RiskCategory.NONE
    },
    'SD':{
        text: "South Dakota",
        riskCategory: RiskCategory.NONE
    },
    'TN':{
        text: "Tennessee",
        riskCategory: RiskCategory.NONE
    },
    'TX':{
        text: "Texas",
        riskCategory: RiskCategory.NONE
    },
    'UT':{
        text: "Utah",
        riskCategory: RiskCategory.NONE
    },
    'VT':{
        text: "Vermont",
        riskCategory: RiskCategory.NONE
    },
    'VA':{
        text: "Virginia",
        riskCategory: RiskCategory.NONE
    },
    'WA':{
        text: "Washington",
        riskCategory: RiskCategory.NONE
    },
    'WV':{
        text: "West Virginia",
        riskCategory: RiskCategory.NONE
    },
    'WI':{
        text: "Wisconsin",
        riskCategory: RiskCategory.NONE
    },
    'WY':{
        text: "Wyoming",
        riskCategory: RiskCategory.NONE
    }
}