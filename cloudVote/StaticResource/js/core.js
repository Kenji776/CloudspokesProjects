    //stores data about the currently selected proposal
    var proposalData = new Object();
    
    //stores data about the currently logged in user
    var userData = new Object();
    userLoggedIn = false;
    
    var pageLog = new Array();
    var pageIndex = 0;
    var siteUrl = '{!siteUrl}';
    var pageName = '{!pageName}';
    


    function getUrlVars()
    {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
           
    function loadCategoriesList()
    {
        $.mobile.showPageLoadingMsg();
 
        cloudVote.getCategories('{!config.id}', function(result, event)
        {
            if (event.status)
            {
                var list = '<ul data-role="listview" data-theme="{!config.jQuery_Mobile_List_Theme__c}" data-filter="true">';
                var selectOptions = '';
                for(var categoryVal = 0; categoryVal < result.length; categoryVal++ )
                {
                    list += '<li><span class="ui-li-count">'+result[categoryVal].Number_of_Proposals__c+'</span><a href="javascript:loadProposalList(\''+result[categoryVal].Id+'\');">'+result[categoryVal].Name+'</a><li><p>'+result[categoryVal].Description__c+'</p></li></li>';
                    selectOptions += '<option value="'+result[categoryVal].Id+'">'+result[categoryVal].Name+'</option>';
                }            
                list += '</ul>';
                $('#categoryList').html(list);
                $('#proposalCategoryInput').html(selectOptions);
                try
                {
                    $("#categories").page("destroy").page();
                }
                catch(exception)
                {
                
                }
            } 
            else
            {
                document.getElementById("responseErrors").innerHTML = event.message;
            }
            
        }, {escape:true});   
        $.mobile.hidePageLoadingMsg();   
    }
    
    function addComment()
    {
        var comment = $('#addCommentInput').val();
  
        cloudVote.addComment(proposalData.Id,userData.Id, comment,function(result, event)
        {
            if (event.status)
            {
                
                getComments(proposalData.Id, function(comments)
                {
                     $('#commentsContianer').html(null);
                     var commentList = '<ul data-role="listview" data-theme="{!config.jQuery_Mobile_List_Theme__c}">';
                     for(var i = 0; i < comments.length; i++ )
                     {  
                         commentList += '<li data-role="list-divider">' + comments[i].Contact__r.FirstName+' ' + comments[i].Contact__r.LastName + '</li><li><p>'+comments[i].Comment__c+'</p></li>'                    
                     }      
                     commentList += '</ul>';
                     $('#commentsContianer').html(commentList);
                     
                      $("#proposal").page("destroy").page();              
                });                    
            } 
            else
            {
                document.getElementById("responseErrors").innerHTML = event.message;
            }
            comment = $('#addCommentInput').val(null);
            
        }, {escape:true});           
    }
    
    function loadProposalList(categoryId)
    {           
            $.mobile.showPageLoadingMsg();
            cloudVote.getProposals(categoryId, function(result, event)
            {
                if (event.status)
                {
                    var list = '<ul data-role="listview" data-theme="{!config.jQuery_Mobile_List_Theme__c}" data-filter="true">';
                    for(var categoryVal = 0; categoryVal < result.length; categoryVal++ )
                    {
                        list += '<li><span class="ui-li-count">'+result[categoryVal].Score__c+'</span><a href="javascript:getProposal(\''+result[categoryVal].Id+'\');">'+result[categoryVal].Name+'</a> <li><p>'+result[categoryVal].Description__c+'</p> <p>Created By '+result[categoryVal].Contact__r.FirstName+' '+result[categoryVal].Contact__r.LastName+'</p></li> </li>';
                    }      
                    
                    if( result.length == 0 )
                    {
                        list += '<li>No Proposals in this category</li>';
                    }      
                    list += '</ul>';
                    $('#proposalList').html(list);
                     $.mobile.changePage('#proposals');
                     
                    $("#proposals").page("destroy").page();
                } 
                else
                {
                    document.getElementById("responseErrors").innerHTML = event.message;
                }
                
            }, {escape:true});             
            $.mobile.hidePageLoadingMsg();  
    }
    
    function getProposal(proposalId)
    {
        var alreadyVoted;      
        $.mobile.showPageLoadingMsg();
        $('#promoteButton').addClass('ui-disabled');
        $('#demoteButton').addClass('ui-disabled');        
        cloudVote.getProposal(proposalId, function(result, event)
        {
            if (event.status)
            {
                //disable the voting if the user is not logged in.

                var proposal = result[0];
                proposalData = proposal;
                $.mobile.changePage('#proposal',{transition: "pop"});
                $('#proposalHeader').html(proposal.Name);
                $('#proposalDescription').html(proposal.Description__c);
                $('#proposalCreatedBy').html(proposal.Contact__r.FirstName + ' ' + proposal.Contact__r.LastName);
                $('#proposalScore').html(proposal.Score__c);   
                
                getVotes(proposalData.Id, function(votes)
                {
                    $('#voterImages').html(null);
                    alreadyVoted = false;
                     for(var i = 0; i < votes.length; i++ )
                     {
                         if(votes[i].Contact__c == userData.Id)
                         {
                             alreadyVoted = true;                        
                         }           
                         $('#voterImages').append('<img src=" http://graph.facebook.com/'+votes[i].Contact__r.Facebook_ID__c+'/picture" title="'+votes[i].Contact__r.FirstName+' ' + votes[i].Contact__r.LastName +'" style="float:left; margin-left:3px">');
                         
                     }  
                    if(userLoggedIn == true && alreadyVoted == false)
                    {
                        $('#promoteButton').removeClass('ui-disabled');
                        $('#demoteButton').removeClass('ui-disabled');                       
                    }                     
                });           

                getComments(proposalData.Id, function(comments)
                {
                     $('#commentsContianer').html(null);
                     var commentList = '<ul data-role="listview" data-theme="{!config.jQuery_Mobile_List_Theme__c}">';
                     for(var i = 0; i < comments.length; i++ )
                     {  
                         commentList += '<li data-role="list-divider">' + comments[i].Contact__r.FirstName+' ' + comments[i].Contact__r.LastName + '</li><li><p>'+comments[i].Comment__c+'</p></li>'                    
                     }      
                     commentList += '</ul>';
                     $('#commentsContianer').html(commentList);
                     
                      $("#proposal").page("destroy").page();              
                });   
                                    
            } 
            else
            {
                document.getElementById("responseErrors").innerHTML = event.message;
            }
            $.mobile.hidePageLoadingMsg(); 
            
        }, {escape:true});        
         
    }

    function fb_login()
    {
        window.open ("https://www.facebook.com/dialog/oauth?client_id={!config.Facebook_App_ID__c}&redirect_uri=http://{!$Site.Domain}{!$Site.Prefix}/cv_fb_regFinish&scope=user_about_me,user_birthday,email,offline_access,publish_stream","mywindow","status=0,toolbar=0,width=1000,height=550,menubar=0");    
    }    
    
    function getVotes(proposalId, callback)
    {    
        cloudVote.getVotes(proposalId, function(result, event)
        {
            if (event.status)
            {
                    callback(result);                    
            } 
            else
            {
                callback(event.message);
            }
            
        }, {escape:true});        
    }

    function getComments(proposalId, callback)
    {    
        cloudVote.getComments(proposalId, function(result, event)
        {
            if (event.status)
            {
                    callback(result);                    
            } 
            else
            {
                callback(event.message);
            }
            
        }, {escape:true});        
    }    
    function castProposalVote(voteType)
    {
         $.mobile.showPageLoadingMsg();        
        cloudVote.castVote(proposalData.Id, userData.Id,voteType, function(result, event)
        {
            if (event.status)
            {
                    getProposal(proposalData.Id);
            } 
            else
            {
                document.getElementById("responseErrors").innerHTML = event.message;
            }
            $.mobile.hidePageLoadingMsg();    
        }, {escape:true});        
          
    }
    
    function shareProposal()
    {
         $.mobile.showPageLoadingMsg();
        cloudVote.sharePropOnFB(proposalData.Id, userData.Id, function(result, event)
        {
            if (event.status)
            {
                     $.mobile.changePage("#propShared", {transition: 'pop', role: 'dialog'}); 
            } 
            else
            {
                document.getElementById("responseErrors").innerHTML = event.message;
            }
            $.mobile.hidePageLoadingMsg();   
        }, {escape:true});          
    }
    

    
    function createProposal()
    {
         $.mobile.showPageLoadingMsg();
         $('#submitProposal').addClass('ui-disabled'); 
         var propName = $('#proposalNameInput').val();
         var categoryId = $('#proposalCategoryInput').val();
         var propDescription = $('#proposalDescriptionInput').val();

        cloudVote.createProposal(categoryId, userData.Id, propName, propDescription, function(result, event)
        {
            if (event.status)
            {
                    $.mobile.changePage("#propCreated", {transition: 'pop', role: 'dialog'}); 
                    $('#proposalNameInput').val(null);
                    $('#proposalCategoryInput').val(null);
                    $('#proposalDescriptionInput').val(null);
            } 
            else
            {
                document.getElementById("responseErrors").innerHTML = event.message;
            }
            $('#submitProposal').removeClass('ui-disabled'); 
            $.mobile.hidePageLoadingMsg();   
        }, {escape:true});        
                   
    }

$(document).ready(function()
{
    checkFBLoginStatus();
    
    loadCategoriesList();


    $('#categories').live('pageshow',function(event, ui){
      loadCategoriesList();
    });    

    $('#proposal').live('pageshow',function(event, ui){
        if(!proposalData.hasOwnProperty("Id"))
        {
            $.mobile.changePage("#home"); 
        }
    });  

    $('#add').live('pageshow',function(event, ui){
        if(!userData.hasOwnProperty("Id"))
        {
           $('#submitProposal').addClass('ui-disabled');      
        }
        else
        {
            $('#submitProposal').removeClass('ui-disabled');   
        }
    });  
    
    $('#home').live('pagecreate', function ()
    {
        if(getUrlVars()["prop"] != null)
        {
            getProposal(getUrlVars()["prop"]);
        }   
    });      

    
        
    var footerContent = " <div id='responseErrors'></div><div class='ui-body-{!config.jQuery_Mobile_NavBar_Theme__c}'><nav data-role='navbar'><ul  ><li><a href='#categories' data-icon='home'>Proposals</a></li><li><a href='#login' data-icon='star'>Login</a></li><li><a href='#about' data-icon='info'>About</a></li><li><a href='#add' data-icon='plus'>Add</a></li></ul></nav></div>";
     $('.foot').html(footerContent);    
});


function checkFBLoginStatus()
{
    var cookieData = $.cookie('{!config.Application_Name__c}_fb');

    if(cookieData == null)
    {
        $('#connectFBDone').hide();
        $('#connectFB').show();
        userLoggedIn = false;
    }
    else
    {
        userData =  jQuery.parseJSON(cookieData);
         $('#connectFB').hide();
         $('#connectFBDone').show();
         userLoggedIn = true;
    }
    try
    {
        $("#login").page("destroy").page();
    }
    catch(ex)
    {
    }
}