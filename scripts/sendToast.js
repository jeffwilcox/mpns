// Copyright Jeff Wilcox
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

var TEST_TITLE = 'Hi.';
var TEST_MESSAGE = 'This is a test.';

var   mpns = require('../lib/mpns')
    , fs = require('fs');

var args = process.argv;
args.shift();
var cmd = 'node ' + args.shift();

function help() {
	console.log('Node.js MPNS Module Test Toaster');
	console.log('Please provide the pushUri to a Microsoft Push Notification Service (MPNS) endpoint to a Windows Phone device.');
	console.log();
	console.log('Parameters:');
	console.log('    ' + cmd + ' pushUri [Message]');
	console.log();

	// Right now my implementation for auth push testing is specific to my key use practices.
	console.log('Authenticated push notification channels are supported with the appropriate environment variables:');
	console.log('    MPNS_CERT: Point to a certificate file.');
	console.log('    MPNS_CA:   Point to a certificate authority or intermediate chain file.');
	console.log('    MPNS_KEY:  Point to a private key file.');
}

if (args.length == 0) {
	return help();
}

var uri = args.shift();

if (uri.indexOf('http') !== 0) {
	console.log('The first parameter must be a URI.');
	return help();
}

var options = {
	text1: args.shift() || TEST_TITLE,
	text2: args.length > 0 ? args.join(' ') : TEST_MESSAGE
};

var authenticationReady = false;

if (process.env.MPNS_CERT && process.env.MPNS_KEY) {
	options.cert = fs.readFileSync(process.env.MPNS_CERT, 'utf8');
	options.key = fs.readFileSync(process.env.MPNS_KEY, 'utf8');

	var ca = process.env.MPNS_CA;
	if (ca !== undefined) {
		options.ca = fs.readFileSync(ca, 'utf8');
	}

	authenticationReady = true;
}

if (uri.indexOf('https') == 0) {
	if (!authenticationReady) {
		throw new Error('Authenticated push channels are not currently supported by this test application unless environment variables are set properly.');
	} else {
		console.log('Authenticated push notification channel.');

		for (var k in mpns.Properties.ssl) {
			var key = mpns.Properties.ssl[k];
			if (options[key]) {
				console.log('SSL option: ' + key);
			}
		}
	}
}

console.log('Sending a toast...');

mpns.sendToast(uri, options, function (err, result) {
	if (err) {
		console.dir(err);
		throw new Error('There was a problem with the toast or push channel.');
	} else {
		console.log('OK.');
		console.dir(result);
	}
});
