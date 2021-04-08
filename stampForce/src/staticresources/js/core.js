    var refreshEvents = true;
    $(window).bind("load", function() {
      if(userData.id != undefined)
      {
         $.mobile.changePage('#events');  
      }
    });

    var userData = new Object();    
    var eventData = new Object();
    var eventId;
    var attendeeId;
     
    function setEventId(id)
    {
        eventId = id;
    }

    function setAttendeeId(id)
    {
        attendeeId = id;
    }
        
    $(document).ready(function() 
    {

		//load the cookie data
        if($.cookie('stampForceUser') != null)
        {
            userData = jQuery.parseJSON($.cookie('stampForceUser'));
            $('#login-email').val(userData.email);
        }
 
 		//set the content of the footers
		var footerString = '<h4>Stampforce by Appirio & Kenji776<br><a href="#signup">Register</a> | <a href="#login">Login</a></h4>';
		$('.footer').html(footerString);
	
        //register button action event handlers
        $('#signup-submit').click(function(){signupUser()}); 
        $('#login-submit').click(function(){loginUser()}); 
        $('#forgotPassword-submit').click(function(){forgotPassword()});  
        $('#create-submit').click(function(){createStampCode()});  
        $('#redeem-submit').click(function(){redeemStampCode($('#redeem-code').val())}); 
        $('#register-submit').click(function(){registerForEvent()});
        $('#give-submit').click(function(){giveStamp()});
 
              
        //register pageload event handlers
        $('#events').live('pageshow',function(event, ui){
          if(refreshEvents)
          {
              getUserEvents(function(){getEvents()});
              refreshEvents=false;
          }
        });        
        
        $('#stamps').live('pageshow',function(event, ui){
          getStamps();
        });   

        $('#qrCode').live('pageshow',function(event, ui)
        {
           $('#qrCodeText').html(userData.events[eventId].Name);	
           $('#qrcode').qrcode(userData.events[eventId].Name);
        });   
        
        $('#register').live('pageshow',function(event, ui)
        {
            var startDate = eventData[eventId].Start__c;
            var endDate = eventData[eventId].End__c;
            startDate = dateFormat(startDate, "ddd mmm dS h:MM TT");
            endDate = dateFormat(endDate, "h:MM TT");        	
            var data = '<span class="title">'+eventData[eventId].Title__c+'</span><span class="title">'+startDate+ ' - ' +endDate+'</span><p>'+ $('#address-'+eventId).html() + '</p><p>' + $('#description-'+eventId).html() + '</p>';
            
        	$('#registerData').html(data);
        });

        $('#createStamp').live('pageshow',function(event, ui){
           $('#createCompanyName').html(userData.companyName);
        });         
         
           
        $(".dataForm").validate();        
    });

    function writeCookie()
    {
        var jsonData = JSON.stringify(userData);
        $.cookie('stampForceUser', jsonData, { expires: 7 });
    }
    
    function signupUser()
    {
        if($('#signup-form').valid( ))
        {
            $.mobile.showPageLoadingMsg();
            var str = $("#signup-form").serialize();
            stampForce.registerUser(str, function(result, event)
            {
                if (event.status)
                {        
                    if(result.success == true || result.success == 'true')
                    {       
                        $.mobile.changePage('#signup-success'); 
                    }
                    else
                    {
                        $('#signupResult').html(result.message + '. ' + result.data);
                    } 
                    $.mobile.hidePageLoadingMsg();    
                } 
            
            }, {escape:true});
        }              
    }
    
    function registerForEvent()
    {
        $.mobile.showPageLoadingMsg();
        $('#regiserResult').html(null);
        stampForce.registerUserForEvent(userData.id, eventId, function(result, event)
        {
            if (event.status)
            {        
                if(result.success == true || result.success == 'true')
                {       
                   $('#events-list').html(null);
                    refreshEvents = true;
                    $('#regiserResult').html('You have succesfully registered for this event! You may now being collecting stamps. <a href="#events">Continue</a>'); 
                    $.mobile.changePage('#events'); 
                }
                else
                {
                    $('#regiserResult').html(result.message + '. ' + result.data);
                } 
                $.mobile.hidePageLoadingMsg();    
            } 
        
        }, {escape:true});     
    }
    function createStampCode()
    {   
        $.mobile.showPageLoadingMsg();
        $('#getResult').html(null);
        stampForce.createStampCode(userData.company, userData.id, eventId, function(result, event)
        {
            if (event.status)
            {                
                if(result.success == true || result.success == 'true')
                {
                    
                    $('#createStampOutput').html(result.message + '. ' + result.data);
                     if(eventData[eventId].Enable_QR_Codes__c)
                     {
                        $('#qrcodeGen').qrcode(result.data);
                     }
                }    
                else
                {
                    $('#createStampOutput').html(result.message + '. ' + result.data);
                }
                $.mobile.hidePageLoadingMsg(); 
            } 
        
        }, {escape:true});              
    }
    
    function redeemStampCode(code)
    {
        
        if($('#redeem-form').valid( ))
        {   
            $.mobile.showPageLoadingMsg();
            stampForce.redeemStampCode(attendeeId, eventId, code, function(result, event)
            {
                if (event.status)
                {                   
                    if(result.success == true || result.success == 'true')
                    {                   
                        $('#redeemStampOutput').html(result.message + '. ' + result.data);
                         $.mobile.changePage('#stamps'); 
                    }    
                    else
                    {
                        $('#redeemStampOutput').html(result.message + '. ' + result.data);
                    }
                    $.mobile.hidePageLoadingMsg(); 
                } 
            
            }, {escape:true});   
        }   
    
    }

    function giveStamp()
    {        
        if($('#give-form').valid( ))
        {
            var giveToAttendeeId = $('#give-code').val();   
            $.mobile.showPageLoadingMsg();
            stampForce.giveStampToAttendee(giveToAttendeeId, userData.id, userData.company, function(result, event)
            {
                if (event.status)
                {                  
                    if(result.success == true || result.success == 'true')
                    {                   
                        $('#giveStampOutput').html(result.message + '. ' + result.data);
                    }    
                    else
                    {
                        $('#giveStampOutput').html(result.message + '. ' + result.data);
                    }
                    $.mobile.hidePageLoadingMsg(); 
                } 
            
            }, {escape:true});   
        }   
    
    }
        
    function getStamps()
    {
        $.mobile.showPageLoadingMsg();
        $('#getResult').html(null);
        stampForce.getStamps(userData.id, eventId, function(result, event)
        {
            if (event.status)
            {              
                if(result.success == true || result.success == 'true')
                {
                    if(result.sObjects.length > 0)
                    {
                        var html = "<table class='dataTable'>";
                        html +="<tr><th>Stamp Provided By</th><th>Sponsor Location</th><th>Required Action</th><th>Stamp</th>";
                        
                        for(var i = 0; i < result.sObjects.length; i ++)
                        {
                            html += "<tr><td>"+ result.sObjects[i].Sponsor__r.Company__r.Name +"</td><td>"+ result.sObjects[i].Sponsor__r.Location_Description__c +"</td><td>"+ result.sObjects[i].Sponsor__r.Stamp_Action_Description__c +"</td>";
                            if(result.sObjects[i].Status__c == 'Generated')
                            {
                                html += "<td><img src="+result.sObjects[i].Event__r.Missing_Stamp_Image__c+" /></td>";
                            }
                            else
                            {
                                if(result.sObjects[i].Sponsor__r.Stamp_Image_URL__c.length > 1)
                                {
                                    html += "<td><img src="+result.sObjects[i].Sponsor__r.Stamp_Image_URL__c+" /></td>";
                                }
                                else
                                {
                                    html += "<td><img src="+result.sObjects[i].Event__r.Default_Stamp_Image__c+" /></td>";
                                }
                            }
                        }
                        html += "</tr></table>";
                    }
                    else
                    {
                        var html = '<p>Awww, you don\'t have any stamps. Bummer. You should go collect some!</p>';
                    }
                    $('#stampList').html(html);
                    getUserEvents(function(){});
                }    
                else
                {
                    $('#getResult').html(result.message + '. ' + result.data);
                }
                $.mobile.hidePageLoadingMsg(); 
            } 
        
        }, {escape:true});        
    
    }
    
    function loginUser()
    {
         if($('#login-form').valid( ))
         {
            $.mobile.showPageLoadingMsg();
            $('#loginResult').html(null);
            var str = $("#login-form").serialize();
            refreshEvents = true;
            $('#events-list').html(null);
            stampForce.loginUser(str, function(result, event)
            {
                if (event.status)
                {
                    if(result.success == true || result.success == 'true')
                    {
                         userData.email = result.sObjects[0].Email__c;
                         userData.phone = result.sObjects[0].Phone__c;
                         userData.company = result.sObjects[0].Company__c;
                         userData.id = result.sObjects[0].Id;
                         userData.type = result.sObjects[0].Type__c;
                         userData.companyName =  result.sObjects[0].Company__r.Name;
                         userData.code = result.sObjects[0].Name;
                         writeCookie();
                         
                         if(userData.type == 'Sponsor')
                         {
                             $.mobile.changePage('#createStamp');
                         }
                         else
                         {
                             $.mobile.changePage('#events');
                         }
                    }    
                    else
                    {
                        $('#loginResult').html(result.message + '. ' + result.data);
                    }
                    $.mobile.hidePageLoadingMsg(); 
                } 
            
            }, {escape:true});
        }             
    }
    
    function getEvents()
    {
        $.mobile.showPageLoadingMsg();
        $('#events-list').html(null);
        stampForce.getEvents(function(result, event)
        {
            if (event.status)
            {      
                var html = '';
                eventData = result.sObjectMap; 
                if(result.success == true || result.success == 'true')
                {       
                    for(var i = 0; i < result.sObjects.length; i++)
                    {
                        var aId = null;
                        if(userData.events[result.sObjects[i].Id] !=undefined)
                        {
                            aId = userData.events[result.sObjects[i].Id].Id;
                        }
                        else
                        {
                        	aId = null;
                        }    
                        
                        var startDate = result.sObjects[i].Start__c;
                        var endDate = result.sObjects[i].End__c;
                        startDate = dateFormat(startDate, "ddd mmm dS h:MM TT");
                        endDate = dateFormat(endDate, "h:MM TT");
                        html += '<div data-role="collapsible" data-collapsed="true" id="event-'+result.sObjects[i].Id+'"><h3>'+result.sObjects[i].Title__c+' <span style="float:right;"> ' +startDate + ' - ' + endDate  + '</span></h3><p>';
                        
                        if(userData.type == 'Sponsor' || userData.type == 'Admin')
                        {
                            html += '<a href="#createStamp" onClick="setEventId(\''+result.sObjects[i].Id+'\');">Generate Code</a> |'; 
                        	html += '<a href="#giveStamp" onClick="setEventId(\''+result.sObjects[i].Id+'\');">Give Stamp</a> |';
                        }
                        if((userData.type == 'User' || userData.type == 'Admin') && aId != null)
                        {
                            html += '<a href="#stamps" onClick="setEventId(\''+result.sObjects[i].Id+'\');setAttendeeId(\''+aId+'\');" >View Stamps</a> | ';
                            html += '<a href="#addStamp" onClick="setEventId(\''+result.sObjects[i].Id+'\'); setAttendeeId(\''+aId+'\');">Redeem Stamp Code</a> | ';   
                            if(result.sObjects[i].Enable_QR_Codes__c)
                            {
                                html += '<a href="#qrCode" onClick="setEventId(\''+result.sObjects[i].Id+'\'); setAttendeeId(\''+aId+'\');">Attendee QR Code</a>'; 
                            }                    
                        }
                        else
                        {
                            html += '<a href="#register" onClick="setEventId(\''+result.sObjects[i].Id+'\')" >Register for this Event</a> ';
                        }
                        html += '</p><p id ="address-'+result.sObjects[i].Id+'">Location: ' + result.sObjects[i].Address__c + ', ' + result.sObjects[i].City__c+ ', ' + result.sObjects[i].State__c+ ' ' + result.sObjects[i].Postal_Code__c + '</p><p id ="description-'+result.sObjects[i].Id+'">'+result.sObjects[i].Description__c+'</p></div>';
                    }
                    $('#events-list').html(html);
                    
                    $("#events").page("destroy").page();
                }
                else
                {
                    $('#event-list').html(result.message + '. ' + result.data);
                }    
                $.mobile.hidePageLoadingMsg();  
            } 
        
        }, {escape:true});     
    }
    
    function getUserEvents(callback)
    {
        stampForce.getUsersRegisteredEvents(userData.id, function(result, event)
        {
            if (event.status)
            {                
                if(result.success == true || result.success == 'true')
                {
                     userData.events = new Object();
                     userData.events = result.sObjectMap;
                     
                     writeCookie();
                     
                }    
                else
                {
                }
                callback();
            } 
        
        }, {escape:true});             
    }