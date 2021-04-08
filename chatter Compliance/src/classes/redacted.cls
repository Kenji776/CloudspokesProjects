global class redacted 
{
	public static void filterObject(list<sObject> recordsToFilter, list<string> fieldsToFilter, string postCreatorIdField)
	{
		
		string objectType = string.valueOf(recordsToFilter[0].getSObjectType());
		
		list<Redacted_Filter_Match__c> matches = new list<Redacted_Filter_Match__c>();
		
		//Find and filters that apply to this type of object that has been passed in.
		list<Redacted_Filter__c> filters = [   select 
											  Name,
											  Applies_To__c,
											  Error_on_Match__c, 	
											  Notification_Email_Address__c, 
											  Pattern_String__c, 
											  Replacement_Pattern__c, 
											  Replace_Pattern__c, 
											  Send_Email_on_Match__c,
											  Error_Message__c,
											  Track_Matches__c
											  from Redacted_Filter__c 
											  Where Active__c = true and 
											  Applies_To__c includes (:objectType)];
		for(sObject post : recordsToFilter)
		{
			for(Redacted_Filter__c filter : filters)
			{
				//lets get the text body and the creator of the posts ID based on the paramters passed in		        
		        Id posterId = string.valueOf(post.get(postCreatorIdField));	
				for(String postBodyField : fieldsToFilter)
				{
					String postBody = string.valueOf(post.get(postBodyField));
					if(postBody == null)
					{
						continue;
					}	
					//okay, we have to get a little tricky here. Since the native apex string.contains() method
					//does not support regular expressions, we have to use of the methods that does, and test to see if that
					//did anything. If it did, then we know the string contains the regular expression and we can continue accordingly.
					//so lets use the find and replace method to replace any match with this big long string that should never appear normally
					//then check to see if the string contains it. If so, it matched the post and we should continue accordingly.
					string matchString = 'thisisamatchingstringthatshouldnoteverappearinaregularchatterpost';
					
			        string bodyMatchesPattern = postBody.replaceAll(filter.Pattern_String__c, matchString);
			                              				
					//If a match was found, lets do some filtering and crap
					if(bodyMatchesPattern.contains(matchString))
					{
						//If the user has configured this rule to be tracked, create a new tracking object
						//and populate it with data.
						if(filter.Track_Matches__c)
						{
							system.debug('Creating filter match record!');
							Redacted_Filter_Match__c thisMatch = new Redacted_Filter_Match__c();
							thisMatch.Filter__c = filter.id;
							thisMatch.Chatter_Post__c = postBody;
							thisMatch.Poster__c = posterId;
							matches.add(thisMatch);
						}
						//If this rule is set to send an email lets do that
						if(filter.Send_Email_on_Match__c)
						{
							if(filter.Notification_Email_Address__c != null)
							{
								sendPatternMatchEmail(filter.Notification_Email_Address__c, filter, posterId, postBody);
							}
						}
						//if this rule errors on match, attach an error to this post
						if(filter.Error_on_Match__c)
						{
							post.addError(filter.Error_Message__c);
						}
						//otherwise if it doesn't have erroring, but it does have replacements, lets do that
						else if(filter.Replace_Pattern__c)
						{
							//Run a replacment using the provided regular expression and the replacment string specified
							postBody = postBody.replaceAll(filter.Pattern_String__c,filter.Replacement_Pattern__c);
							//overwrite the post body with the updated body
							try
							{
								post.put(postBodyField,postBody);
							}
							catch(Exception e)
							{
								post.addError('This post has triggered a filtering rule. However the '+postBodyField+' on the '+objectType+' object is not editable so the filter rule may not be completed. This indicates an error with filter setup. Please notify your administrator' + e.getMessage());
							}
							
						}
					}
				}
			}
		}
		//if there are any feed matches to insert, do that now.
		if(!matches.isEmpty())
		{
			system.debug('Inserting filter match records!');
			
			insert matches;
		}
		
	
	}
	
	
	public static void sendPatternMatchEmail(String recipient, Redacted_Filter__c filter, Id userId, string postBody)
	{
		User user = [select firstname, lastname, id, email, username from user where id = :userId];
		Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
		//Set email address
		String[] toAddresses = new String[] {recipient};
		mail.setToAddresses(toAddresses);
		mail.setReplyTo('noreply@salesforce.com'); //the reply address doesn't matter
		mail.setSubject('Redacted Filter Rule '+filter.name+' was Invoked');
		mail.setBccSender(false);  //we don't want to Bcc ourselves on this
		mail.setPlainTextBody('User ' +user.username+ ' created a chatter post which matched filter rule ' +filter.name+'. The content of the post was "'+postBody+'".');
	
		Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail }); //send the email
	}
	
    
    public static testmethod void testRedacted()
    {
    	list<FeedPost> posts = new list<FeedPost>();
    	
    	Redacted_Filter__c thisFilter = new Redacted_Filter__c();
    	thisFilter.Active__c = true;
    	thisFilter.Applies_To__c = 'user;feedComment;feedPost;feedItem';
    	thisFilter.Error_on_Match__c = false;
    	thisFilter.Pattern_String__c = '[a-zA-Z]{3}[0-9]{6}[a-zA-Z]';
    	thisFilter.Notification_Email_Address__c = 'Kenji776@gmail.com';
    	thisFilter.Replacement_Pattern__c = '**REDACTED**';
    	thisFilter.Replace_Pattern__c = true;
    	thisFilter.Send_Email_on_Match__c = true;
    	thisFilter.Track_Matches__c = true;
    	
    	insert thisFilter;

		Profile thisProfile = [select id from profile where name = 'Chatter Free User'];
		
		User testUser = new User();
		
		String username = 'TestGuy';
		String domain = 'TestDomain';
	
		username += string.valueOf(Math.random());
		domain += string.valueOf(Math.random());

		testUser.username = username+'@'+domain+'.com';
		
		testUser.alias = 'Test';
		testUser.communityNickname = username;
		testUser.firstname = 'Test';
		testUser.lastname = 'Guy';
		testUser.email = 'Test@Test.com';
		testUser.LocaleSidKey = 'en_US';
		testUser.languageLocaleKey = 'en_US';
		testUser.EmailEncodingKey = 'ISO-8859-1';
		testUser.TimeZoneSidKey = 'GMT';
		testUser.profileid = thisProfile.id;
		
		insert testUser;
		
		//This post should not trigger the above rule to fire as it does not contain an account number.
		FeedPost fItem = new FeedPost(); 
		fItem.Type = 'TextPost'; 
		fItem.ParentId = testUser.id; 
		fItem.Body = 'The mice will see you now'; 
		posts.add(fItem);
 
 		//This post should trigger the above rule, so afterwards we can query for a tracking object.
		FeedPost fItem2 = new FeedPost(); 
		fItem2.Type = 'TextPost'; 
		fItem2.ParentId = testUser.id; 
		fItem2.Body = 'My account number is ABC123456D'; 
		posts.add(fItem2);
		
		insert posts;	  		
		
		String[] filterFields = new String[] {'Body'};
		
		redacted.filterObject(posts,filterFields,'ParentId');
		
		list<Redacted_Filter_Match__c> matches = [select id, Poster__c, Filter__c, Chatter_Post__c from Redacted_Filter_Match__c where Filter__c = :thisFilter.id];
		
		system.assertEquals(1,matches.size());
		
		thisFilter.Error_on_Match__c = true;
		thisFilter.Error_Message__c = 'Fail!';
		
		update thisFilter;
		
		posts.clear();
		
		FeedPost fItem3 = new FeedPost(); 
		fItem3.Type = 'TextPost'; 
		fItem3.ParentId = testUser.id; 
		fItem3.Body = 'DERP! My account number is ABC123456D DUURRRRR';  		
		posts.add(fItem3);	
		
		redacted.filterObject(posts,filterFields,'ParentId');		
    }
    
}