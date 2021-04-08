global class rssToChatter implements Schedulable
{
	//variable to see if this run is a test or not so we don't do callouts during a test
	public static boolean isApexTest = false;
	
	//make this thing scheduable
	global void execute(SchedulableContext ctx) 
	{	    		
		rssToChatter.updateFeeds();  
	}   
		
	webservice static void updateFeeds()
	{
		//find all the feeds that are active
		list<RSS_Feed__c> feeds = [select Chatter_Group_ID__c, Last_Run__c, RSS_Feed_URL__c from RSS_Feed__c where Active__c = true];
		list<FeedPost> posts = new list<FeedPost>();
		
		//loop over every feed we find
		for(RSS_Feed__c f : feeds)
		{
			//create a new http request
			HttpRequest req = new HttpRequest(); 
			  		 
			//Set HTTPRequest Method
			req.setMethod('GET');
			//Set HTTPRequest header properties
			req.setEndpoint( f.RSS_Feed_URL__c);
			Http http = new Http();
			  
			try 
			{			 
				//Execute web service call here	
				string result;	
		        if (!isApexTest)
		        {
		            // Make a real callout since we are not running a test
		            HttpResponse res = http.send(req);
		            result = res.getBody();
		        } 
		        else 
		        {
		            // A test is running
		            result = '<xml><item><title>Test</title><link>http://www.test.com</link><description>testtesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttesttest</description><pubdate>Fri, 12 Aug 2511 04:59:09 +0000</pubdate></item>';
		        }
		        //pass the result data into our parser which will return a list of objects with the rss data
				list<rssObj> rssEntries = parseRSSXML(result);
				
				//loop over all the returned objects
				for(rssObj r : rssEntries)
				{
					//we only want to make a new feed post if this post is newer than the last run date.
					if(r.pubDate > f.Last_Run__c)
					{
						//datetime thisDate = r.pubDate;
						FeedPost thisPost = new FeedPost();
						thisPost.parentId = f.Chatter_Group_ID__c;
						thisPost.linkURL = r.link;
						thisPost.title = r.title;
						thisPost.body = 'RSS Feed: ' + r.description;
						posts.add(thisPost);	
					}				
				}
				//update the rss feed object with the information about the run
				f.Last_Run_Result__c = 'Success!';		
				f.Last_Run__c = System.now();
			} 
			catch(System.CalloutException e) 
			{
				//log any errors incase something blows up
				system.debug(e);
				f.Last_Run_Result__c = 'Error: ' + e.getMessage();
			}					
		}
		insert posts;
		update feeds;
	}

	//crazy method for parsing an rss stream into an object with the 
	//important data points (title, description, pubDate and link)
	//pub date gets returned as a date time object. posts should 
	//come back in order of the way they were made.
    public static list<rssObj> parseRSSXML(String xml)
    {
        map<integer,rssObj> rssObjects = new map<integer,rssObj>(); 
        integer rssFeedNum = -1;
        try
        {
            Xmlstreamreader reader = new Xmlstreamreader(xml);
            while (reader.hasNext()) 
            {
                if (reader.getEventType() == XmlTag.START_ELEMENT && reader.getLocalName() == 'item')
                {
                	rssFeedNum++;
                    rssObj thisObj = new rssObj();
                    rssObjects.put(rssFeedNum,thisObj);
                    
                }         
                
                else if (reader.getEventType() == XmlTag.START_ELEMENT && reader.getLocalName() == 'title')
                {
                	
                	rssObj thisObj = rssObjects.get(rssFeedNum);
                	if(thisObj != null)
                	{
                		reader.next();
	                	thisObj.title = htmlDecode(getDecodedString(reader));                	
	                	rssObjects.put(rssFeedNum,thisObj);
                	}
                	
                }
                else if (reader.getEventType() == XmlTag.START_ELEMENT && reader.getLocalName() == 'pubDate')
                {
                	
                	rssObj thisObj = rssObjects.get(rssFeedNum);
                	if(thisObj != null)
                	{         
                		reader.next();
                		//this really isn't the ideal date parsing setup, but its the best I could do. 
                		//Lets put some error handling on this thing
                		
                		//by setting a default time of now, we will at least have a default time to
                		//evaluate. This will set the default time to a time ahead of now so if the
                		//datetime is not parseable it will use the default and since the default will
                		//always be greater than the last run date it will post all feeds.
                		
                		dateTime pubDate = system.now().addHours(1);
                		try
                		{
	                		string dates = getDecodedString(reader);     
							integer day = integer.valueof(dates.substring(5,7).trim());
							integer month =rssToChatter.getMonthIndex(dates.substring(8,11).trim());
							integer year = integer.valueof(dates.substring(12,16).trim());
							
							integer hour = integer.valueof(dates.substring(17,19).trim());
							integer minute = integer.valueof(dates.substring(20,22).trim());
							integer second = integer.valueof(dates.substring(23,25).trim());
							pubDate = dateTime.newInstanceGmt(year, month, day, hour, minute, second);  
                		}
                		catch(Exception e)
                		{
                			system.debug(e);
                		}  	
	                	thisObj.pubDate = pubDate;                	
	                	rssObjects.put(rssFeedNum,thisObj);
	                	
                	}
                	
                }
                else if (reader.getEventType() == XmlTag.START_ELEMENT && reader.getLocalName() == 'link')
                {                	        	
                	rssObj thisObj = rssObjects.get(rssFeedNum);
                	if(thisObj != null)
                	{
                		reader.next();
	                	thisObj.link = getDecodedString(reader);                	
	                	rssObjects.put(rssFeedNum,thisObj);
	                	system.debug('Setting title to: ' + getDecodedString(reader));
                	}
                	
                }
                else if (reader.getEventType() == XmlTag.START_ELEMENT && reader.getLocalName() == 'description')
                {                	        	
                	rssObj thisObj = rssObjects.get(rssFeedNum);
                	if(thisObj != null)
                	{
                		reader.next();
                		string description = htmlDecode(getDecodedString(reader));
                		if(description.length() > 200)
                		{
                			description = description.substring(0,200) + '...';
                		}
	                	thisObj.description = description;                	
	                	rssObjects.put(rssFeedNum,thisObj);
                	}
                	
                }                                                    
                reader.next();
            }
        }
        catch(exception e)
        {
			system.debug(e);
        }
        
        //Now we have to flip the order to get the newest ones on top
        list<rssObj> sortedList = new list<rssObj>();
        for(integer i = rssObjects.size()-1; i >= 0; i--)
        {
        	sortedList.add(rssObjects.get(i));
        } 
        return sortedList;
    }
        
    public static String getDecodedString(Xmlstreamreader reader)
    {
        return EncodingUtil.urlDecode(reader.getText(), 'UTF-8').trim();
    }	
    
    //stupid function to find the index of a month when given its name or
    //abbrevation.
    public static integer getMonthIndex(String month)
	{
    	string thisMonth = month.toLowerCase().trim();
		if(thisMonth == 'jan' || thisMonth == 'january') return 1;	
		else if(thisMonth == 'feb' || thisMonth == 'february') return 2;
		else if(thisMonth == 'mar' || thisMonth == 'march') return 3;
		else if(thisMonth == 'apr' || thisMonth == 'april') return 4;
		else if(thisMonth == 'may' || thisMonth == 'may') return 5;
		else if(thisMonth == 'jun' || thisMonth == 'june') return 6;
		else if(thisMonth == 'jul' || thisMonth == 'july') return 7;
		else if(thisMonth == 'aug' || thisMonth == 'august') return 8;
		else if(thisMonth == 'sep' || thisMonth == 'september') return 9;
		else if(thisMonth == 'oct' || thisMonth == 'october') return 10;
		else if(thisMonth == 'nov' || thisMonth == 'november') return 11;
		else if(thisMonth == 'dec' || thisMonth == 'december') return 12;
		
		return 0;
	}
	
	public static string htmlDecode(string html)
	{
		html = EncodingUtil.urlDecode(html,'UTF-8');
		html = html.replace('&#8217;','\'');	
		html = html.replace('&#8216;','‘');	
		html = html.replace('&#8220;','"');
		html = html.replace('&#8221;','"');
		html = html.replace('&#8222;','"');
		return html;
	
	}

	//object to contain rss feed post data.
    public class rssObj
    {
    	String title{get;set;}
    	String link{get;set;}
    	dateTime pubDate{get;set;}
    	String description {get;set;}
    }
    
    static testMethod void testRssToChatter()
    {
    	isApexTest = true;
    	
    	CollaborationGroup thisGroup = new CollaborationGroup();
    	thisGroup.name = 'test group';
    	thisGroup.description = 'test group';
    	thisGroup.CollaborationType = 'public';
    	insert thisGroup;
    	
    	RSS_Feed__c thisFeed = new RSS_Feed__c();
    	thisFeed.active__c = true;
    	thisFeed.Chatter_Group_ID__c = thisGroup.id;
    	thisFeed.RSS_Feed_URL__c = 'http://iwritecrappycode.wordpress.com/feed/';
    	
    	insert thisFeed;
    	
    	updateFeeds(); 
    	
    	system.assertEquals(getMonthIndex('jan'),1);  
    	system.assertEquals(getMonthIndex('feb'),2);
    	system.assertEquals(getMonthIndex('mar'),3);
    	system.assertEquals(getMonthIndex('apr'),4);
    	system.assertEquals(getMonthIndex('may'),5);
    	system.assertEquals(getMonthIndex('jun'),6);
    	system.assertEquals(getMonthIndex('jul'),7);
    	system.assertEquals(getMonthIndex('aug'),8);
    	system.assertEquals(getMonthIndex('sep'),9);
    	system.assertEquals(getMonthIndex('oct'),10);
    	system.assertEquals(getMonthIndex('nov'),11);
    	system.assertEquals(getMonthIndex('dec'),12);    		
    }
}