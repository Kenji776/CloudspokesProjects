//Sample Plugin For Imposter Mock API Testing
//Impliments some of the basic box.com calls

//create a new endpoint object. Imposter holds all the config data it needs in these kinds of objects for each endpoint
imposter.endpoints('add',new imposter.endPoint({	
		//setup the basic endpoint/API url. 
		url : 'https://api.box.com',
		
		//set the namespace for this object
		namespace: 'box',
		
		//location of the JSON templates for this endpoint
		templatePath: 'js/imposter/plugins/box/templates/',
		
		//now setup the actual event handlers. You can have an event handler for every kind of http verb. Just make the verb lowercase
		//and the word Handler in uppercase. Ex: postHandler, patchHandler, getHandler, etc.
		
		//Any get request destined for the url set above  will be directed to this main function. It gets passed all the request data. With that data we can run additional
		//logic to decide which file to deliver back to the caller. You can also modify request data here by modifying properties on the request object.
		getHandler: function(request){

			if(request.urlParts.path == '/2.0/folders/1234/items')
			{
				request.loadedTemplate = 'boxGetFolders.json';
			}
			
			return request;
		},
	
		//Any patch request destined for the url set above will be directed to this main function. It gets passed all the request data. With that data we can run additional
		//logic to decide which file to deliver back to the caller.	You can also modify request data here by modifying properties on the request object.
		patchHandler: function(request){
			return request;	
		},
	
		//Any post request destined for the url set above  will be directed to this main function. It gets passed all the request data. With that data we can run additional
		//logic to decide which file to deliver back to the caller. You can also modify request data here by modifying properties on the request object.	
		postHandler: function(request){	
			request.loadedTemplate = 'boxCreateFolder.json';
	
			return request;			
		},
	
		//Any delete request destined for the url set above will be directed to this main function. It gets passed all the request data. With that data we can run additional
		//logic to decide which file to deliver back to the caller. You can also modify request data here by modifying properties on the request object.	
		deleteHandler: function(request){
			return request;
		},		
		
		//check authorization is a special function is called by imposter before any other request is allowed to return. It must return a requestResult object with the success
		//property set to true for the actual endpoint to be invoked. Otherwise the text in the data property will be returned to the caller. The data property should contain valid JSON.
		checkAuthorization: function(request){
			requestResult = new imposter.requestResult();	
			if(!request.requestHeaders.hasOwnProperty('authorization'))
			{
				requestResult.data = imposter.loadFile(this.templatePath+'boxNoAuth.json').data;
			}	
			
			return requestResult;	
		}
	})
);

