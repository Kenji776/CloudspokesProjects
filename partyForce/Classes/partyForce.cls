global class partyForce 
{	
	
	@isTest
	public static void testPartyForce()
	{		
		string userDataString = 'firstname=frank&lastname=jones&PartyForce_Password__c=test&email=fjones@nowhere.com&accountname=wootAccount';
		
		remoteObject userReg = partyForce.registerUser(userDataString);
		
		remoteObject login = partyForce.loginUser(userDataString);
		
		remoteObject loginFail = partyForce.loginUser('failData');
		
		string eventDataString = 'name=Test&start=2011-07-17+08%3A00%3A00&end=2011-07-17+08%3A00%3A00&Location_Name__c=None1&address__c=1234TestStreet&city__c=NewYork&state__c=NY&host__c='+userReg.sObjects[0].get('accountid')+'&Location_Name__c=TEST&CreatedBy__c='+userReg.sObjects[0].get('id');
		
		remoteObject createEvent = partyForce.registerEvent(eventDataString);
		
		remoteObject createEventFail = partyForce.registerEvent('blargEpicFail');
		
		remoteObject createInvite = partyForce.createInvite(createEvent.sObjects[0].id, userReg.sObjects[0].id, 'Invited');
		
		remoteObject invites = partyForce.getInvites('1=1');
		
		remoteObject findUser = partyForce.findUser('fjones@nowhere.com');
		
		remoteObject updateRSVP = partyForce.updateRSVP(createInvite.sObjects[0].id, 'Attending');
		
		remoteObject events = partyForce.findEvents('Test');
		
		remoteObject eventsError = partyForce.findEvents(') and ');
		remoteObject eventMembers = partyForce.getEventMembers(createInvite.sObjects[0].id);
		
		list<Id> eventIds= new list<Id>();
		eventIds.add(createEvent.sObjects[0].id);
		partyForce.geoCodeAddress(eventIds);
		
		string xml = '<xml><data>hey!</data></xml>';
		partyForce.readXMLelement(xml, 'data');		
		
	}
	
    global class remoteObject
    {
        public boolean success{get;set;}
        public string message{get;set;}
        public string data{get;set;}
        public list<sObject> sObjects {get;set;} 
    }
    
    public class customException extends Exception {}
    
    @remoteAction
    global static remoteObject loginUser(string dataString)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Login Successful';
        returnObj.data = 'Booya';
        
        try
        {
        	list<RecordType> partyForceAttendee = [select id from recordType where name = 'PartyForce Attendee' and sObjectType = 'contact' limit 1];
	        map<string,string> formData = deserializeString(dataString);
	        list<Contact> contact = [select id, 
	        								firstname, 
	        								lastname, 
	        								email, 
	        								mobilephone, 
	        								SMS_Enabled__c, 
	        								SmsPhoneNumber__c,
	        								AccountId,
	        								Twitter_Name__c,
	        								Account.name  
	        								from contact 
	        								where email = :formData.get('email') and 
	        								PartyForce_Password__c = :formData.get('PartyForce_Password__c') and 
	        								RecordTypeId = :partyForceAttendee[0].id
	        								limit 1];
	        
	        if(!contact.isEmpty())
	        {
	        	returnObj.data = 'login successful';
	        	returnObj.sObjects = contact;
	        }
	        else
	        {
	        	throw new customException('Bad username or password.');
	        }
        }
        catch(Exception e)
        {
        	returnObj.success = false;
        	returnObj.message = 'Error during login';
        	returnObj.data = e.getMessage();
        }
        return returnObj;       
    }

	@remoteAction
    global static remoteObject registerUser(string dataString)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Member Created';
        returnObj.data = 'Booya';
        
        try
        {
	        list<RecordType> partyForceAttendee = [select id from recordType where name = 'PartyForce Attendee' and sObjectType = 'contact'];
	        map<string,string> formData = deserializeString(dataString);
	        list<Contact> contacts = new list<Contact>();
	        list<Contact> dupeContacts = [select id, name, email from contact where email = :formData.get('email')];
	        
	        if(!dupeContacts.isEmpty())
	        {
	        	returnObj.message = formData.get('email');
	        	returnObj.sObjects = dupeContacts;
	        	throw new customException(' An account with this email address has already been registered. ');	        	
	        }
	        
	        list<Account> findAccount = [select id from account where name = :formData.get('accountname')];
	        
	        Contact thisContact = new Contact();
	        if(findAccount.isEmpty())
	        {
	        	Account thisAccount = new Account();
	        	thisAccount.name = formData.get('accountname');
	        	insert thisAccount;
	        	
	        	thisContact.AccountId = thisAccount.id;
	        	
	        }
	        else
	        {
	        	thisContact.AccountId = findAccount[0].id;
	        }
	        
	        
	        
	        thisContact.recordTypeId = partyForceAttendee[0].id;
	        
	        for(String fieldName : formData.keySet())
	        {
	        	try
	        	{
	        		thisContact.put(fieldName,formData.get(fieldName)); 
	        	}
	        	catch(Exception e)
	        	{
	        		system.debug('Field: ' +fieldName+' does not exist on contact');
	        	}      	
	        }
	        contacts.add(thisContact);
	        
	        insert thisContact;
	        returnObj.data = thisContact.id;
	        returnObj.sObjects = contacts;
        }
        catch(exception e)
        {
        	returnObj.success = false;
        	returnObj.data = e.getMessage();
        }
        
        
        return returnObj;       
    }
        
    //Method responsible for registering an event  
    @remoteAction 
    global static remoteObject registerEvent(string dataString)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Event Created';
        returnObj.data = 'Booya';

        try
        {
        	map<string,string> formData = deserializeString(dataString);
        	list<Party_Force_Event__c> events = new list<Party_Force_Event__c>();
        	Party_Force_Event__c thisEvent = new Party_Force_Event__c();
        	
        	thisEvent.Start_Date__c = dateTime.valueOf(formData.get('start'));
        	thisEvent.End_Date__c = dateTime.valueOf(formData.get('end'));
        	
	        for(String fieldName : formData.keySet())
	        {
	        	try
	        	{
	        		thisEvent.put(fieldName,formData.get(fieldName)); 
	        	}
	        	catch(Exception e)
	        	{
	        		system.debug('Field: ' +fieldName+' does not exist on event');
	        	}      	
	        }
	        events.add(thisEvent);
	        
	        insert thisEvent;
	        returnObj.data = thisEvent.id;
	        returnObj.sObjects = events;        	
        	
        }
        catch(Exception e)
        {
        	returnObj.success = false;
        	returnObj.message = 'Event not created';
        	returnObj.data = e.getMessage() + ' ' + dataString;
        }
                
        return returnObj;       
    } 

    @RemoteAction
    global static remoteObject createInvite(string eventId, string userId, string status)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'RSVP Sent';
        returnObj.data = 'Booya';
        
        try
        {
        	list<Party_Force_Invite__c > dupeReg = [select id from Party_Force_Invite__c where contact__c = :userId and Party_Force_Event__c = :eventId limit 1];
        	list<Party_Force_Invite__c> invites= new list<Party_Force_Invite__c>();
        	if(!dupeReg.isEmpty())
        	{
        		throw new customException('This user has already registered for this event.');	        		
        	}
        	Party_Force_Invite__c thisInvite = new Party_Force_Invite__c();
        	thisInvite.Contact__c = userId;
        	thisInvite.Party_Force_Event__c = eventId;
        	thisInvite.RSVP_Status__c = status;
        	
        	insert thisInvite;
        	invites.add(thisInvite);
        	returnObj.data = thisInvite.id;
        	returnObj.sObjects = invites;
            	
        }
        catch(Exception e)
        {
        	returnObj.success = false;
        	returnObj.message = 'Unable to RSVP to event';
        	returnObj.data = e.getMessage();
        }
        return returnObj;       
    }   

    @RemoteAction
    global static remoteObject getInvites(string filter)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Events fetched';
        returnObj.data = 'Booya';
        string queryString;
        
        try
        {
        	queryString = 'select Contact__r.name, Contact__r.Twitter_Name__c, Contact__r.email, RSVP_Status__c,Party_Force_Event__r.name,Party_Force_Event__r.Description__c,Party_Force_Event__r.Parking_Available__c,Party_Force_Event__r.Dress_Code__c,Party_Force_Event__r.Max_Attendees__c,Party_Force_Event__r.BYOB__c,Party_Force_Event__r.Location_Name__c,Party_Force_Event__r.Host__r.name,Party_Force_Event__r.Lat__c,Party_Force_Event__r.Lng__c,Party_Force_Event__r.Start_Date__c,Party_Force_Event__r.End_Date__c,Party_Force_Event__r.Address__c,Party_Force_Event__r.City__c,Party_Force_Event__r.State__c from Party_Force_Invite__c where Party_Force_Event__r.Status__c = \'Approved\'';
        	queryString += 'and ' + filter;
        										
        										  
        	returnObj.sObjects = database.query(queryString);
        	
        }
        catch(Exception e)
        {
        	returnObj.success = false;
        	returnObj.message = 'Unable to get list of events';
        	returnObj.data = e.getMessage() + 'queryString: '+queryString;
        }
        return returnObj;       
    } 
    
    @RemoteAction
    global static remoteObject findUser(string searchFor)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Users fetched';
        returnObj.data = 'Booya';
            	
    	try
    	{
    		returnObj.sObjects = [select name, id, Twitter_Name__c, email from Contact where email = :searchFor or Twitter_Name__c =:searchFor or name = :searchFor];
        }
        catch(Exception e)
        {
        	returnObj.success = false;
        	returnObj.message = 'Unable to get list of events';
        	returnObj.data = e.getMessage();
        }
        return returnObj;    	
    }    
    
    @RemoteAction
    global static remoteObject updateRSVP(string id, string status)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'RSVP Status updated';
        returnObj.data = 'Booya';
            	
    	try
    	{    	
	    	Party_Force_Invite__c thisInvite = new Party_Force_Invite__c(id=id);
	    	thisInvite.RSVP_Status__c = status;
	    	update thisInvite;
        }
        catch(Exception e)
        {
        	returnObj.success = false;
        	returnObj.message = 'Unable to get list of events';
        	returnObj.data = e.getMessage();
        }
        return returnObj;       	
    }
    
    @RemoteAction 
    global static remoteObject findEvents(string searchString)
    {
    	remoteObject returnObj = new remoteObject();
    	string queryString;
    	try
    	{
	        
	        returnObj.success = true;
	        returnObj.message = 'Query Ran';
	        returnObj.data = searchString;
	        
	        try
	        {
	        	Id eventId = Id.valueOf(searchString);
	        	queryString  = 'select Id, Number_of_Guests__c, Image__c, Access_Type__c, CreatedBy__c, Description__c, Parking_Available__c, Dress_Code__c, Max_Attendees__c, BYOB__c,  Location_Name__c, name, Host__r.name, Lat__c, Lng__c, Start_Date__c, End_Date__c, Address__c, City__c, State__c from Party_Force_Event__c where id = \''+searchString+'\' and Status__c = \'Approved\' order by name' ;	
	        	returnObj.data = 'Ran as ID search';
	        }  
	        catch(Exception e)
	        {       
		    	queryString  = 'select Id, Number_of_Guests__c, Image__c, Access_Type__c, CreatedBy__c, Description__c, Parking_Available__c, Dress_Code__c, Max_Attendees__c, BYOB__c,  Location_Name__c, name, Host__r.name, Lat__c, Lng__c, Start_Date__c, End_Date__c, Address__c, City__c, State__c from Party_Force_Event__c where name like \'%'+searchString+'%\' and Status__c = \'Approved\' order by name' ;	    	
	        	returnObj.data = 'Ran as string name search';
	        }
	    	List<Party_Force_Event__c> records = Database.query(queryString);
	    		   	
	    	returnObj.sObjects = records;
    	}
    	catch(Exception e)
    	{
	        returnObj.success = false;
	        returnObj.message = 'Could not find events';
	        returnObj.data = 'Error: '+e.getMessage()+ ' Querystring: ' + queryString;    		
    	}
    	return returnObj;
    }


    @RemoteAction 
    global static remoteObject getEventMembers(string eventId)
    {
    	remoteObject returnObj = new remoteObject();
    	try
    	{
	        
	        returnObj.success = true;
	        returnObj.message = 'Query Ran';
	        returnObj.data = '';
	                 
		    string queryString = 'select Id, Contact__c, Contact__r.name, Contact__r.Twitter_Name__c, RSVP_Status__c where Party_Force_Event__c = \''+eventId+'\'order by name' ;	    	
	    	List<Party_Force_Event__c> records = Database.query(queryString);
	    		   	
	    	returnObj.sObjects = records;
    	}
    	catch(Exception e)
    	{
	        returnObj.success = false;
	        returnObj.message = 'Unable to get event members';
	        returnObj.data = 'Error: '+e.getMessage();    		
    	}
    	return returnObj;
    }
        


	@Future(callout=true)
	public static void geoCodeAddress(list<Id> eventIds)
	{
		list<Party_Force_Event__c> events = [select IsFutureContext__c, address__c, city__c, state__c from Party_Force_Event__c where id in :eventIds];
		for(Party_Force_Event__c event : events)
		{
			string address = event.Address__c + ', ' + event.City__c + ', ' + event.State__c;
			Http httpObj = new Http();
		    // Instantiate a new HTTP request, specify the method (GET) as well as the endpoint
		    HttpRequest req = new HttpRequest();
		    String url = 'http://maps.googleapis.com/maps/api/geocode/xml?address='+EncodingUtil.urlEncode(address, 'UTF-8')+'&sensor=true';
		    req.setEndpoint(url);
		    req.setMethod('GET');
			HttpResponse res = httpObj.send(req);
			
			string geoCodeContent = res.getBody();
			event.lat__c = readXMLelement(geoCodeContent, 'lat');
			event.lng__c = readXMLelement(geoCodeContent, 'lng');
			event.IsFutureContext__c = true;			
		}
		update events;	
	}
    public static String readXMLelement(String xml, String element)
    {
        String elementValue = 'NOT FOUND'; 
        
        try
        {
            Xmlstreamreader reader = new Xmlstreamreader(xml);
            while (reader.hasNext()) 
            {
                if (reader.getEventType() == XmlTag.START_ELEMENT && reader.getLocalName() == element)
                {
                    reader.next();
                    elementValue = getDecodedString(reader);
                }         
                reader.next();
            }
            return elementValue;
        }
        catch(exception e)
        {
        	system.debug(e);
            Spin_SMS_Error_Log__c log = new Spin_SMS_Error_Log__c();
            log.trace__c = e.getTypeName() + '\n' + e.getCause() + '\n' + e.getMessage() + '\n' + xml;
            insert log;

            return log.trace__c;
        }
    }
	
	public static void emailAttendeesOnEventStart(list<Party_Force_Event__c> events)
	{
		EmailTemplate emailTemplate = [select id from EmailTemplate where DeveloperName = 'PartyForce_Event_Starting'];
		list<Contact> contacts = new list<Contact>();
		
		for(Party_Force_Event__c event : events)
		{
			list<Id> contactIds = new list<Id>();
			list<Party_Force_Invite__c> invites = [select Contact__c, id from Party_Force_Invite__c where RSVP_Status__c = 'Attending' or RSVP_Status__c = 'Unsure'];
			for(Party_Force_Invite__c invite : invites)
			{
				contactIds.add(invite.Contact__c);
			}
				Messaging.MassEmailMessage mail = new Messaging.MassEmailMessage();
				mail.saveAsActivity = false;
				mail.setTargetObjectIds(contactIds);
		        mail.setTemplateId(emailTemplate.Id);
		           
		        mail.setUseSignature(false);
		        mail.setSaveAsActivity(false);
		        
		        Messaging.sendEmail(new Messaging.MassEmailMessage[] { mail });				
		}		
	}
	
    public static String getDecodedString(Xmlstreamreader reader)
    {
        return EncodingUtil.urlDecode(reader.getText(), 'UTF-8').trim();
    }
        
    public static Map<string,string> deserializeString(String argString)
    { 	
		string[] params = argString.split('&');
		map<String,String>  formParams = new map<String,String>();
		for(string p : params)
		{		
		    formParams.put(EncodingUtil.urlDecode(p.substring(0,p.indexOf('=')),'UTF-8'),EncodingUtil.urlDecode(p.substring(p.indexOf('=')+1,p.length()),'UTF-8'));    
		}    	
    	return formParams;
    }   
}