/*kunoichi 1.0
  The lean javascript only box.com uploader
  Author: Daniel Llewellyn (Kenji776)
  Date: 10/16/2012
  
  Description: jQuery plugin for providing a completly javascript based
               box.com upload application
			   
*/
var detailsWindowTimer;
var detailsWindow;
var uploadResult;
var interval;
	
(function( $ ){

  $.fn.kunoichi = function( options ) {  

    // Create some defaults, extending them with any settings that were provided
    var settings = $.extend( {
      'cookieName'         : 'Kunoichi', //the name of the cookie that will be used to store the box auth token
	  'spinnerImage'       : 'shuriken_grey_bg.png', //the image that will be used as an ajax spinner. Don't use an animated gif. CSS transform is used to rotate
	  'apiKey'             : 'j19t7wyi9cjxrqcfquhfe9wnyb9z01qk', //the API key to your box app that provides authentication
	  'boxUploadUrl'       : 'https://upload.box.net/api/1.0/upload', //the upload endpoint
	  'boxUserAuthUrl'     : 'https://m.box.net/api/1.0/auth/', //the authorization endpoint
	  'ticket'             : null, //the users ticket. You can pass one in if you already have one for some reason
	  'token'              : null, //the users token. You can pass one in if you have one already
	  'folderId'           : 0,   //the id of the folder to upload to. 0 is the root folder that everyone is guarenteed to have.
	  'uploadComplete'     : null, //the function to call when the upload is complete
	  'error'              : null, //the function to call if an error occures
    }, options);


    return this.each(function() { 
		try
		{ 
			//put the settings in a public property
				  
			$.fn.kunoichi.settings = settings;
			$.fn.kunoichi.settings.form = this;
			
			//create the 'ajax' spinner
			$('#'+this.id + ' :submit').after('<div class="kunoichi_loader_container" style="display:inline-block;display:none;"><img src="'+settings.spinnerImage+'"  class="kunoichi_loader" style="display:none;margin-left:10px;display:inline-block;vertical-align:middle;margin-top:-5px;" /><label style="display:inline-block">Uploading Please Wait</label></div><div style="clear:both"></div>');

			//hide the upload field since we arn't authorized to box to upload yet.
			//we'll show it agian once auth happens.
			$(this).hide();
	
			//rig up the upload button to upload the file to box.
			$('#'+this.id + ' :submit').click(function(event){
				event.preventDefault();		
				$.fn.kunoichi.uploadFile(settings.folderId);
			});
					
			//get the token from the cookie if one was not passed in
			//this might still be null, but we'll check for that later.
			if(settings.token == null)
			{
				settings.token = $.cookie(settings.cookieName);
			}
						
			//if the token is still null even after looking at the passed in token, and the cookie that means we
			//still dont' have one. So we better get one by hitting the get ticket url, then exchange that ticket for an auth token.			
			if(settings.token == null)
			{
				//use the yahoo query proxy to get a ticket which can be used to get a token.			
				$.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%20%3D%20'https%3A%2F%2Fwww.box.net%2Fapi%2F1.0%2Frest%3Faction%3Dget_ticket%26api_key%3D"+settings.apiKey+"'&format=json&diagnostics=true&callback=?", function(data) {
			
					//with the ticket in hand, open up an authorization window to box
					settings.ticket = data.query.results.response.ticket;
					detailsWindow = window.open (settings.boxUserAuthUrl+settings.ticket,"BoxTicketUrl"); 				
					detailsWindow.focus();
					
					//watch for the window to close. Once it has closed we can assume the user has authorized, so we can use the ticket we get before
					//to get an auth token.
					detailsWindowTimer = setInterval(function(settings){
						if (!detailsWindow || detailsWindow.closed)
						{ 
							clearInterval(detailsWindowTimer); //stop the timer
							$.fn.kunoichi.getAuthToken(settings);			
						}					
					},200); //Pollevery 200 miliseconds to see if the details window is open or closed		
				});
	
			}
			//if we already have an auth token, well then we can just go ahead and show the form.
			else if(settings.token!=null)
			{
				$.cookie(settings.cookieName,settings.token, { path: '/' });
				$(this).show();	
			}
		}
		catch(ex)
		{
			//if an error happens, trap it and return it.
			if(jQuery.isFunction(settings.error))
			{				
				settings.error(ex);	
			}			
		}	
	});

  };
})( jQuery );


$.fn.kunoichi.getAuthToken = function(){
	var settings = $.fn.kunoichi.settings;
	try
	{
		//use the yahoo query proxy to get a token once the auth window has been closed since the ticket is 
		//hopefully valid now (provided the user actually authenticated)
		$.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%20%3D%20'https%3A%2F%2Fwww.box.net%2Fapi%2F1.0%2Frest%3Faction%3Dget_auth_token%26ticket%3D"+settings.ticket+"%26api_key%3D"+settings.apiKey+"'&format=json&diagnostics=true&callback=?", function(data) {
	
			//write the cookie with the auth token
			$.cookie(settings.cookieName,data.query.results.response.auth_token, { path: '/' });
			$.fn.kunoichi.settings.token = data.query.results.response.auth_token
			
			$(settings.form).show();

		});	
	}
	catch(ex)
	{
		//if an error happens, trap it and return it.
		if(jQuery.isFunction(settings.error))
		{				
			settings.error(ex);	
		}			
	}		
}

$.fn.kunoichi.uploadFile = function(folder_id){
	var settings = $.fn.kunoichi.settings;
	try
	{
		//show the spinner while the uploaded progresses
		$.fn.kunoichi.ajaxSpinner(true);
		
		//build the upload endpoint url
		upload_url = settings.boxUploadUrl + '/' + settings.token + '/' + folder_id;	
			
		// get element representing file to be uploaded
		var file_input = $('#'+settings.form.id + " :file")[0];
		
		//extract the name of the file from the file input
		var fileName = $(file_input).val().split('\\');
		var file_name = fileName[fileName.length-1];
				
		//this is a custom hack for when using the styled file inputs. In this case the name of the file is not 
		//available in the regular input, so we grab it from the feedback div instead.
		if(file_name == null)
		{
			file_name = $('.customfile-feedback-populated').text();	
		}
		
		//create iframe containing a form whose input matches that presented to the user. Then submit that iframe.
		//this trick stops the user from getting redirected to the dumb XML dump that box gives you after a post.
		var iframe = $('<iframe id="upload_iframe" width="0" height="0" border="0" style="width: 0; height: 0; border: none;"></iframe>');
		$('body').append(iframe);	
		var iframe_form = $('<form method="post" enctype="multipart/form-data" action="' + upload_url + '">');
		iframe_form.append(file_input);
		iframe.contents().find('body').append(iframe_form);
		iframe_form.submit();
		
		// poll the iframe to detect when the file has been uploaded
		// the idea here being that since cross domain security will make us enable to access the iframe
		// after it posts to box, but we can read it while it's at our domain we can know when the upload is complete
		// by when the frame is no longer accessible.
		uploadResult = setInterval(function() 
		{
	
			try
			{
				if (document.getElementById('upload_iframe').contentWindow.location.href == undefined)
				{				
					//we don't need to keep checking. We know the upload is complete now.
					window.clearInterval(uploadResult);
					
					//the bummer here is since we can't access the frame's info, we don't know the ID of the uploaded document which
					//is provided in the XML response. But we do know the files name, and the folder so if we look in the folder for any file
					//with the same name, we can get the Id that way. Then we can return it to the plugin's callback.
					$.fn.kunoichi.getUploadedFile(file_name,folder_id,function(result){
						if(jQuery.isFunction(settings.uploadComplete))
						{
							//hide the spinner
							$.fn.kunoichi.ajaxSpinner(false);
							
							//return the results of the finding of the file
							settings.uploadComplete(result);						
						}		
					}); 	
				}
			}
			catch(ex)
			{
				//if an error happens, hide the spinner, trap it and return it.
				$.fn.kunoichi.ajaxSpinner(false);
				if(jQuery.isFunction(settings.error))
				{				
					settings.error(ex);	
				}				
			}
	
		}, 200);	
	}
	catch(ex)
	{
		//if an error happens, trap it and return it.
		if(jQuery.isFunction(settings.error))
		{				
			settings.error(ex);	
		}			
	}
}
//finds a file by name in the given folder
$.fn.kunoichi.getUploadedFile = function(file_name,folder_id,callback){
	var settings = $.fn.kunoichi.settings;
	try
	{
		var file = null;
		//use yahoo query API against box to try and find the file with the same name in the given folder.
		$.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%20%3D%20'https%3A%2F%2Fwww.box.net%2Fapi%2F1.0%2Frest%3Faction%3Dget_account_tree%26folder_id%3D"+folder_id+"%26auth_token%3D"+settings.token+"%26api_key%3D"+settings.apiKey+"%26params%5B%5D%3Donelevel%26params%5B%5D%3Dnozip'&format=json&diagnostics=true&callback=?", function(data) {
			//evaluate all the returned files (complex enough data tree structure for ya?)		
			console.log(data);	
			
			//this part is kind of goofy. If there is more tha one file in the folder it gets returned as a single object, so you can loop over it.
			//if there is only one file, then it is returned as a single object, so you can't loop it and trying to do so will cause an error. So 
			//we need to check the type and act accordingly.
			if($.isArray(data.query.results.response.tree.folder.files.file))
			{
				$.each(data.query.results.response.tree.folder.files.file, function(index, value) { 
					if(value.file_name == file_name)
					{
						callback(value);	
						return;
					}			  
				});
			}
			else
			{
				if(data.query.results.response.tree.folder.files.file.file_name == file_name)
				{
					callback(data.query.results.response.tree.folder.files.file);	
					return;					
				}
			}
		});		
	}
	catch(ex)
	{
		//if an error happens, trap it and return it.		
		callback(ex);		
	}
}

//Sets the description on a given file in box.
$.fn.kunoichi.setFileDescription = function(file_id,description,callback)
{
	var settings = $.fn.kunoichi.settings;
	try
	{
		//use yahoo query API against box to set the file description
		$.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20xml%20where%20url%20%3D%20'https%3A%2F%2Fwww.box.net%2Fapi%2F1.0%2Frest%3Faction%3Dset_description%26target%3Dfile%26target_id%3D"+file_id+"%26description%3D"+description.replace(' ','+')+"%26auth_token%3D"+settings.token+"%26api_key%3D"+settings.apiKey+"'&format=json&diagnostics=true&callback=?", function(data) {		
			//return the results of the call to the caller.	   
			callback(data.query.results.response);
		});		
	}
	catch(ex)
	{
		callback(ex);		
	}
}

//simple animated spinner using c33 transforms. Better than gifs. Also, couldn't find a high enough quality
//spinning shuriken, so I was just like 'eh lets just roate a good looking png file'. So i did.
$.fn.kunoichi.ajaxSpinner = function(active){
	if(active)
	{
		$('.kunoichi_loader_container').show();
		$('.kunoichi_loader_container').css('display','inline-block');
		//find the spinner image img tag and do some magic
		$('.kunoichi_loader').each(function(){
			var interval = null;
			var counter = 0;
			var $this = $(this);
			clearInterval(interval);

			//set an interval function to rotate the image a 2.2 degrees every 1 millisecond.
			//you can play with the counter variable to get the image spinning as fast or as slow as you want.
			//too fast looks crazy and might get choppy though.
			interval = setInterval(function(){
				
					counter -= 2.2;
					$this.css({
						MozTransform: 'rotate(-' + -counter + 'deg)',
						WebkitTransform: 'rotate(' + -counter + 'deg)',
						transform: 'rotate(' + -counter + 'deg)'
					});
				
			}, 1);
		});
	}	
	else
	{
		$('.kunoichi_loader_container').hide();
		$('.kunoichi_loader').each(function(){
			clearInterval(interval);
		});
	}	
}



