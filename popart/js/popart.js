var pictureRecords = new Object(); 
var userData = new Object(); 
var imageData = new Object();
var attachmentId;
var contestId;
var numpics = 0;
var canvas;
var context; 
var picasaMailAddr = '105399981347341202435.66sword2527@picasaweb.com';
var picasaUrl = 'https://picasaweb.google.com/105399981347341202435/DropBox';
        
$(document).ready(function()
{
                               
    $( "input:submit, input:button, button", "#submitControls,#picasaShare,#uploadNoticeBox, #sharePanel" ).button();
  
    loader(true);
    
    if($.cookie('artMashUser') != null)
    {
        userData = jQuery.parseJSON($.cookie('artMashUser'));
        $('#submitterName').val(userData.name);
        $('#submitterEmail').val(userData.email);
    }
    else
    {
        userData.email = '';
        userData.name = '';
        writeCookie();
    }
             
    $('#submitConfirm').dialog({
        autoOpen: false,
        modal: true,
         close: function(event, ui){
            $('#submitControls').show();
            $('#progressbar').hide();
            $('#resultsMessage').hide();
            $('#sharePanel').hide();
        }
    });   

    $('#shareOnPicasa').dialog({
        autoOpen: false
    });  

    $('#uploadNoticeBox').dialog({
        autoOpen: false
    });  
        
   
    $( "#progressbar" ).progressbar({
        value: 10
    });

    canvas = document.getElementById("pictureCanvas");
    context = canvas.getContext("2d"); 
            
    loadContestList();
});

function registerSlider()
{

    $("div#makeMeScrollable").smoothDivScroll({});

}
function loadContestList()
{
    artMashExtensions.getContests(function(result, event)
    {
        if (event.status)
        {
            //Since we dont want people to select what contest
            //they are using in this version just set the contest ID
            //to the first available one.
            
            console.log(result.sObjects[0]);
            contestId = result.sObjects[0].Id;
            picasaMailAddr = result.sObjects[0].Picasa_Dropbox_Email__c;
            picasaUrl = result.sObjects[0].Picasa_Dropbox_URL__c;
            loadPictures(contestId);      
        } 
    
    }, {escape:true});        
              
}

function loadPictures(contestId, callback)
{
    artMashExtensions.getPictures(contestId, function(result, event)
    {
        if (event.status)
        {
             pictureRecords = result.sObjectMap;
             numpics =  result.sObjects.length;       
             
             for(var i=0, len=result.sObjects.length; i<len; ++i)
             {
                 getPictureBody(result.sObjects[i].Current_Picture_Document_Id__c, result.sObjects[i].Id,  function(result,documentId,picId)
                 {             
                     $('#imageGallery').append('<img  onClick="setImage(\''+picId+'\',\''+documentId+'\',true);" width="148" class="thmbImage" height="127" id="X'+picId+'" src="data:image/png;base64,'+result+'"/>');                    
                       $("#X"+picId).mouseover(function () {
                              $(this).effect("bounce", { times:3, distance: 15 }, 300);
                        });                       
                      setDefaultImage();
                 });           
             }                                                  
        }    
    }, {escape:true});  
}

function setDefaultImage()
{
    numImages =  $("#imageGallery img").length;
    if(numImages > 0)
    {
       loadContent();
    }
    
   
   
   
}
function loadContent()
{   
    
    //I dont know of a better way to get the first element from
    //an object when you dont know the keynames ahead of time, so this works
    for(picture in pictureRecords)
    {
        setImage(pictureRecords[picture].Id,true);
        break;
    }         


    
}

function getPictureBody(documentId,picId,callback)
{   

    //When we attempt to get the base64 data, see if we already have it cached. If so,
    //just use that. if not, then query SF and get it.
    
    if(documentId in imageData)
    {
        callback(imageData[documentId],documentId,picId);
    }
    else
    {    
        artMashExtensions.getDocumentFileBody(documentId, function(result, event)
        {
            if (event.status)
            {
               imageData[documentId] = result;
               callback(result,documentId,picId);                            
            } 
        
        }, {escape:true}); 
    }     
}    
function setImage(image,useDefault,textString)
{ 
             
   loader(true);
   thisPic = pictureRecords[image];
       
   $('#pictureId').val(thisPic.Id);
            
        var background = document.getElementById('X'+image);

        
        if(background != null)
        {
            var width = background.naturalWidth;
            var height = background.naturalHeight;   
                      
            canvas.width = width;
            canvas.height = height;      
                            
            context.drawImage(background, 0, 0);
                         
            context.font = thisPic.Font_Size__c+"px " + thisPic.Font_Family__c;
            context.fillStyle = thisPic.Text_Color__c;
            
            //if we want to use the default text, the override anything passed in
            //with the default of this photo
            if(useDefault)
            {    
                textString = thisPic.Default_Text__c;
            }
               
            var phrases = getLines(context,textString,thisPic.Text_Box_Width__c,context.font) ;
           
            var yPos = parseInt(thisPic.Text_Box_Top_Offset__c) + parseInt(thisPic.Font_Size__c,10);
            
            for(i =0; i < phrases.length; i++)
            {
                context.fillText(phrases[i], thisPic.Text_Box_Left_Offset__c, yPos );
                yPos = parseInt(yPos,10) + parseInt(thisPic.Font_Size__c,10) + parseInt(2,10) ;
            }       
    }        
    loader(false);
  
}


function getLines(ctx,phrase,maxPxLength,textStyle) 
{
    var wa=phrase.split(" "),
        phraseArray=[],
        lastPhrase="",
        l=maxPxLength,
        measure=0;
    ctx.font = textStyle;
    for (var i=0;i<wa.length;i++) {
        var w=wa[i];
        measure=ctx.measureText(lastPhrase+w).width;
        if (measure<l) {
            lastPhrase+=(" "+w);
        }else {
            phraseArray.push(lastPhrase);
            lastPhrase=w;
        }
        if (i===wa.length-1) {
            phraseArray.push(lastPhrase);
            break;
        }
    }
    return phraseArray;
}

function submitCaption()
{  
    $( "#progressbar" ).show();
    $( "#submitControls" ).hide();

    userData.name =    $('#submitterName').val();
    userData.email =   $('#submitterEmail').val();    
    
    writeCookie();
    
    $( "#progressbar" ).progressbar( "value" , 15 );
    
    var str = $("#captionForm").serialize();
    str = str + "&";
    str = str + $("#userDataForm").serialize();    
    
    console.log(str);
    
    str = str + "&img="+canvas.toDataURL();
    
    $( "#progressbar" ).progressbar( "value" , 25 );
    artMashExtensions.createCaption(str, function(result, event)
    {
        $( "#progressbar" ).progressbar( "value" , 75 );
        if (event.status)
        {     
             //Set the last attachment Id as the one created in this upload.
             //Used for sharing to Picasa
             attachmentId =  result.data;
               
             $( "#progressbar" ).progressbar( "value" , 100 );
             
             $( "#progressbar" ).hide();
             
             if(result.success == 'true' || result.success == true)
             {
                 $( "#resultsMessage" ).html('<p>Your artwork has been uploaded to the Appirio Pop Art Gallery! Click <a href="'+picasaUrl+'" target="_blank">here</a> to check out all of the submissions.<p>');
                 $( "#sharePanel" ).show();
                 
                 uploadPicasa();
             }
             else
             {
                 console.log(result);
                 $( "#resultsMessage" ).html('<p>Hm, there was an error posting your caption. Please try again later.</p>');
                 $( "#sharePanel" ).hide();
             }
        } 
    
    }, {escape:true});    
    $( "#progressbar" ).progressbar( "value" , 50 );
}

function uploadPicasa()
{
     console.log('uploading to' +picasaMailAddr);

        artMashExtensions.SendToPicasa(attachmentId,picasaMailAddr, function(result, event)
        {
            $( "#progressbar" ).progressbar( "value" , 75 );
            if (event.status)
            {
                //$('#uploadNoticeBox').dialog('open');
                console.log(result);
            } 
        
        }, {escape:true});    
  
}

function writeCookie()
{
    var jsonData = JSON.stringify(userData);
    $.cookie('artMashUser', jsonData, { expires: 7 });
}

function trimCaption(text)
{
    if(text.length > pictureRecords[$('#pictureId').val()].Maximum_Caption_Length__c)
    {
        text = text.substring(0, pictureRecords[$('#pictureId').val()].Maximum_Caption_Length__c);
    }
    $('#captionText').val(text);
}

function loader(loading)
{
    if(loading)
    {
        $('#pictureCanvas').hide();
        $('#loader').show();
    }
    else
    {
        $('#pictureCanvas').show();
        $('#loader').hide();    
    }
}

