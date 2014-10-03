var path = require('path');
var nodeStatic = require('node-static');
var fs = require('fs');
var util = require('util');

var config = require("config");

/*
if(process.env.NODE_ENV == 'production') {
    var config = require("./server/config");
} else {
    var config = require("./server/config.development");
}*/

var server = require("./server/http/server");
var router = require("./server/http/router");
/** @type ContributeDataHandler */
var dataHandler = require("./server/modules/dataHandlers/contributeDataHandler");
/** @type ResponseDataHandler */
var responseDataHandler = require("./server/modules/dataHandlers/responseDataHandler");
/** @type SettingDataHandler */
var settingDataHandler = require("./server/modules/dataHandlers/settingDataHandler");
/** @type ImageDataHandler */
var imageDataHandler = require("./server/modules/dataHandlers/imageDataHandler");
/** @type FileManager */
var fileManager = require("./server/modules/fileManager");
/** @type SocketHandler*/
var socketHandler = require("./server/modules/socketHandler");
var personaServer = require("./server/modules/personaServer");
var persistentStore = require("./server/modules/persistentStore");


var persist = new persistentStore.PersistentStore();
var ps = new personaServer.PersonaServer(persist, {
    audience:config.appURL
});

// set Handlers
fileManager.setHandlers(imageDataHandler);
dataHandler.setHandlers(socketHandler, imageDataHandler);
responseDataHandler.setHandlers(settingDataHandler, dataHandler);

//var client = path.resolve(__dirname, "client");
var file = new (nodeStatic.Server)(__dirname);
fileManager.options({
    uploadDir:__dirname + '/tmp'
});

var prehandle = {};
prehandle["/fileupload"] = fileManager.handleUpload;

var securePaths = [
    "/takeLock",
    "/releaseLock",
    "/addPriority",
    "/addMechanism",
    "/addAction",
    "/deleteAction",
    "/deletePriority",
    "/deleteMechanism",
    "/updateContent",
    "/deletefile",
    "/client/contribute/index.html"
];//Note: fileManager.handleUpload uses auth automatically (not based on securePaths)

var handle = {};
handle["/addPriority"] = dataHandler.addPriority;
handle["/addAction"] = dataHandler.addAction;
handle["/addMechanism"] = dataHandler.addMechanism;
handle["/takeLock"] = dataHandler.takeLock;
handle["/releaseLock"] = dataHandler.releaseLock;
handle["/deletePriority"] = dataHandler.deletePriority;
handle["/deleteAction"] = dataHandler.deleteAction;
handle["/deleteMechanism"] = dataHandler.deleteMechanism;
handle["/getAllContent"] = dataHandler.getAllContent;
handle["/updateContent"] = dataHandler.updateContent;

handle["/listfiles"] = fileManager.listFiles;
handle["/deletefile"] = fileManager.deletefile;
handle["/files"] = fileManager.serveFile;
handle["/getImage"] = fileManager.getImage;

handle["/getPriorities"] = dataHandler.getPriorities;
handle["/getPriorityTitles"] = dataHandler.getPriorityTitles;
handle["/getMechanisms"] = dataHandler.getMechanisms;
handle["/getMechanismInfo"] = dataHandler.getMechanismInfo;
handle["/getActionDefs"] = dataHandler.getActionDefs;
handle["/getActions"] = dataHandler.getActions;
handle["/listActions"] = dataHandler.listActions;

handle["/saveResponse"] = responseDataHandler.saveResponse;
handle["/getMechCountForZip"] = responseDataHandler.getMechCountForZip;
handle["/getPriCountForZip"] = responseDataHandler.getPriCountForZip;
handle["/getAllResponses"] = responseDataHandler.getAllResponses;

handle["/getLocations"] = settingDataHandler.getLocations;

handle["/persona_login"] = ps.login;
handle["/persona_logout"] = ps.logout;

handle["/"] = function(req, res, postData) {
    /*fs.readFile('client/play/index.html',function(err, contents) {
        if (!err) {
            res.writeHead(200, {
                "Content-Type": 'text/html',
                "Content-Length": contents.length
            });
            res.end(contents);
        } else {
            res.writeHead(500);
            res.end();
        }
    }); */
    res.writeHead(302, {
        'Location': '/client/play/index.html'
        //add other headers here...
    });
    res.end();
}

//handle["/TEMP_fixLangs"] = dataHandler.TEMP_fixLangs();

//handle["/upload"] = requestHandlers.upload;
server.start(router.route, securePaths, prehandle, handle, file, persist);
server.startSockets(socketHandler.onConnect);