//Global object to hold the settings data. The data set here is just defaults
//used until the real settings are read from the config.txt file
var configObject = new Object();			

//Global object to hold ad conifg data. The data set here is just defaults
//used until the real settings are read from the ads.txt file
var adsArray = new Array();

//Global object to hold team data. The data set here is just defaults
//used until the real settings are read from the teams.txt file
var teamData = new Object();

//Just some tracking variables.
var adPosition = -1;
var currentTeam = -1;
var oldTeam = -1;
var adTimer = 0;

var showWinners = new  Array ();
showWinners[0] = false;
showWinners[1] = false;
showWinners[2] = false;
showWinners[3] = false;


//global variable to hold the reaload configs interval timer
var realoadMainConfigInterval;
var scrollAdInterval;

function readConfig()
{
	var d=new Date();
	var t=d.toLocaleTimeString();				
	console.log('Reloading configs at '+t);
	try
	{
		//clear the old timer interval so we don't end up with a recursive loop of madness
		realoadMainConfigInterval=window.clearInterval(realoadMainConfigInterval);
		var cacheKill=Math.floor(Math.random()*1000001)
		$.getJSON('configs/config.txt?cacheKill='+cacheKill, function(data) 
		{
			for(key in data)
			{
				configObject[key.toLowerCase()] = data[key];	
			}
		});						
		controlDisplayedViewState();
		setViewStateData(configObject.currentview);
		realoadMainConfigInterval = self.setInterval("readConfig()",configObject.refresh*1000);
	}
	catch(e)
	{
		console.log(e);
	}				
}

function controlDisplayedViewState()
{
	console.log('Viewstate is '+configObject.currentview);
	//the idea is to hide any viewstate that isn't the displayed one currently.
	$('#viewStatesContent').children('div').each(function(i) 
	{ 
		if(i+1 != configObject.currentview)
		{
			$(this).hide();	
		}
		else
		{
			$(this).show();		
		}
	});
	
}

//This fuction simple sets some data in the view state container box, and then calls the proper
//function that will populate the actual body of the container.
function setViewStateData(viewStateId)
{
	
	$('#viewStateHeader').html(configObject.title);
	$('.viewStateFooterPoweredBy').attr('src',configObject.poweredby);
	$('.viewStateFooterLogo').attr('src',configObject.logo);
	
	if(viewStateId == 1)
	{
		configAds();
	}
	else if(viewStateId == 2)
	{
		loadTeamData();
	}
	else if(viewStateId == 3)
	{
		loadWinnerData();
	}	

}

function configAds()
{
	
	
	var cacheKill=Math.floor(Math.random()*1000001)
	$.getJSON('configs/ads.txt?cacheKill='+cacheKill, function(data) 
	{
		adsArray.length = [];
		for(key in data.ADS)
		{
			adsArray.push(data.ADS[key]);	
			preloadImage(data.ADS[key]);
		}
		
		//if the ad timer is zero, lets immediatly call out to the adScroller to get an ad up on screen.
		//otherwise we have to wait for the timer to kick in.
		if(adTimer == 0)
		{
			adScroller();
		}
		//We only want to clear and reset the timer for the ad scroller if the value of the ad timer
		//has changed. Otherwise it will always changes as soon as the configs are loaded (i think)
		if(data.REFRESH != adTimer)
		{
			scrollAdInterval = window.clearInterval(scrollAdInterval);
			scrollAdInterval = self.setInterval("adScroller()",data.REFRESH*1000);
			adTimer = data.REFRESH;
		}
	});							
}

function adScroller()
{
	var d=new Date();
	var t=d.toLocaleTimeString();			
	console.log('There are ' +adsArray.length+' ads available');
	console.log('Cycling ad '+t+' refresh interval is '+adTimer+' seconds');
	var numAds = adsArray.length - 1;
	
	if(adPosition < numAds)
	{
		adPosition++;	
	}
	else
	{
		adPosition=0;
	}
	console.log('Loading ad position '+adPosition+'/'+numAds+' image path '+adsArray[adPosition]);
	$('#viewState1-adImg').fadeOut('slow', function() {	
							
		$('#viewState1-adImg').attr('src',adsArray[adPosition]);
		
		$('#viewState1-adImg').fadeIn('slow', function() {	
												  
		 });						
	 });				
}

//Function to get the data for teams and display it. Data is read from the teams.txt file
//and iterated over. You could potentially add more values to the teams and use it, since all values
//are assigned dynamically.
function loadTeamData()
{
	var cacheKill=Math.floor(Math.random()*1000001)
	$.getJSON('configs/teams.txt?cacheKill='+cacheKill, function(data) 
	{
		for(key in data)
		{
			//Preload team image for smooth transitioning later.
			preloadImage(data[key].IMG);
			if(data[key].SHOW == true)
			{
				currentTeam = key;
				console.log('Found team to show at '+key);
				
				
				for(teamDataPoint in data[key])
				{
					teamData[teamDataPoint.toLowerCase()] = data[key][teamDataPoint];
				}
			}
		}
		
	});	
	
	//Just for fun, if the team being displayed has changed, fade out the old team, and fade in the new one
	console.log(currentTeam + ' ' +oldTeam);
	if(currentTeam != oldTeam && oldTeam != -1)
	{
		$('#viewState2').fadeOut('slow', function() {	
			$('#viewState2-teamNameData').html(teamData.name);
			$('#viewState2-teamCamptainData').html(teamData.captain);
			$('#viewState2-teamDescription').html(teamData.description);
			$('#viewState2-teamLogoImg').attr('src',teamData.img);	
			$('#viewState2').fadeIn('slow', function() {	
													  
			 });						
		 });
	}
	else
	{
		$('#viewState2-teamNameData').html(teamData.name);
		$('#viewState2-teamCamptainData').html(teamData.captain);
		$('#viewState2-teamDescription').html(teamData.description);
		$('#viewState2-teamLogoImg').attr('src',teamData.img);		
	}
	oldTeam = currentTeam;
	console.log(teamData);
}

//Function to get the data about the winners and display it. It reads content from the configs/winners.txt file
//which contains information about the winning teams. It will ensure that only teams that have the show attribute
//set to true have their team logo, name and score displayed. Otherwise the image specified in the hiddenwinnerimg key
//will be diplayed with question marks for name and score. The entries are displayed in the order they exist in the JSON
//file, with their proper place listed above them.
function loadWinnerData()
{
	var cacheKill=Math.floor(Math.random()*1000001)
	$.getJSON('configs/winners.txt?cacheKill='+cacheKill, function(data) 
	{
		var html = '';
		for(key in data.WINNERS)
		{
			
			if(data.WINNERS[key].PLACE > 1)
			{
				html += '<div class="viewState3-teamListing loser">';
			}
			else
			{
				html += '<div class="viewState3-teamListing winner">';
			}
			html += '<div class="viewState3-teamPlace">'+getPlaceName(data.WINNERS[key].PLACE)+'</div>';
			html += '<div style="clear"></div>';
			if(data.WINNERS[key].SHOW == true)
			{
				html +='<div class="viewState3-teamListingLogoDiv"><img src='+data.WINNERS[key].IMG+'></div>';
				html +='<div class="clear"></div>';
				html += '<div class="viewState3-teamName">'+data.WINNERS[key].TITLE+'</div>';
				html += '<div class="viewState3-teamScore">'+data.WINNERS[key].SCORE+' Points</div>';

			}
			
			else
			{
				html +='<div class="viewState3-teamListingLogoDiv"><img src='+data.HIDDENWINNERIMG+'></div>';
				html +='<div class="clear"></div>';
				html += '<div class="viewState3-teamName">???</div>';
				html += '<div class="viewState3-teamScore">???</div>';							
			}
			html += '</div>';
			
		}
		$('#viewState3').html(html);
		
	});	
}

//Simple function that takes a numeric place, and returns a nice text string for it.
//ex 1 = 1st place.
function getPlaceName(placeNum)
{
	if(placeNum == 1)
	{
		return '1st Place';	
	}
	else if(placeNum == 2)
	{
		return '2nd Place';	
	}
	else if(placeNum == 3)
	{
		return '3rd Place';
	}
	else if(placeNum == 4)
	{
		return '4th Place';
	}
	else
	{
		return placeNum+'th Place';	
	}
}

function preloadImage(imagePath)
{
	preload_image = new Image(25,25); 
	preload_image.src=imagePath; 			
}
//When the document has loaded and the DOM is ready, being the real work.
$(document).ready(function() {
	readConfig();
});

