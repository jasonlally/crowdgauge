/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:52 PM
 */
(function () { // self-invoking function
    SAS.Instructions = function () {
        var _self = this;

        //region private fields and methods
        //var _ashxPath = "http://localhost:59159/ashx/";
        var _ashxPath = "http://ws.sasakistrategies.com/ashx/regionalScoresService/";
        var _showAgainFn = null;
        var _initialize = function() {
            $("#reshowInstr").click(function () {
                if (_showAgainFn != null) _showAgainFn();
            });
        };

        var _showAgainButtonVisible = function (show) {
            $("#reshowInstr").toggle(show);
        };

        var _showModalInstructionDialog = function (html, title) {

        };

        var _showInstructionDialog = function (html, opts, buttonLabel, buttonFn) {
            if(typeof(opts) == 'object') {
                var title = opts.title;
                var name = opts.name;
            }  else {
                var name = 'instructions';
            }
            var wrapper = $("<div data-localize='instructions.descriptions." + name + "'/>").html(html);
            $("#dialog").html(wrapper);
            _showInstructionDialog2(600, opts, buttonLabel, buttonFn);
        };

        var _showInstructionDialog2 = function (w, opts, buttonLabel, buttonFn) {
            _showAgainButtonVisible(false);
            if(typeof(opts) == 'object') {
                var title = opts.title;
                var name = opts.name;
            }
            if (!w) w = 600;
            if (!title) title = 'Instructions';
            if (!buttonLabel) buttonLabel ='Ok';

            var btns = {};
            btns[buttonLabel] = function () {
                if (buttonFn) buttonFn();
                _closeDialog();
            };
            $("#dialog").dialog({
                modal:true,
                title:title,
                buttons:btns,
                width:w,
                height:'auto',
                minWidth:400,
                position:'center',
                dialogClass:''
            });
            $('#ui-dialog-title-dialog').attr('data-localize','instructions.titles.' + name);
            SAS.localizr.setActiveLang();
        };

        var _closeDialog = function () {
            $("#dialog").dialog("close");
            _showAgainButtonVisible(_showAgainFn != null);
        };

        var _printImage = function (url) {
            var mywindow = window.open('', '_blank', 'height=800,width=800');
            mywindow.document.write('<html><head><title>CrowdGauge</title>');
            /*optional stylesheet*/ //mywindow.document.write('<link rel="stylesheet" href="main.css" type="text/css" />');
            mywindow.document.write('</head><body >');
            mywindow.document.write('<img src="' + url + '" width="1000" height="1000">');
            mywindow.document.write('</body></html>');
            mywindow.document.close();
            mywindow.print();
            return true;
        };

        var _validateEmail = function (x) {
            var atpos = x.indexOf("@");
            var dotpos = x.lastIndexOf(".");
            if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= x.length) {
                alert("Not a valid e-mail address");
                return false;
            }
            return true;
        };

        var _showEmailFields = function (sel, bubbleStr, entryId) {
            $(sel).html("");
            var form = $('<form method="get" action="' + _ashxPath + "EmailBubbleChart.ashx" + '">').appendTo(sel);
            form.css("font-size", "0.85em");
            var emailTb = $('<input type="text" size="30" name="email">').appendTo($('<label>To:</label>').appendTo(form));
            var emailTbFrom = $('<label>From:<input type="text" size="30" name="from"></label>').appendTo(form);
            var messageTb = $('<input type="text" size="50" name="message">').appendTo($('<label>Message:</label>').appendTo(form));
            $('<input type="hidden" name="img" value="'+bubbleStr+'">').appendTo(form);
            $('<input type="hidden" name="entry_id" value="'+entryId+'">').appendTo(form);
            var emailBtn = $('<input type="submit" value="Send">').appendTo(form);
            messageTb.val("I created my priority chart on CrowdGauge.");
            messageTb.css("font-size", "0.85em");
            $('<input type="button" name="cancel" value="Cancel" />').appendTo(form).click(function () {
                $(sel).slideUp(400);
                return false;
            });
            form.submit(function(event) {
                if (_validateEmail(emailTb.val())) {
                    $(sel).slideUp(400);
                    return true;
                }
                return false;
            });
            $(sel).show(400);
        };
        //endregion

        //region public API
        this.showInstructionDialog = function (html) {
            _showInstructionDialog(html);
        };

        this.showIntroDialog = function() {
            _showAgainFn = null;
            var txt = "<p>Welcome to the planokc CrowdGauge Survey! This exercise is designed to get your feedback on " +
                "possible policies for planokc and show how actions and investments related to those policies impact your priorities for Oklahoma City’s future.</p>";
            txt += "<p>Your results will be used to help create the City’s new comprehensive plan, planokc. You can learn more by visiting <a href='http://www.planokc.org' target='_blank'>planokc.org</a></p>";
            _showInstructionDialog(txt, {name: 'intro'}, "Get Started", function() {
                SAS.mainInstance.preventAccidentalLeaving();
            });
            $(".ui-button").focus();
        };

        this.showStarsDialog = function (numStars) {
            _showAgainFn = function() {
                _self.showStarsDialog(numStars);
            };
            var txt = "<p>Below is a list of priorities that impact a community’s quality of life. You can rate these priorities by assigning each zero to five stars, based on how important that priority is to you. You can allocate <span style='text-decoration:underline'>up to</span> " + numStars + " stars.</p>";
            txt += "<p>Watch the priority symbols on the right change as you rate your priorities.</p>";
            _showInstructionDialog(txt, {name: 'priorities'});
        };

        this.showMechanismInstructions = function (mechanisms, priorities, bubblechart, topScorer) {
            _showAgainFn = function() {
                _self.showMechanismInstructions(mechanisms, priorities, bubblechart, topScorer);
            };
            $("#dialog").html("");
            var txtAbove = $("<div></div>").appendTo("#dialog");
            $("<p><b>Click on any action on the left</b> and then <b>click on any of the priority bubbles on the right</b> to open up an explanation of how the project or policy might affect your priorities.</p>").appendTo(txtAbove);
            $("<p>The colors of your priority chart show how each project or policy impacts your priorities in a <span style='background-color: #ec7623'>negative</span>, <span style='background-color: #EAD9C4'>neutral</span>, or <span style='background-color: #2BBEC5'>positive</span> way.</p>").appendTo(txtAbove);
            $("<p>Spend as much time on this page as you like, then move on to the next tab where you’ll be asked to identify the projects and policies that appeal most to you.</p>.").appendTo(txtAbove);
            $("<p>To get started, we've picked the action that appears to have the greatest positive impact on your priorities:</p>.").appendTo(txtAbove);

            var mechDivIns = $("<div class='mechGrp' style='min-height: 30px'></div>").appendTo("#dialog");
            $("<div class='mechIcon'></div>").appendTo(mechDivIns).attr("id", "mechInsExample");
            new SAS.MiniBubbleChart(bubblechart).addMiniBubbleChart("#mechInsExample", topScorer.values);
            var insTxt = $("<div class='mechText'></div>").appendTo(mechDivIns);
            SAS.localizr.live(topScorer.data.title,insTxt);

            mechDivIns.click(function () {
                _closeDialog();
            });
            _showInstructionDialog2();
        };

        this.showMapResultsDialog = function () {
            _showAgainFn = null;// -- no space for show again button on map... _self.showMapResultsDialog;
            var txt = "<p>What did people vote for in different communities? Use this map to find out.</p>";
            txt += "<p>Click the projects and policies on the left to see where they are receiving the greatest percentage of the votes.</p>";
            txt += "<p>Click a community's circle on the map to see how a they are voting.</p>";
            _showInstructionDialog(txt);
        };

        this.showMoneyDialog = function (numCoins) {
            _showAgainFn = function() {
                _self.showMoneyDialog(numCoins);
            };
            var txt = "<p>Put your money where your mouse is!</p>";
            txt += "<p>The following categories contain strategies that require action and/or investment by the public or the City. In this exercise, " +
              "you have a limited number of coins to invest in actions that support your priorities for Oklahoma City’s future growth. (To read more about each " +
              "item, hover your mouse over the action or tap it if using a tablet.) To the left of each action is a stack of coins indicating the relative cost of the investment. " +
              "You have <span style='text-decoration:underline'>up to</span> " + numCoins + " coins to spend by selecting the actions you would support.</p>";
            txt += "<p>See how the colors change on the bubble chart to the right as you invest in actions that support your priorities.</p>"
            _showInstructionDialog(txt, {name: 'money'});
        };

        this.showPoliciesDialog = function () {
            _showAgainFn = function() {
                _self.showPoliciesDialog();
            };
            var txt = "<p> The city’s comprehensive plan will contain a number of policies and recommendations intended " +
              "to move our community closer to reaching its goals. Tell us if you would support pursuing the following " +
              "ideas by selecting the thumbs up, or if you would not support the idea by selecting the thumbs down. If " +
              "you are neutral or don't have an opinion, don't select either.</p>";
            txt += "<p>The colors in the bubble chart to the right will change to reflect how pursuing these ideas could help achieve your priorities.</p>";
            _showInstructionDialog(txt, {name: 'policies'});
        }

        this.showCredits = function () {
            var txt = "<p>Many icons are from <a href='http://thenounproject.com/' target='_blank'>The Noun Project</a> Collection.</p>";
           _showInstructionDialog(txt, "Credits");
        };

        this.showSharingDialog = function (entryId, header, pages, bubblechart, sortedPriorities) {
            //TODO
            var txt = "<p>Thanks for taking this survey. For more information about planokc, visit <a href='http://www.planokc.org'>planokc.org</a>.</p>";
            _showInstructionDialog(txt,{title: 'Thank you for sharing!', name: "sharing"});
        };
        //endregion

        _initialize();
    }
})();