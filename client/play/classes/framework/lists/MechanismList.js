/**
 * User: kgoulding
 * Date: 4/3/12
 * Time: 11:32 PM
 */
(function () { // self-invoking function
    /**
     * @class SAS.MechanismList
     * @extends SAS.ACompareList
     * @param filename
     * @param bigBubbleChart
     * @constructor
     */
    SAS.MechanismList = function (filename, bigBubbleChart) {
        var _self = this;
        /** @type SAS.ACompareList */
        var _super = SAS.Inheritance.Extend(this, new SAS.ACompareList(bigBubbleChart));

        var IMPACTS = "impacts";
        var SCENARIO = "scenario";
        var POLICIES = "policies";

        //region private fields and methods
        var _filename = filename;

        /** @type SAS.BubbleChart */
        var _bigBubbleChart = bigBubbleChart;
        var _onLoad = function () {
        };

        var _mechIconDivsById = {};
        var _mechSubDivsById = {};

        var _moneyIcons;
        var _mode = IMPACTS;
        var _policies = false;
        var _totalCoins = 40;

        var _actionDefs = {};


        //var _transTime = 1000;

        var _setMode = function (mode) {
            _mode = mode;
            if (_mode == IMPACTS) {
                //_super._getCatDiv("Baseline").slideDown(_transTime);
                $(".mechGrp").css("minHeight", "30px");
                $(".mechGrp").removeClass("mechGrpBox").addClass("mechGrpBtn");
                _showMoneyIcons(false);
                _super._showBubbleCharts(true);
            } else {
                //_super._getCatDiv("Baseline").slideUp(_transTime);
                $(".mechGrp").removeClass("selected");
                $(".mechGrp").css("minHeight", "24px");
                if (_mode == SCENARIO || _mode == POLICIES) {
                    $(".mechSub").show();
                    $(".mechGrp").removeClass("mechGrpBtn").addClass("mechGrpBox");
                }
            }
            if (_mode == SCENARIO || _mode == POLICIES) {
                _showMoneyIcons(true);
                $("#coinsLeft").show();
            } else {
                $("#coinsLeft").hide();
                $(".mechSub").hide();
            }
        };

        var _showMoneyIcons = function (show) {
            if (_moneyIcons == null) return;
            $.each(_moneyIcons, function (k, micons) {
                $.each(micons, function (i, micon) {
                    micon.showDivs(show);
                });
            });
        };

        var _radioClick = function (mechanism, clickedIcon) {
            $.each(_moneyIcons[mechanism.id], function (i, micon) {
                if (clickedIcon != micon) {
                    if (clickedIcon.isOn()) {
                        micon.setOn(false);
                        micon.setNetCoins(clickedIcon.getTotalCoins());
                    } else {//--icons can be unchecked too
                        micon.setNetCoins(0);
                    }
                }
            });
        };

        var _addMoneyAndVotes = function (mechanism) {
            _moneyIcons[mechanism.id] = [];
            var micons = [];
            d3.json('/getActions?mechId=' + mechanism.id, function (mObj) {
                $.each(mObj.actions, function (i, action, cb) {
                    if (!action.data || action.data.value === 0) return true;//continue
                    var actionDiv = $("<div id='" + action.aId + "' class='mech_action_div'>").appendTo(_mechSubDivsById[mechanism.id]);
                    action.data.aId = action.aId;
                    if(_actionDefs[action.aId].value == 0) {
                        _super._addPolicyDiv(SAS.localizr.get(mechanism.data.category));
                        micons[0] = new SAS.MoneyVoteIcon(mechanism, action.data, _actionDefs[action.aId], {thumbState:'up',thumbs:1});
                        micons[1] = new SAS.MoneyVoteIcon(mechanism, action.data, _actionDefs[action.aId], {thumbState:'down',thumbs:-1});
                        //TODO: this is a hacky fix to force divs to not show policies when on the budget page and vice versa when first loading, should work on creating a sequential loading of actions and hiding of policies/budget
                        if(_policies) {
                            _showDivs(true, true);
                        } else {
                            _showDivs(true);
                        }

                    } else {
                        micons[0] = new SAS.MoneyVoteIcon(mechanism, action.data, _actionDefs[action.aId]);
                    }
                    $.each(micons, function(i,micon){
                        _moneyIcons[mechanism.id].push(micon);
                        micon.addMoneyAndVotes(actionDiv, mechanism.values);
                        micon.onSelectionChange(function () {
                            /*
                             Temporarily removed radio click as the options for this game are not exclusive
                             TODO: abstract to make this optional so admin can select whether they want exclusive or non-exclusive actions
                             */
                            if(_actionDefs[action.aId].value == 0) {
                                _radioClick(mechanism, micon); //exclusive selection between thumbs up and down
                            }
                            _recalcMoney(mechanism, micon, micon.getThumbState());
                        });
                    });
                });
            });
        };

        var _ensureActionDefsLoaded = function (callback) {
            if ($.isEmptyObject(_actionDefs)) {
                d3.json('/getActionDefs?filename='+_filename, function (actionDefs) {
                    _actionDefs = {};
                    $.each(actionDefs, function (i, /**SAS.ActionDef*/ value) {
                        _actionDefs[value.uid] = value;
                    });
                    callback();
                });
            } else {
                callback();
            }
        };

        var _recalcCoinBalance = function (coinsUsed) {
            var coinsLeft = (_totalCoins - coinsUsed);
            if (coinsLeft == 0) {
                $("#coinsLeft").html("<span class='coinsLeftNum'>0</span> <span data-localize='coinsleft.zero'>coins to spend <small>(to redistribute, uncheck current selections)</small></span>");
            } else {
                $("#coinsLeft").html("<span data-localize='coinsleft.first'>You have</span> <span class='coinsLeftNum'>" + coinsLeft + "</span> <span data-localize='coinsleft.last'>coin" + (coinsLeft > 1 ? "s" : "") + " left to distribute</span>");
            }

            $.each(_moneyIcons, function (mechId, micons) {
                $.each(micons, function (i, micon) {
                    micon.setEnabled(coinsLeft >= micon.getNetCoins());
                });
            });
            SAS.localizr.setActiveLang();
        };

        var _recalcMoney = function (mechanism, micon, thumbState) {
            var scores = {};
            var coinsUsed = 0;
            $.each(_super._mechanisms(), function (i, mechanism) {
                var micons = _moneyIcons[mechanism.id];
                if (micons == null) return true;//continue
                $.each(micons, function (j, micon) {
                    if (micon.isOn()) {
                        coinsUsed += micon.getTotalCoins();
                        new SAS.MechanismScorer(mechanism).appendScores(micon.getMultiplier(), scores);
                    }
                });
            });
            _bigBubbleChart.colorByMoney(mechanism, micon, scores, thumbState);
            _recalcCoinBalance(coinsUsed);
        };

        var _addMechListItem = function (mechanism) {
            mechanism.id = mechanism.data.uid;
            if(mechanism.data.category) {
                mechanism.category = SAS.localizr.get(mechanism.data.category);
            } else {
                mechanism.category = "";
            }
            //Get category from mechanism and load in to cat divs
            _super._addCatDiv(mechanism.category);
            if (!_super._getCatDiv(mechanism.category)) return;
            var mechDiv = $("<div class='mechGrp'></div>").appendTo(_super._getCatDiv(mechanism.category));
            mechDiv.attr("id", "mech" + mechanism.id);
            _mechIconDivsById[mechanism.id] = $("<div class='mechIcon'></div>").appendTo(mechDiv);
            _mechIconDivsById[mechanism.id].attr("id", "mechIcon" + mechanism.id);
            var $titleTxt = $("<div class='mechText'></div>").appendTo(mechDiv);
            SAS.localizr.live(mechanism.data.title, $titleTxt);
            _mechSubDivsById[mechanism.id] = $("<div class='mechSub'></div>").appendTo(mechDiv);
            mechDiv.click(function () {
                if (_mode == IMPACTS) {
                    _super._setActiveMechanism(mechanism);
                }
            });
        };

        var _createList = function () {
            $("#mechanismList").html("");
            _super._mechPanel($("<div class='mechPanel " + (_mode == SCENARIO ? 'panel_money' : 'panel_money') + "'></div>").appendTo("#mechanismList"));

            _super._addCatDivs([""]);

            $.each(_super._mechanisms(), function (i, mechanism) {
                _addMechListItem(mechanism);
                if (mechanism.id == "BASELINE") {
                    _super._setActiveMechanism(mechanism);
                }
            });
        };

        var _showDivs = function (show, policies) {
            $("#mechanismList").toggle(show);
            if(policies) {
                $('.mechCat').hide();
                $.each(_super._getPolicyDivs(), function(i, policyDiv) {
                    policyDiv.show();
                });

            } else {
                policies = false;
                $('.mechCat').show();
                $.each(_super._getPolicyDivs(), function(i, policyDiv) {
                    policyDiv.hide();
                });
            }
            $("#coinsLeft").toggle(show && _mode == SCENARIO && !_policies);
            $("#clickInstr").toggle(show && _mode == SCENARIO && !_policies);
            $("#policiesInstr").toggle(show && _mode == SCENARIO && _policies);
            if (show) {
                //$("#leftPanel").css("width", "445px");
            }
            _super._updateSelectionDisplay();
        };

        //--protected fields and methods (use '_' to differentiate).

        _super._o_getMechIconDivById = function (id) {
            return _mechIconDivsById[id][0];
        };

        _super._o_getMechIconDivById = function (id) {
            return _mechIconDivsById[id][0];
        };

        _super._o_updateSelectionDisplay = function (mech) {
            $(".mechGrp").removeClass("selected");
            if (mech == null || _mode == SCENARIO) return;
            $("#mech" + mech.id).addClass("selected");
        };
        //endregion

        //region public API
        this.showDivs = function (show, policies) {
            _showDivs(show, policies);
        };

        this.onLoad = function (fn) {
            _onLoad = fn;
        };

        this.getVotes = function () {
            var votes = {};
            var actions = {};
            if (_moneyIcons == null) return votes;
            $.each(_super._mechanisms(), function (i, mechanism) {
                var micons = _moneyIcons[mechanism.id];
                if (micons == null) return true;//continue
                $.each(micons, function (j, micon) {
                    if (micon.isOn()) {
                        /*
                        Added check to see if mechanism already has votes associated with it, make this cumulative, this
                        is a hack for a special case where you want to allocate individual coins to a single
                        TODO: abstract this so the admin can choose whether action votes are exclusive or not, maybe store the actual votes by action instead of mechanism
                         */
                        var thumbs = micon.getThumbs();
                        var aId = micon.getAction().aId;
                        if(votes[mechanism.id + "_" + aId]) {
                            if(thumbs != 0) {
                                votes[mechanism.id + "_" + aId] = thumbs;
                            } else {
                                votes[mechanism.id + "_" + aId] = micon.getTotalCoins();
                            }
                        } else {
                            if(thumbs != 0) {
                                votes[mechanism.id + "_" + aId] = thumbs;
                            } else {
                                votes[mechanism.id + "_" + aId] = micon.getTotalCoins();
                            }
                        }
                    }
                });
            });
            return votes;
        };

        this.getNumCoins = function () {
            return _totalCoins;
        };

        this.load = function (data) {
            _super._mechanisms(data);
            _createList();
            _onLoad();
        };

        this.ensureShowMiniBubbleCharts = function () {
            if (!_super._ensureShowMiniBubbleCharts()) {
                //_showBubbleCharts(true);--delay until after tween
                _super._resizeMiniBubbleCharts();
            }
            _setMode(IMPACTS);
        };

        /*
        policies bool required
         */
        this.ensureShowMoneyAndVotes = function (policies) {
            _policies = policies;
            _setMode(SCENARIO);

            _super._showBubbleCharts(false);
            if (_moneyIcons == null) {
                _moneyIcons = {};
                _ensureActionDefsLoaded(function () {
                    $.each(_super._mechanisms(), function (i, mechanism) {
                        _addMoneyAndVotes(mechanism);
                    });
                });
                _recalcMoney();
            } else {
                //_showMoneyIcons(true);
                _recalcMoney();
            }
            _super._updateSelectionDisplay();
            $('body').popover({
                selector: '[data-toggle=popover]',
                trigger: 'hover'
            });
        };
        //endregion

    }
})();