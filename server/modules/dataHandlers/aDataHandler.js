//region includes

//endregion
//
/*
if(process.env.NODE_ENV == 'production') {
    var config = require("../../config");
} else {
    var config = require("../../config.development");
}*/
var config = require("config");

var nano = require('nano')(config.couchURL);
var json2csv = require('json2csv');

//region includes
//constants
/**
 @class ADataHandler
 */
ADataHandler = function (dbName) {
    var _self = this;
//region private fields and methods
    var _dbName = dbName;
    var _db = nano.db.use(_dbName);

    var _createDb = function (callback) {
        nano.db.create(_dbName, function (err) {
            //do we need to call 'use' again???
            if (!err && callback) callback();
        });
    };

    var _deleteAllResults = function (body, callback) {
        if (body && body.rows && body.rows.length > 0) {
            body.rows.forEach(function (row, i) {
                var doc = row.value;
                _db.destroy(doc._id, doc._rev, function (err, body) {
                    if (callback) callback(!err);
                });
            });
        }
    };

    var _returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    var _returnResults = function (res, body, fn) {
        if (!(body && body.rows)) {
            _returnJsonObj(res, []);
            return;
        }
        _returnJsonObj(res, body.rows.map(function (row) {
            if (fn) return fn(row.value);
            return row.value;
        }));
    };

    var _returnBasicSuccess = function (res) {
        _returnJsonObj(res, {success:true});
    };

    var _returnBasicFailure = function (res, message) {
        _returnJsonObj(res, {success:false, message:message});
    };
//endregion

//region protected methods
    this.p_db = _db;

    /**
     * @param {Object} doc
     * @param {String} docId
     * @param {Function} callback
     * @param {Boolean} [dontCreateDb]
     */
    this.p_addOrUpdate = function (doc, docId, callback, dontCreateDb) {
        var db = _self.p_db;
        if (docId) {
            db.head(docId, function (err, _, headers) {
                if (err) {
                    //probably a 404 in which case we don't need a 'revision'
                } else {
                    doc._rev = JSON.parse(headers.etag);
                }
                db.insert(doc, docId, function (err, res) {
                    if (err) {
                        if (err.reason == 'no_db_file' && !dontCreateDb) {
                            _createDb(function () {
                                _self.p_addOrUpdate(doc, docId, callback, true);//avoid infinite loop if creation fails
                            });
                        } else {
                            console.log("ERROR: problem adding doc: " + err.description);
                        }
                    }
                    if (callback) callback();
                });
            });
        } else {
            db.insert(doc, {}, function (err, res) {
                if (err) console.log("ERROR: problem adding doc: " + err.description);
                if (callback) callback();
            });
        }
    };

    this.p_view = function (view_name, params, callback) {
        _db.view('views', view_name, params, callback);
    };

    this.p_createViews = function (views) {
        this.p_addOrUpdate(views, '_design/views');
    };

    this.p_returnResults = function (res, body, fn) {
        _returnResults(res, body, fn);
    };

    this.p_returnJsonObj = function (res, obj) {
        res.writeHeader(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(obj));
        res.end();
    };

    this.p_returnCSV = function (res, obj) {
        var data = obj;
        var columns = [];
        obj.forEach(function(row,i) {
            for(key in row) {
                if(columns.indexOf(key) == -1) {
                    columns.push(key);
                }
            }
        });
        for(var i = 0; i < columns.length; i++){
            obj.forEach(function(row,j){
               for(key in row) {
                   if(row[columns[i]] == undefined) {
                       row[columns[i]] = 0;
                   }
               }
            });
        }
        var date = new Date();
        var today = date.getFullYear() + date.getDate() + date.getMonth();
        res.writeHeader(200, {"Content-Type": "text/csv;charset=utf-8", 'Content-Disposition': 'attachment; filename=responses_'+ today +'.csv'});
        json2csv({data: obj, fields: columns}, function(err, csv) {
            if (err) console.log(err);
            console.log(csv)
            res.write(csv,'utf8');
        });
        res.end();
    }

    this.p_returnBasicSuccess = function (res) {
        _returnBasicSuccess(res);
    };

    this.p_returnBasicFailure = function (res, message) {
        _returnBasicFailure(res, message);
    };

    this.p_deleteAllResults = function (body, callback) {
        _deleteAllResults(body, callback);
    };
//endregion
};

exports.ADataHandler = ADataHandler;



