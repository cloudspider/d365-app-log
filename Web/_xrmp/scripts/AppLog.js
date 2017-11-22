/// <reference path="../XRMLib/XrmLib.js" />

var AppLog = (function () {

    var enescapeHtml = function (s) {

        return s.replace(/\&#47;/mg, '/').replace(/\&#63;/mg, '?').replace(/\&#61;/mg, '=').replace(/\&#38;/mg, '&').replace(/\&#37;/mg, '%').replace(/\&#40;/mg, '(').replace(/\&#41;/mg, ')').replace(/\&#58;/mg, ':').replace(/\&#59;/mg, ';').replace(/\&#35;/mg, '#');
    };

    return {

        enableAppLog: function () {

            // check if there's any CRM errors

            if (top.Mscrm.ScriptErrorReporting !== null && top.Mscrm.ScriptErrorReporting.$1m != null) {

                debugger;
                console.log(top.Mscrm.ScriptErrorReporting.$1m);

                var entityName = Xrm.Page.data.entity.getEntityName();
                var entityId = Xrm.Page.data.entity.getId();

                var errorTitle = "Script Error";
                var error = enescapeHtml(JSON.stringify(top.Mscrm.ScriptErrorReporting.$1m, null, 2)).replace(/(?:\\[rn])+/g, "\n");

                var errorDetails = 'Entity: ' + entityName + '\n\r' + 'EntityId: ' + entityId + '\n\r' + 'Location: ' + Xrm.Page.context.getClientUrl() + '/main.aspx?etn=' + entityName + '&pagetype=entityrecord&id=' + entityId + '\n\r' + 'Error:' + error;

                AppLog.logError(errorTitle, errorDetails, entityName);
            }

            // hook into window error event
            top.window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {

                var entityName = Xrm.Page.data.entity.getEntityName();
                var entityId = Xrm.Page.data.entity.getId();
                var errorTitle = errorMsg;

                var errorDetails = 'Entity:' + entityName + '\n\r' + 'EntityId:' + entityId + '\n\r' + 'Location: ' + Xrm.Page.context.getClientUrl() + '/main.aspx?etn=' + entityName + '&pagetype=entityrecord&id=' + entityId + '\n\r' + 'Error: ' + errorMsg + '\n\r' + 'Script: ' + url + '\n\r' + 'Line: ' + lineNumber + '\n\r' + 'Column: ' + column + '\n\r' + 'StackTrace: ' + errorObj;

                AppLog.logError(errorTitle, errorDetails, entityName);

            }
        },

        logError: function (error, details, entityName) {

            AppLog.logEvent(error, 4, details, entityName);
            console.error(error + "\n" + entityName + "\n" + details);
        },

        logEvent: function (event, level, details, entityName) {

            var entity = {};
            entity.xrmp_event = event;
            entity.xrmp_description = details;
            entity.xrmp_entity = entityName;
            entity.xrmp_level = level;

            var req = new XMLHttpRequest();
            req.open("POST", Xrm.Page.context.getClientUrl() + "/api/data/v8.2/xrmp_applogs", true);
            req.setRequestHeader("OData-MaxVersion", "4.0");
            req.setRequestHeader("OData-Version", "4.0");
            req.setRequestHeader("Accept", "application/json");
            req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            req.onreadystatechange = function () {
                if (this.readyState === 4) {
                    req.onreadystatechange = null;
                    if (this.status === 204) {
                        var uri = this.getResponseHeader("OData-EntityId");
                        var regExp = /\(([^)]+)\)/;
                        var matches = regExp.exec(uri);
                        var newEntityId = matches[1];
                        console.log(newEntityId);
                    } else {
                        console.error(this.statusText);
                        //Xrm.Utility.alertDialog(this.statusText);
                    }
                }
            };

            req.send(JSON.stringify(entity));
        }
    }
})();