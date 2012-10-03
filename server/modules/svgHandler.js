//region nodejs core

//endregion
//region dependencies
//var et = require('elementtree');
//endregion
//region modules

//endregion

/**
 @class SVGHandler
 */
SVGHandler = function () {
    var _self = this;

    var _basicSVG = ["path", "rect", "polygon", "circle", "ellipse"];

    //region private fields and methods
    var _init = function () {

    };
    //endregion

    //region public API
    this.applyFillColor = function (data, color) {
        //var etree = et.parse(data);
        _basicSVG.forEach(function (name, i) {
            data = data.replace(new RegExp('<'+ name + ' ', 'gi'), '<'+name+' style="fill:'+color+'" ');
        });
        return data;
    };
    //endregion

    _init();
};

module.exports = new SVGHandler();

