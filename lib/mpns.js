// Copyright 2011 Jeff Wilcox
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

var url = require("url");
var http = require("http");

// Important note about Windows Phone 7.5:
// ---
// This library supports functions unique to Mango. If you provide the
// Mango-specific values (param, backBackgroundImage, etc.) to a
// Windows Phone 7 (original 7.0 or NoDo) device, the toast/tile will
// not be accepted.

// Suggested fallback values if you're storing results in a document/db.
// See also: http://msdn.microsoft.com/en-us/library/ff941100%28v=VS.92%29.aspx
var HTTP_412_MINIMUM_DELAY = 61; // minutes
var ERROR_MINIMUM_DELAY = 5; // minutes

var Toast = function(options) {
    return new PushMessage('toast', '2', 'toast', options);
};

var LiveTile = function(options) {
    return new PushMessage('tile', '1', 'token', options);
};

var RawNotification = function(payload, options) {
    if (options == undefined) {
        options = payload;
    } else {
        options.payload = payload;
    }
    return new PushMessage('raw', '3', undefined, options);
};

function PushMessage(pushType, quickNotificationClass, targetName, options) {
    this.pushType = pushType;
    this.notificationClass = quickNotificationClass;
    this.targetName = targetName;

    if (options) {
        copyOfInterest(options, this, propertiesOfInterest);
    }
}

PushMessage.prototype.send = function(pushUri, callback) {
    var payload = this.getXmlPayload();
    var uriInfo = url.parse(pushUri);
    var me = this;

    var headers = {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(payload),
        'Accept': 'application/*',
        'X-NotificationClass': this.notificationClass,
        'X-WindowsPhone-Target': this.targetName
    };

    var options = {
        headers: headers,
        host: uriInfo.host,
        port: uriInfo.protocol == "http:" ? 80 : 443,
        path: uriInfo.pathname,
        method: 'POST'
    };

    var result = { };
    var err = null;

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('end', function() {
            result.statusCode = res.statusCode;

            // Store the important responses from MPNS.
            if (res.headers) {
                result.deviceConnectionStatus = res.headers["x-deviceconnectionstatus"];
                result.notificationStatus = res.headers["x-notificationstatus"];
                result.subscriptionStatus = res.headers["x-subscriptionstatus"];
            }

            // Store the fields that were sent to make it easy to log.
            copyOfInterest(me, result, propertiesOfInterest);

            if (res.statusCode == '412') {
                result.minutesToDelay = HTTP_412_MINIMUM_DELAY; // Must be at least an hour.
                err = result;
            }

            if (res.statusCode == '404') {
                result.shouldDeleteChannel = true;
                err = result;
            }

            if (callback) {
                callback(err, result);
            }
        }).on('error', function(e) {
                result.minutesToDelay = ERROR_MINIMUM_DELAY; // Just a recommendation.
                err = result;
                err.error = e;
                if (callback) {
                    callback(err, result);
                }
            });
    });

    // Send the push notification to Microsoft.
    req.write(payload);
    req.end();
};

function copyOfInterest(source, destination, fieldsOfInterest) {
    if (source && destination && fieldsOfInterest && fieldsOfInterest.length > 0) {
        for (var i = 0; i < fieldsOfInterest.length; i++) {
            var key = fieldsOfInterest[i];
            if (source[key]) {
                destination[key] = source[key];
            }
        }
    }
}

PushMessage.prototype.getXmlPayload = function() {
    this.validate();
    if (this.pushType == 'tile') {
        return tileToXml(this);
    } else if (this.pushType == 'toast') {
        return toastToXml(this);
    } else if (this.pushType == 'raw') {
        return this.payload;
    }
};

PushMessage.prototype.validate = function() {
    if (this.pushType != 'toast' && this.pushType != 'tile') {
        throw new Error("Only 'toast' and 'tile' push types are currently supported.");
    }
};

// This is a little lazy, really more needs to be escaped and I'm sure there's a standard function for that hotness too.
function escapeAmpersands(str) {
    return str.replace(/\&/g,'&amp;');
}

function getPushHeader(type) {
    return '<?xml version="1.0" encoding="utf-8"?><wp:Notification xmlns:wp="WPNotification">' + 
        startTag(type);
}

function getPushFooter(type) {
    return endTag(type) + endTag('Notification');
}

function startTag(tag, endInstead) {
    return '<' + (endInstead ? '/' : '')  + 'wp:' + tag + '>';
}

function endTag(tag) {
    return startTag(tag, true);
}

function wrapValue(object, key, name) {
    return object[key] ? startTag(name) + escapeAmpersands(object[key]) + endTag(name) : null;
}

function toastToXml(options) {
    var type = 'Toast';
    return getPushHeader(type) + 
        wrapValue(options, 'text1', 'Text1') + 
        wrapValue(options, 'text2', 'Text2') + 
        wrapValue(options, 'param', 'Param') + 
        getPushFooter(type);
}

function tileToXml(options) {
    var type = 'Tile';
    return getPushHeader(type) + 
        wrapValue(options, 'backgroundImage', 'BackgroundImage') +
        wrapValue(options, 'count', 'Count') +
        wrapValue(options, 'title', 'Title') +
        wrapValue(options, 'backBackgroundImage', 'BackBackgroundImage') +
        wrapValue(options, 'backTitle', 'BackTitle') +
        wrapValue(options, 'backContent', 'BackContent') +
        getPushFooter(type);
}

var propertiesOfInterest = [
    'pushType',

    'text1',
    'text2',
    'param',

    'backgroundImage',
    'count',
    'title',
    'backBackgroundImage',
    'backTitle',
    'backContent',

    'payload'
];

exports.liveTile = LiveTile;
exports.toast = Toast;
exports.rawNotification = RawNotification;
