global class redacted
{

    //takes a list of objects, and a list of fields on that object to filter.
    public static void filterObject(list<sObject> recordsToFilter, list<string> fieldsToFilter)
    {
       try
       {
           //what type of object are we filtering (returns a string representing the object type, such as 'contact' or 'user'
            string objectType = string.valueOf(recordsToFilter[0].getSObjectType());
            
            //who is posting this content?
            string postingUserId = UserInfo.getUserId();
            
            //which field on the passed in set of records is going to contain the relationship that points to the object this chatter post is related to?
            string objectIdField = 'parentId';
            
            //if this a user object, the id field is what we want, because that points to the user themselves, which is the object which the post is on.
            if(objectType.toLowerCase() == 'user')
            {
                objectIdField = 'id';
            }
                                       
            list<Redacted_Filter_Match__c> matches = new list<Redacted_Filter_Match__c>();
            
            //Find the current (posting users) users email. So we know who to email if they match a rule.
            User posterInfo = [select id, email from user where id = :UserInfo.getUserId()];
    
    
            
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
                                                  Track_Matches__c,
                                                  Email_Poster_On_Match__c,
                                                  Warning_Message__c
                                                  from Redacted_Filter__c
                                                  Where Active__c = true ];
            for(sObject post : recordsToFilter)
            {
                try
                {
                    for(Redacted_Filter__c filter : filters)
                    {
                        //Don't bother running this filter if it doesn't apply to this object type
                        
                        //Find and filters that apply to this type of object that has been passed in.
                        string relatedObjectType = getObjectTypeFromId(string.ValueOf(post.get(objectIdField)));
                        if(!filter.Applies_To__c.toLowerCase().contains(relatedObjectType.toLowerCase()))
                        {
                            continue;
                        }            
        
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
                                    Redacted_Filter_Match__c thisMatch = new Redacted_Filter_Match__c();
                                    thisMatch.Filter__c = filter.id;
                                    thisMatch.Chatter_Post__c = postBody;
                                    thisMatch.Poster__c = postingUserId;
                                    matches.add(thisMatch);
                                }
                                //If this rule is set to send an email lets do that
                               
                                list<string> emailRecips = new list<string>();
                                //send the email to the notification email address specified on the filter if there is one, and that option is set
                                if(filter.Notification_Email_Address__c != null && filter.Send_Email_on_Match__c)
                                {
                                    emailRecips = new list<string>();
                                    emailRecips.add(filter.Notification_Email_Address__c);                        
                                    sendPatternMatchEmail(emailRecips, filter, postingUserId, postBody, null, string.ValueOf(post.get(objectIdField)));
                                }
                                //send the email to the user tho posted the content in the first place if that option is set. Send them the warning message.
                                if(filter.Email_Poster_On_Match__c)
                                {
                                    emailRecips = new list<string>();
                                    emailRecips.add(posterInfo.email);
                                    sendPatternMatchEmail(emailRecips, filter, postingUserId, postBody, filter.Warning_Message__c, string.ValueOf(post.get(objectIdField)));
                                }
                               
                                
                                //if this rule errors on match, attach an error to this post
                                
                                if(filter.Error_on_Match__c)
                                {
                                    post.addError(filter.Error_Message__c);
                                }
                                //otherwise if it doesn't have erroring, but it does have replacements, lets do that
                                else if(filter.Replace_Pattern__c)
                                {
                                    try
                                    {                        
                                        //Run a replacment using the provided regular expression and the replacment string specified
                                        postBody = postBody.replaceAll(filter.Pattern_String__c,filter.Replacement_Pattern__c);
                                        //overwrite the post body with the updated body
         
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
                catch(exception e)
                {
                    post.addError(e.getMessage());
                }
            }


            //if there are any feed matches to insert, do that now.
            if(!matches.isEmpty())
            {       
                database.insert(matches,false);
            }
        }
        catch(exception e)
        {
            for(sObject thisObj : recordsToFilter)
            {
                thisObj.addError(e.getMessage());
            }
        }
    }

    public static void sendPatternMatchEmail(list<String> recipients, Redacted_Filter__c filter, Id userId, string postBody, string emailBody, id chatterPostId)
    {
        if(userId != null)
        {
            //lets try and find the user based on the id passed in. Failing that, then set the offending user as the current user (this will always be the case anyway, except in the case of imports)
            User offendingUser = [select firstname, lastname, id, email, username from user where id = :userId];
          
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            //Set email address
            String[] toAddresses = recipients;
            mail.setToAddresses(toAddresses);
            mail.setReplyTo('noreply@salesforce.com'); //the reply address doesn't matter
            mail.setSubject('Chatter Compliance Rule '+filter.name+' was Invoked');
            mail.setBccSender(false);  //we don't want to Bcc ourselves on this
            if(emailBody == null)
            {
                  // mail.setPlainTextBody('User ' +user.username+ ' created a chatter post which matched filter rule ' +filter.name+'. The content of the post was "'+postBody+'".');
                   mail.setPlainTextBody('User ' +offendingUser.username+ ' created a chatter post which matched filter rule ' +
                   filter.name+'. The content of the post was "'+postBody+'. View the post here ' + 
                   URL.getSalesforceBaseUrl().toExternalForm() +'/'+chatterPostId);
            }
            else
            {
                mail.setPlainTextBody(emailbody);
            }
           
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail }); //send the email
        }   

    }
    global static string getObjectTypeFromId(string objectId)
    {
        system.debug('-------- OBJECT ID');
        system.debug(objectId);
        
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe(); 
        Map<String,String> keyPrefixMap = new Map<String,String>{};
        Set<String> keyPrefixSet = gd.keySet();
        for(String sObj : keyPrefixSet)
        {
           Schema.DescribeSObjectResult r =  gd.get(sObj).getDescribe();
           String tempName = r.getName();
           String tempPrefix = r.getKeyPrefix();
           keyPrefixMap.put(tempPrefix,tempName);
        }
        system.debug(keyPrefixMap.keyset());
        return keyPrefixMap.get(objectId.subString(0,3));  
    }
       
   
    public static testmethod void testRedacted()
    {
        list<FeedItem> posts = new list<FeedItem>();
       
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
        testUser.CurrentStatus = 'bleh';
        testUser.profileid = thisProfile.id;
        
        system.debug(testUser);

         insert testUser;

        
        //This post should not trigger the above rule to fire as it does not contain an account number.
        FeedItem fItem = new FeedItem();
        fItem.Type = 'TextPost';
        fItem.ParentId = testUser.id;
        fItem.Body = 'The mice will see you now';
        posts.add(fItem);
        //This post should trigger the above rule, so afterwards we can query for a tracking object.
        FeedItem fItem2 = new FeedItem();
        fItem2.Type = 'TextPost';
        fItem2.ParentId = testUser.id;
        fItem2.Body = 'My account number is ABC123456D';
        posts.add(fItem2);
       
        insert posts;          
        
        String[] filterFields = new String[] {'Body'};
       
        redacted.filterObject(posts,filterFields);
       
        list<Redacted_Filter_Match__c> matches = [select id, Poster__c, Filter__c, Chatter_Post__c from Redacted_Filter_Match__c where Filter__c = :thisFilter.id];
       
        system.assertEquals(2,matches.size());
       
        thisFilter.Error_on_Match__c = true;
        thisFilter.Error_Message__c = 'Fail!';
       
        update thisFilter;
       
        posts.clear();
       
        FeedItem fItem3 = new FeedItem();
        fItem3.Type = 'TextPost';
        fItem3.ParentId = testUser.id;
        fItem3.Body = 'DERP! My account number is ABC123456D DUURRRRR';        
        posts.add(fItem3); 
        
        redacted.filterObject(posts,filterFields);      
    }
   
}