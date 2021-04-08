//Imposter Mock JSON Testing Library
//Author: Daniel Llewellyn / Kenji776 / @Kenji776
//Date: 6/10/2013
//Description: a simple library that supports plugins for testing applications that may rely on APIs that return JSON that cannot be reached
//normally due to browser security issues. It works by intercepting http requests from the browser, checking to see if they match the signatures
//of any of the definede plugins, reading pre defined JSON from a file and returning it in the response text of the http request. It allowes for seamless
//testing of any JSON api without having to worry about proxies and such.

//To use it, simple include this library and any required API libraries in your source file. If needed change the logic in the plugin to return the desired JSON for
//different circumstances. Then in your actual program invoke an instance of Imposter and pass it a callback function. Once the callback has been called you are good to go.
//imposter will begin intercepting requests for any known API and respond according to your plugin configuration. You may manually stop imposter by calling 
//imposter.active = false
//you may also stop interception for a single specific API by calling
//imposter.registeredEndpoints[nameSpaceOfPlugin].active = false.

//Supports HTTP Verbs from RFC2616 and RFC2518 as seen at http://annevankesteren.nl/2007/10/http-methods

//Additionally the request returned to the caller will contain a few extra keys with information to help debug and make sure that the JSON response you expect to receive is what you got.
//The request will contain a 'loadedTemplate' key which contains the name of JSON template that was used, and an 'endpoint' property that contains the information the plugin registered about the 
//endpoint (not including the functions/handlers).
var imposter = new Object();
imposter.registeredEndpoints = new Object();
imposter.active = true;

//adds or removes a new API endpoint to the list of overridable URLS that imposter will handle.
imposter.endpoints = function(verb,endPoint)
{
	response = new imposter.requestResponse();

	try
	{
		if(verb == 'add' || typeof verb === "undefined" && endPoint instanceof imposter.endPoint)
		{
			imposter.registeredEndpoints[endPoint.namespace] = endPoint;	
		}
		else if(verb == 'remove')
		{
			response.success = false;
			if(imposter.registeredEndpoints.hasOwnProperty(endPoint.namespace))
			{
				delete imposter.registeredEndpoints[endPoint.namespace];	
				response.success = true;
			}
		}
		else if(verb == 'contains')
		{
			Object.keys(imposter.registeredEndpoints).forEach(function(key) {
				if(imposter.registeredEndpoints[key].url == endPoint)
				{
					response.data = imposter.registeredEndpoints[key];
				}
			});			
		}
		else if(verb == 'get')
		{
			response.data = imposter.registeredEndpoints;	
		}
	}
	catch(exception)
	{
		response.success = false;
		response.message = 	exception.message;
	}
	return response;
}

//finds the host from a url, so https://api.box.com/folders/get would just become 
//https://api.box.com. This lets imposter know if a given request url is for a defined API
//and that it should intercept said request.
imposter.extractBaseUrlFromString = function(urlString)
{
	response = new imposter.requestResponse();
	try
	{
		pathArray = urlString.split('/');
		protocol = pathArray[0];
		host = pathArray[2];
		var url = protocol + '//' + host;
		response.data = url.toLowerCase();	
	}
	catch(exception)
	{
		response.success = false;
		response.message = 	exception.message;
	}
	return response;
}
	
imposter.requestResponse = function(requestResponse)
{
	requestResponse = requestResponse != null ? requestResponse : new Object();
	this.success = requestResponse.success || true;
	this.message = requestResponse.message || 'Request Run Successfull';
	this.data = requestResponse.data || null;	
}

imposter.requestResult = function(requestResult)
{
	requestResult = requestResult != null ? requestResult : new Object();
	this.success = requestResult.success || true;
	this.status = requestResult.status || 200;
	this.data = requestResult.data || '{"Error":"No matching endpoing could be found"}';	
}

imposter.endPoint = function(endpoint)
{
	endpoint = endpoint != null ? endpoint : new Object();
	this.url = endpoint.url || '';
	this.active = endpoint.active || true;
	this.namespace =  endpoint.namespace || 'imposter';
	this.templatePath = endpoint.templatePath || 'relative path from invoking file to templates for this endpoint';
	this.getHandler = endpoint.getHandler || function(){return new imposter.requestResponse()};	
	this.patchHandler = endpoint.patchHandler || function(){return new imposter.requestResponse()};	
	this.postHandler = endpoint.postHandler || function(){return new imposter.requestResponse()};	
	this.deleteHandler = endpoint.deleteHandler || function(){return new imposter.requestResponse()};	
	this.traceHandler = endpoint.traceHandler || function(){return new imposter.requestResponse()};
	this.connectHandler = endpoint.connectHandler || function(){return new imposter.requestResponse()};
	this.headHandler = endpoint.headHandler || function(){return new imposter.requestResponse()};
	this.copyHandler = endpoint.copyHandler || function(){return new imposter.requestResponse()};
	this.moveHandler = endpoint.moveHandler || function(){return new imposter.requestResponse()};
	this.lockHandler = endpoint.lockHandler || function(){return new imposter.requestResponse()};
	this.unlockHandler = endpoint.unlockHandler || function(){return new imposter.requestResponse()};
	this.mkcol = endpoint.mkcolHandler || function(){return new imposter.requestResponse()};
	this.propfind = endpoint.propfindHandler || function(){return new imposter.requestResponse()};
	this.proppatch = endpoint.proppatch || function(){return new imposter.requestResponse()};
	this.checkAuthorization = endpoint.checkAuthorization || function(){return new imposter.requestResponse()};
}


imposter.loadFile = function(file)
{
	response = new imposter.requestResponse();
	try
	{
		imposter.server.stop();
		var txtFile = new XMLHttpRequest();
		txtFile.open("GET", file, false);
		txtFile.send(null)
		response.data = txtFile.responseText; 
		imposter.server.start();
	}
	catch(exception)
	{
		response.success = false;
		response.message = 	exception.message;
	}
	return response;
	
	
}


imposter.createImposter = function(callback)
{	
	imposter.server = new MockHttpServer();
	imposter.server.handle = function (request) 
	{
		var url = imposter.extractBaseUrlFromString(request.url).data;
		
		//check to see if the endpoint passed in this request is registered with imposter
		var endPoint = imposter.endpoints('contains',url);
		request.endpoint = endPoint.data;
		if(endPoint.data != null && endPoint.data.active && imposter.active)
		{		
			var result = new imposter.requestResponse();
			
			//first check the authorization of this request
			var authorized = endPoint.data.checkAuthorization(request);
			
			if(!authorized.success)
			{
				result.data = authorized.data;
				result.success = false;
			}
			else
			{
				try
				{
					//pass the request onto the plugin that will handle it. The method will pass back a modified request
					request = endPoint.data[request.method.toLowerCase()+'Handler'](request);
					
					if(request.loadedTemplate == null)
					{
						throw new Error("Method "+request.method+" did not return a JSON template file to use.");
					}
					result.data = imposter.loadFile(endPoint.data.templatePath+''+request.loadedTemplate).data;
					//run the returned JSON template through the template parser to replace matched entities with passed in values
									
					result.data = imposter.replaceTemplateEntitiesByTag(request,JSON.parse(result.data));
				
					//transform result data back into raw string
					result.data = JSON.stringify(result.data);				
				}
				catch(exception)
				{
					result.data = JSON.stringify(exception.message);
				}
			}
		
			request.receive(result.status, result.data);
		}
		else
		{
			console.log('Mapping for this url does not exist. Sending real response');
			imposter.server.stop();	
		}
	
	};		
	imposter.server.start();
	
	return imposter;

}

//After we receive json data, we want to be able to replace parts of that JSON with params passed in the url to customize the responses
//to be more like what we'd expect to receive from an actual living breahting API
imposter.replaceTemplateEntitiesByKeyName = function(request,jsonData)
{
	for (var key in jsonData) {
		if (jsonData.hasOwnProperty(key)) 
		{
			if(typeof jsonData[key] === 'object')
			{
				jsonData[key] = imposter.replaceTemplateEntitiesByKeyName(request,jsonData[key])
			}
			else
			{
				if(request.urlParts.queryKey.hasOwnProperty(key))
				{
					jsonData[key] = request.urlParts.queryKey[key];
				}
			}
		}
	}	
	
	return jsonData;
}

imposter.replaceTemplateEntitiesByTag = function(request,jsonData)
{
	for (var key in jsonData) {
		if (jsonData.hasOwnProperty(key)) 
		{
			if(typeof jsonData[key] === 'object')
			{
				jsonData[key] = imposter.replaceTemplateEntitiesByTag(request,jsonData[key])
			}
			else
			{
				if(String(jsonData[key]).trim().substring(0,6) == '<param')
				{
					try
					{
						var div = document.createElement('div');
						div.innerHTML = jsonData[key];
						var elements = div.childNodes[0];
						if(request.urlParts.queryKey.hasOwnProperty(elements.getAttribute("queryparam")))
						{
							jsonData[key] = request.urlParts.queryKey[elements.getAttribute("queryparam")];	
						}
						else if(elements.getAttribute("default") != null)
						{
							jsonData[key] = elements.getAttribute("default");
						}
						else
						{
							jsonData[key] = 'Value missing';
						}
					}
					catch(exception)
					{
						jsonData[key] = 'Error parsing template value: ' + exception.message;	
					}
				}
			}
		}
	}	
	
	return jsonData;
}

//pass in the generated result, and mirror of that object with the properties you wish to verify
imposter.compareJsonObjects = function(actual,expected,skipMissingKeys,warnings,path)
{
	warnings = warnings != null ? warnings : new Array();
	path = path != null ? path : 'root';
	

	for (var key in expected) 
	{
		keyname = imposter.isNumber(key) ? path + '->element_' +key : path + '->' + key;
		
		if (expected.hasOwnProperty(key)) 
		{
			if(typeof expected[key] === 'object')
			{
				warnings.concat(imposter.compareJsonObjects(actual[key],expected[key],skipMissingKeys,warnings,keyname))
			}
			else
			{
				if(!actual.hasOwnProperty(key) && !skipMissingKeys)
				{
					warnings.push('Key missing in actual that occures in expected. Missing Key ' + key + '. Actual value '+actual[key]);
				}
				if(actual[key] != expected[key])
				{
					console.log(expected[key]);
					warnings.push('Key mismatch at [' + keyname + '] key. Expected value: ' + imposter.escapeHtml(expected[key]) + ' actual value '+imposter.escapeHtml(actual[key]));
				}
			}
		}
	}	
	
	return warnings;
}

imposter.runUnitTest = function(expectedTemplate,actual)
{
	response = new imposter.requestResponse();
	try
	{
		
		var results = new Array();
		var namespace = expectedTemplate.split('.')[0];
		var template = expectedTemplate.substring(expectedTemplate.indexOf('.')+1,expectedTemplate.length);
		if(template != null)
		{
			var expected = JSON.parse(imposter.loadJsonTemplate(namespace,template).data);	
			var actual = JSON.parse(actual);			
			response.data = imposter.compareJsonObjects(actual,expected,true);
		}
	}
	catch(exception)
	{
		response.success = false;
		response.message = 	exception.message + '. Tried to load file ' + namespace + '.' + template;
	}
	return response;	

}

imposter.escapeHtml = function(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
imposter.isNumber =function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
imposter.loadJsonTemplate = function(namespace,template)
{
	response = new imposter.requestResponse();
	try
	{
		if(!imposter.registeredEndpoints.hasOwnProperty(namespace))
		{
			throw new Error("namespace '"+namespace+"' has not been registered with imposter. Please ensure plugin has been included and namespace is set properly");
		}
		var endPoint = imposter.registeredEndpoints[namespace];
		var fileData = imposter.loadFile(endPoint.templatePath+''+template);
		
		if(fileData.success)
		{
			response.data = fileData.data;	
		}
		else
		{
			throw new Error(fileData.message);	
		}
		
	}
	catch(exception)
	{
		response.success = false;
		response.message = 	exception.message;
	}
	return response;
}

function MockHttpRequest () {
    // These are internal flags and data structures
    this.error = false;
    this.sent = false;
    this.requestHeaders = {};
    this.responseHeaders = {};
	this.loadedTemplate = null;
	this.endpoint = {};
}
MockHttpRequest.prototype = {

    statusReasons: {
        100: 'Continue',
        101: 'Switching Protocols',
        102: 'Processing',
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        203: 'Non-Authoritative Information',
        204: 'No Content',
        205: 'Reset Content',
        206: 'Partial Content',
        207: 'Multi-Status',
        300: 'Multiple Choices',
        301: 'Moved Permanently',
        302: 'Moved Temporarily',
        303: 'See Other',
        304: 'Not Modified',
        305: 'Use Proxy',
        307: 'Temporary Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Time-out',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Request Entity Too Large',
        414: 'Request-URI Too Large',
        415: 'Unsupported Media Type',
        416: 'Requested range not satisfiable',
        417: 'Expectation Failed',
        422: 'Unprocessable Entity',
        423: 'Locked',
        424: 'Failed Dependency',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Time-out',
        505: 'HTTP Version not supported',
        507: 'Insufficient Storage'
    },

    /*** State ***/

    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4,
    readyState: 0,


    /*** Request ***/

    open: function (method, url, async, user, password) {
        if (typeof method !== "string") {
            throw "INVALID_METHOD";
        }
        switch (method.toUpperCase()) {
        case "CONNECT":
        case "TRACE":
        case "TRACK":
            throw "SECURITY_ERR";

        case "DELETE":
        case "GET":
        case "HEAD":
        case "OPTIONS":
        case "POST":
        case "PUT":
            method = method.toUpperCase();
        }
        this.method = method;

        if (typeof url !== "string") {
            throw "INVALID_URL";
        }
        this.url = url;
        this.urlParts = this.parseUri(url);

        if (async === undefined) {
            async = true;
        }
        this.async = async;
        this.user = user;
        this.password = password;

        this.readyState = this.OPENED;
        this.onreadystatechange();
    },

    setRequestHeader: function (header, value) {
        header = header.toLowerCase();

        switch (header) {
        case "accept-charset":
        case "accept-encoding":
        case "connection":
        case "content-length":
        case "cookie":
        case "cookie2":
        case "content-transfer-encoding":
        case "date":
        case "expect":
        case "host":
        case "keep-alive":
        case "referer":
        case "te":
        case "trailer":
        case "transfer-encoding":
        case "upgrade":
        case "user-agent":
        case "via":
            return;
        }
        if ((header.substr(0, 6) === "proxy-")
            || (header.substr(0, 4) === "sec-")) {
            return;
        }

        // it's the first call on this header field
        if (this.requestHeaders[header] === undefined)
          this.requestHeaders[header] = value;
        else {
          var prev = this.requestHeaders[header];
          this.requestHeaders[header] = prev + ", " + value;
        }

    },

    send: function (data) {
        if ((this.readyState !== this.OPENED)
            || this.sent) {
            throw "INVALID_STATE_ERR";
        }
        if ((this.method === "GET") || (this.method === "HEAD")) {
            data = null;
        }

        //TODO set Content-Type header?
        this.error = false;
        this.sent = true;
        this.onreadystatechange();

        // fake send
        this.requestText = data;
        this.onsend();
    },

    abort: function () {
        this.responseText = null;
        this.error = true;
        for (var header in this.requestHeaders) {
            delete this.requestHeaders[header];
        }
        delete this.requestText;
        this.onreadystatechange();
        this.onabort();
        this.readyState = this.UNSENT;
    },


    /*** Response ***/

    status: 0,
    statusText: "",

    getResponseHeader: function (header) {
        if ((this.readyState === this.UNSENT)
            || (this.readyState === this.OPENED)
            || this.error) {
            return null;
        }
        return this.responseHeaders[header.toLowerCase()];
    },

    getAllResponseHeaders: function () {
        var r = "";
        for (var header in this.responseHeaders) {
            if ((header === "set-cookie") || (header === "set-cookie2")) {
                continue;
            }
            //TODO title case header
            r += header + ": " + this.responseHeaders[header] + "\r\n";
        }
        return r;
    },

    responseText: "",
    responseXML: undefined,

    onload: function () {
        // Instances should override this.
    },

    onprogress: function () {
        // Instances should override this.
    },

    onerror: function () {
        // Instances should override this.
    },

    onabort: function () {
        // Instances should override this.
    },

    onreadystatechange: function () {
        // Instances should override this.
    },


    /*** Properties and methods for test interaction ***/

    onsend: function () {
        // Instances should override this.
    },

    getRequestHeader: function (header) {
        return this.requestHeaders[header.toLowerCase()];
    },

    setResponseHeader: function (header, value) {
        this.responseHeaders[header.toLowerCase()] = value;
    },

    makeXMLResponse: function (data) {
        var xmlDoc;
        var mimetype = this.getResponseHeader("Content-Type");
        mimetype = mimetype && mimetype.split(';', 1)[0];
        if ((mimetype == null) || (mimetype == 'text/xml') ||
           (mimetype == 'application/xml') ||
           (mimetype && mimetype.substring(mimetype.length - 4) == '+xml')) {
            // Attempt to produce an xml response
            // and it will fail if not a good xml
            try {
                if (window.DOMParser) {
                    var parser = new DOMParser();
                    xmlDoc = parser.parseFromString(data, "text/xml");
                } else { // Internet Explorer
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(data);
                }
            } catch (e) {
                xmlDoc = null;
            }
            // parse errors also yield a null.
            if ((xmlDoc && xmlDoc.parseError && xmlDoc.parseError.errorCode != 0)
                || (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName == "parsererror")
                || (xmlDoc && xmlDoc.documentElement && xmlDoc.documentElement.nodeName == "html"
                    &&  xmlDoc.documentElement.firstChild &&  xmlDoc.documentElement.firstChild.nodeName == "body"
                    &&  xmlDoc.documentElement.firstChild.firstChild && xmlDoc.documentElement.firstChild.firstChild.nodeName == "parsererror")) {
                xmlDoc = null;
            }
        } else {
            // mimetype is specified, but not xml-ish
            xmlDoc = null;
        }
        return xmlDoc;
    },

    // Call this to simulate a server response
    receive: function (status, data) {
        if ((this.readyState !== this.OPENED) || (!this.sent)) {
            // Can't respond to unopened request.
            throw "INVALID_STATE_ERR";
        }

        this.status = status;
        this.statusText = status + " " + this.statusReasons[status];
        this.readyState = this.HEADERS_RECEIVED;
        this.onprogress();
        this.onreadystatechange();

        this.responseText = data;
        this.responseXML = this.makeXMLResponse(data);

        this.readyState = this.LOADING;
        this.onprogress();
        this.onreadystatechange();

        this.readyState = this.DONE;
        this.onreadystatechange();
        this.onprogress();
        this.onload();
    },

    // Call this to simulate a request error (e.g. NETWORK_ERR)
    err: function (exception) {
        if ((this.readyState !== this.OPENED) || (!this.sent)) {
            // Can't respond to unopened request.
            throw "INVALID_STATE_ERR";
        }

        this.responseText = null;
        this.error = true;
        for (var header in this.requestHeaders) {
            delete this.requestHeaders[header];
        }
        this.readyState = this.DONE;
        if (!this.async) {
            throw exception;
        }
        this.onreadystatechange();
        this.onerror();
    },

    // Convenience method to verify HTTP credentials
    authenticate: function (user, password) {
        if (this.user) {
            return (user === this.user) && (password === this.password);
        }

        if (this.urlParts.user) {
            return ((user === this.urlParts.user)
                    && (password === this.urlParts.password));
        }

        // Basic auth.  Requires existence of the 'atob' function.
        var auth = this.getRequestHeader("Authorization");
        if (auth === undefined) {
            return false;
        }
        if (auth.substr(0, 6) !== "Basic ") {
            return false;
        }
        if (typeof atob !== "function") {
            return false;
        }
        auth = atob(auth.substr(6));
        var pieces = auth.split(':');
        var requser = pieces.shift();
        var reqpass = pieces.join(':');
        return (user === requser) && (password === reqpass);
    },

    // Parse RFC 3986 compliant URIs.
    // Based on parseUri by Steven Levithan <stevenlevithan.com>
    // See http://blog.stevenlevithan.com/archives/parseuri
    parseUri: function (str) {
        var pattern = /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
        var key = ["source", "protocol", "authority", "userInfo", "user",
                   "password", "host", "port", "relative", "path",
                   "directory", "file", "query", "anchor"];
        var querypattern = /(?:^|&)([^&=]*)=?([^&]*)/g;

        var match = pattern.exec(str);
		var uri = {};
		var i = 14;
	    while (i--) {
            uri[key[i]] = match[i] || "";
        }
		uri.endPoint = uri.source.split('?')[0];
		uri.templateLoaded = null;
	    uri.queryKey = {};
	    uri[key[12]].replace(querypattern, function ($0, $1, $2) {
		    if ($1) {
                uri.queryKey[$1] = $2;
            }
	    });

	    return uri;
    }
};

function MockHttpServer (handler) {
    if (handler) {
        this.handle = handler;
    }
};
MockHttpServer.prototype = {

    start: function () {
        var self = this;

        function Request () {
            this.onsend = function () {
                self.handle(this);
            };
            MockHttpRequest.apply(this, arguments);
        }
        Request.prototype = MockHttpRequest.prototype;

        window.OriginalHttpRequest = window.XMLHttpRequest;
        window.XMLHttpRequest = Request;
    },

    stop: function () {
        window.XMLHttpRequest = window.OriginalHttpRequest;
    },

    handle: function (request) {
        // Instances should override this.
    }
};
