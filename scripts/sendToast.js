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

var mpns = require('../lib/mpns');

var args = process.argv;
args.shift();
var cmd = 'node ' + args.shift();

function help() {
	console.log(cmd + ' pushUri [Message]');
}

if (args.length == 0) {
	return help();
}

var uri = args.shift();

if (uri.indexOf('http') !== 0) {
	console.log('The first parameter must be a URI.');
	return help();
}

if (uri.indexOf('https') == 0) {
	throw new Error('Authenticated push channels are not currently supported by this test application.');
}

var options = {
	text1: args.shift() || TEST_TITLE,
	text2: args.length > 0 ? args.join(' ') : TEST_MESSAGE
};

mpns.sendToast(uri, options, function (err, result) {
	if (err) {
		console.dir(err);
		throw new Error('There was a problem with the toast or push channel.');
	} else {
		console.log('OK.');
		console.dir(result);
	}
});
