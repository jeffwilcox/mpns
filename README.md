#mpns

Send toast and live tile updates to Windows Phones through the Microsoft Push Notification Service (MPNS). Intended for the cloud and Node.js.

This is one of my very first Node.js projects so feedback and patience appreciated. I hope it helps!

## Installation

Via [npm][]:

	$ npm install mspn
	
As a submodule of your Git project

	$ git submodule add http://github.com/jeffwilcox/mpns.git mpns
	$ git submodule update --init

## Usage
### Load in the module

	var mpns = require('mpns');

### Create a new notification
You can create a new notification object (either of type live tile or toast).

Property names for the notification object directly correlate to the names used in the MPNS XML payload as documented on MSDN. Properties can either be set directly on the object (such as toast.text1) or by passing the values in as options to the constructor.

	options =   { text1: 'Hello!'
				, text2: 'Great to see you today.'
				};

	var toast = new mpns.toast(options);

### Sending a notification
To send a notification simply call the `send` method on the object. The first parameter is the HTTP URI to the MPNS endpoint of the client you'd like to send the notification to. You may provide an optional callback function as well.

	toast.send('http://sn1.notify.live.net/throttledthirdparty/01.00/YOUR_ENDPOINT_HERE');

You can also use the other syntax. Let's send a live tile update!

	var toast = new mpns.liveTile();
	toast.title: 'My App';
	toast.backgroundUri: 'http://sample.com/image.png';
	toast.send('http://sn1.notify.live.net/throttledthirdparty/01.00/YOUR_ENDPOINT_HERE', function(err,res) {
		if (err) console.dir(err);
		else console.dir(res);
	});

### Sending a raw notification
When creating the notification object, either provide the raw payload first, or as the `options.payload` property.

	var raw = new mpns.rawNotification('My Raw Payload', options);

Today the type on the request is set to UTF8 explicitly.

### Results object information
A results object is passed back through the callback and has important information from MPNS.

- `deviceConnectionStatus`: The device status as reported by the service.
- `notificationStatus`: The status of your provided notification.
- `subscriptionStatus`: The status of the subscription URI.

The object will also contain all the key fields for your toast or live tile update, plus the pushType. This makes it easy to store this information in a history log somewhere in the ether.

### Handling Errors
It is very important as a consumer that you store appropriate actionable data about failed push notification attempts. As a result, the callback's first parameter (err) is set to the standard results object as well as a few additional fields depending on the returned status code from the server.

Remember to take action on that information in order to be a good MPNS citizen. These values may be set in the error object and of interest to you:

- `minutesToDelay`: If this is present, it is the suggested minimum amount of time that you should wait until making another request to the same subscription URI. For HTTP 412s, for example, the minimum time is one hour and so the returned value defaults to 61.
- `shouldDeleteChannel`: If this is set to `true`, the channel is gone according to MPNS. Delete it from your channel/subscription database and never look back.
- `error`: If an error is captured while trying to make the HTTP request, this will be set to that error callback instance.

### A note about Windows Phone 7.5
This module permits sending toasts and tiles specific to Mango. If you include the `param` field when sending a push to a 7.0 (first Windows Phone release) phone, unfortunately it may not be received, or will error out the subscription.

Take care when registering your subscription channels with your cloud service to include the application platform version of the app (7.1 for Mango apps). To rock, maybe also grab the OS version and deployed app version. That information can be helpful when supporting customers.

## Credits

Written and maintained by [Jeff Wilcox].

## License

Copyright 2011 Jeff Wilcox

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

[Jeff Wilcox]: http://www.jeff.wilcox.name
[npm]: http://github.com/isaacs/npm

## Changelog

1.0.0:

* Initial implementation offering basic live tile and toast (no raw) support.

1.0.1:

* Adds raw notification type support.

1.0.2:

* Fixes some small formatting issues.
