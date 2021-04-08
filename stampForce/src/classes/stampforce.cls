global class stampForce 
{
    
    
    @remoteAction
    global static remoteObject registerUser(string dataString)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Account Created';
        returnObj.data = 'Booya';
        
        try
        {
            map<string,string> formData = deserializeString(dataString);
            list<Stampforce_User__c> users = new list<Stampforce_User__c>();
            list<Stampforce_User__c> dupeusers = [select id, name, email__c from Stampforce_User__c where email__c = :formData.get('signup-email')];
            
            if(!dupeusers.isEmpty())
            {
                returnObj.message = formData.get('email');
                returnObj.sObjects = dupeusers;
                throw new customException(' An account with this email address has already been registered. ');             
            }
            
            list<Account> findAccount = [select id from account where name like :formData.get('reg-company')];
            
            Stampforce_User__c thisUser = new Stampforce_User__c();
            if(findAccount.isEmpty())
            {
                Account thisAccount = new Account();
                thisAccount.name = formData.get('signup-company');
                insert thisAccount;
                
                thisUser.company__c= thisAccount.id;
                
            }
            else
            {
                thisUser.company__c = findAccount[0].id;
            }
            
            thisUser.email__c = formData.get('signup-email');
            thisUser.phone__c = formData.get('signup-phone');
            thisUser.password__c = hashPass(formData.get('signup-password'));
            thisUser.firstname__c =formData.get('signup-firstname');
            thisUser.lastname__c =formData.get('signup-lastname');
            users.add(thisUser);
            
            insert thisUser;
            returnObj.data = thisUser.id;
            returnObj.sObjects = users;
        }
        catch(exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error creating account. Please try again later.';
            returnObj.data = e.getMessage();
        }
        
        
        return returnObj;       
    }

    @remoteAction
    global static remoteObject loginUser(string dataString)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Login Successful';
        returnObj.data = 'Booya';     
        
        try
        {
        	map<string,string> formData = deserializeString(dataString); 
        	String Password = hashPass(formData.get('login-password'));            
            list<Stampforce_User__c> user = [select id, 
                                                phone__c, 
                                                email__c, 
                                                company__c,
                                                company__r.name,
                                                Password__c,
                                                Type__c 
                                                from Stampforce_User__c 
                                                where email__c = :formData.get('login-email') and 
                                                Password__c = :Password
                                                limit 1];
                                            
            
            if(!user.isEmpty())
            {
                returnObj.data = 'login successful';
                returnObj.sObjects = user;
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
    global static remoteObject getEvents()
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Events Fetched';
        returnObj.data = 'Booya';

        try
        {

            list<Event__c> events = [select id, 
                                                Description__c, 
                                                Title__c,
                                                Address__c,
                                                City__c,
                                                End__c,
                                                Postal_Code__c,
                                                Number_of_Stamps_Available__c,
                                                Start__c,
                                                State__c,
                                                Enable_QR_Codes__c
                                                from Event__c 
                                                where Active__c = true
                                                order by start__c, title__c];
            returnObj.sObjects = events;
            map<Id,Event__c> eventsMap = new map<Id,Event__c>();
            for(Event__c e : events)
            {
                    eventsMap.put(e.id,e);
            }
            returnObj.sObjectMap = eventsMap;
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
    global static remoteObject createStampCode(String companyId, String userId, string eventId)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Code Created';
        returnObj.data = 'Booya';

        try
        {
            list<Sponsorship__c> sponsorData = [select id, Company__c,  Is_Stamp_Provider__c, Sponsor_Code__c from Sponsorship__c where Company__c = :companyId and Is_Stamp_Provider__c = true];
            
            if(sponsorData.isEmpty())
            {
                throw new customException('Could not locate a sponsorship for your company. Please ensure your company is a valid sponsor for this event.');
            }
            Stampforce_Code__c thisCode = new Stampforce_Code__c();
            thisCode.Sponsorship__c = sponsorData[0].id;
            thisCode.Event__c = eventId;
            thisCode.Generated_By__c = userId;
            
            String codePrefix = sponsorData[0].Sponsor_Code__c;
            String code;
            integer counter = 0;
            while(true)
            {
                //We have to make sure this code is unique. While it is highly unlikely that a 6 digit
                //sequence would be repeated for the same sponsor (since each code has a unique sponsor code in front)
                //we will need to check. This look should break pretty much immediatly.
                code = codePrefix+''+generateRandomString(6).data;
                list<Stampforce_Code__c> dupeCode = [select id from Stampforce_Code__c where Code__c = :code];
                if(dupeCode.isEmpty())
                {
                    break;
                }
                if(counter == 10)
                {
                    throw new customException('Could not generate unique code after 10 tries. Either increase code length if possible or just try again.');
                }
                counter++;
            }
            thisCode.code__c = code;
            returnObj.data = code;
            insert thisCode;
            
            list<Stampforce_Code__c> codes = new list<Stampforce_Code__c>();
            codes.add(thisCode);
            
            returnObj.sObjects = codes;
        }
        catch(Exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error during stamp generation.';
            returnObj.data = e.getMessage();
        }
        
        
        return returnObj;       
    }
    
    @RemoteAction
    global static remoteObject registerUserForEvent(string userId, string eventId)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Attendance Record Created';
        returnObj.data = 'Booya';           
        try
        {
            list<Attendance__c> dupes = [select id from Attendance__c where Stampforce_User__c = :userId and Event__c = :eventId];
            if(!dupes.isEmpty())
            {
                throw new customException('You have already registered for this event.');
            }
            list<Attendance__c> attendee = new list<Attendance__c>();
            Attendance__c thisAttendee = new Attendance__c();
            
            thisAttendee.Event__c = eventId;
            thisAttendee.Stampforce_User__c = userId;
            attendee.add(thisAttendee);
            insert attendee;
            
            returnObj.data = attendee[0].id;
            returnObj.sObjects = attendee;
            remoteObject createStamps = stampforce.createStampTemplates(attendee[0].id, eventId);
                       
            if(!createStamps.success)
            {
                throw new customException('Could not generate template stamps.' +createStamps.message + '. ' + createStamps.data);
            }
            

        }
        catch(Exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error during stamp generation.';
            returnObj.data = e.getMessage();
        }
        
        
        return returnObj;    
    }
            
    public static remoteObject createStampTemplates(string attendeeId, string eventId)
    { 
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Default stamp templates created';
        returnObj.data = 'Booya';          
        try
        {
            list<Stamp__c> stamps = new list<Stamp__c>();
                        
            list<Sponsorship__c> sponsors = [select id,
                                                    Company__r.name,
                                                    Event__r.title__c,
                                                    Sponsor_Code__c,
                                                    Stamp_Image_URL__c
                                                    from Sponsorship__c
                                                    where event__c = :eventId and
                                                    Is_Stamp_Provider__c = true];
            
            for(Sponsorship__c s : sponsors)
            {
                Stamp__c thisStamp =  new Stamp__c();
                thisStamp.Attendee__c = attendeeId;
                thisStamp.Event__c = eventId;
                thisStamp.Sponsor__c = s.id;
                thisStamp.Status__c = 'Generated';
                stamps.add(thisStamp);
            }
            
            insert stamps;
            returnObj.sObjects = stamps;
        }
        catch(Exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error during stamp generation.';
            returnObj.data = e.getMessage();
        }
        
        
        return returnObj;     
    }
    
    //Allows a sponsor to directly give a user a stamp, instead of making the user redeem a code
    @remoteAction
    global static remoteObject giveStampToAttendee(string attendeeCode, string generatingUserId, string companyId)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Stamp Code Redeemed Successfully';
        returnObj.data = 'Booya';  
        
        try
        {
        	list<Attendance__c> attendee = [select id, Stampforce_User__r.firstName__c, Stampforce_User__r.lastName__c, Event__c from Attendance__c where name = :attendeeCode];
        	if(attendee.isEmpty())
        	{
        		 throw new customException('Could not find Attendee with that ID. Please check ID and try again');
        	}
        	remoteObject createStamp = createStampCode(companyId, generatingUserId, attendee[0].Event__c);
        	
        	if(createStamp.success)
        	{
        		remoteObject redeemCode = redeemStampCode(attendee[0].id, attendee[0].Event__c, createStamp.data);
        		if(redeemCode.success)
				{
					returnObj.message = attendee[0].Stampforce_User__r.firstName__c + ' ' + attendee[0].Stampforce_User__r.lastName__c + ' has been given Stamp Code ' +createStamp.data;
				}
				else
				{
        			throw new customException('Created code but was unable to redeem it: ' + redeemCode.message + ' ' + redeemCode.data);	
        		}
        	}
        	else
        	{
        		throw new customException('Unable to create stamp code to redeem: ' + createStamp.message + ' ' + createStamp.data);
        	}
        	
        }  	
        catch(Exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error during stamp generation.';
            returnObj.data = e.getMessage();        	
        }
        return returnObj;
    	
    }
    
    @remoteAction
    global static remoteObject redeemStampCode(string attendeeId, string eventId, string code)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Stamp Code Redeemed Successfully';
        returnObj.data = 'Booya';
        
        try
        {
            list<Stampforce_Code__c> codes = [select id, 
                                                     code__c,
                                                     Been_Used__c,
                                                     Sponsorship__c 
                                                     from Stampforce_Code__c
                                                     where Code__c = :code and
                                                     Event__c = :eventId LIMIT 1];
            if(!codes.isEmpty())
            {
                if(codes[0].Been_Used__c)
                {
                    throw new customException('Sorry, that code has already been redeemed.');
                }
                else
                {
                    //Find the stamp for this person this code is going to update
                    list<Stamp__c> stamps = [select Id
                                                    from Stamp__c
                                                    where Attendee__c = :attendeeId and 
                                                    Sponsor__c = :codes[0].Sponsorship__c LIMIT 1];  
                    if(!stamps.isEmpty())       
                    {
                        //update the stamp itself with it's new code
                        stamps[0].Stampforce_Code__c = codes[0].id;
                        stamps[0].Status__c = 'Confirmed';
                        stamps[0].Stamp_Confirmed_Time__c = datetime.now();
                        update stamps;
                        
                        //update the stamp code so that it may not be used again
                        codes[0].Been_Used__c = true;
                        update codes;
                    }                   
                    else
                    {
                        throw new customException('We could not redeem your stamp code because the template stamp was not found. Please contact an event representative');
                    }                                   
                }
            }   
            else
            {
                throw new customException('Sorry, that code does not seem to be valid for this event.');
            }                                       

        }
        catch(Exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error during stamp code redemption';
            returnObj.data = e.getMessage();
        }
        return returnObj;       
    }
        
    @RemoteAction
    global static remoteObject getStamps(string userId, string eventId)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'got stamps';
        Id AttendeeId;
                         
        try
        {                                   
            list<Attendance__c> attendee = [select id 
                                                    from Attendance__c     
                                                    where Stampforce_User__c = :userId and 
                                                    Event__c = :eventId LIMIT 1];
            if(attendee.isEmpty())
            {
                throw new customException('It doesn\'t look like you are registered for this event. You must register before you can begin collecting stamps!');
            }                 
            else
            {
                AttendeeId =  attendee[0].Id;
            }                                                            
            list<Stamp__c> stamps = [select Attendee__c,
                                            Event__c,
                                            Event__r.Default_Stamp_Image__c,
                                            Event__r.Missing_Stamp_Image__c,
                                            Sponsor__r.Location_Description__c,
                                            Sponsor__r.Stamp_Action_Description__c,
                                            Sponsor__c,
                                            Status__c,
                                            Sponsor__r.Stamp_Image_URL__c,
                                            Sponsor__r.Company__r.Name
                                            from Stamp__c
                                            where Attendee__c = :AttendeeId and
                                            event__c = :eventId];       
            returnObj.sObjects = stamps;
        }
        catch(Exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error getting stamps';
            returnObj.data = e.getMessage();            
        }
        return returnObj;       
        
        
    }    
    
    @RemoteAction
    global static remoteObject getUsersRegisteredEvents(string userId)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Found all events user registered for';
        Id AttendeeId;
                         
        try
        {                                   
            list<Attendance__c> attendee = [select id,
                                                                                Event__c,
                                                                                Stamps_Collected__c,
                                                                                Stamps_Remaining__c,
                                                                                Total_Stamps_Available__c
                                                                                 
                                                                                from Attendance__c     
                                                                                where Stampforce_User__c = :userId and 
                                                                                event__r.Active__c = true];
            returnObj.sObjects = attendee;
            map<id,Attendance__c> amap = new map<id,Attendance__c>();
            for(Attendance__c a : attendee)
            {
                amap.put(a.Event__c,a);
            }
            returnObj.sObjectMap = amap;                                                      
        }
        catch(Exception e)
        {
            returnObj.success = false;
            returnObj.message = 'Error getting stamps';
            returnObj.data = e.getMessage();            
        }
        return returnObj;      
    }
    
    @RemoteAction
    global static remoteObject generateRandomString(integer strLength)
    {
        remoteObject returnObj = new remoteObject();
        returnObj.success = true;
        returnObj.message = 'Code generated';
                         
        try
        { 
            string charString = 'abcdefghijklmnopqrstuvwxyz1234567890!@#$%';
            string returnString = '';
            for(integer i = 0; i < strLength; i++)
            {
                Double x = math.random() * charString.length();
                               
                returnString += charString.substring(x.intValue(),x.intValue()+1);
            }
            returnObj.data = returnString.toUpperCase();
        }
        catch(Exception e)
        {
            
        }
        return returnObj;    
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

    global class remoteObject
    {
        public boolean success{get;set;}
        public string message{get;set;}
        public string data{get;set;}
        public map<id,sObject> sObjectMap {get;set;}
        public list<sObject> sObjects {get;set;} 
    }
    
    public static string hashPass(string stringToHash)
    {
    	Blob hashedPass = Crypto.generateDigest('SHA-256', Blob.valueOf(stringToHash));
    	
    	return EncodingUtil.base64Encode(hashedPass);
    }        
    public class customException extends Exception {}
    
    static testMethod void stampForceTest()
    {
    	DateTime dT = System.now();
    	
    	//First create an Event
    	Event__c thisEvent = new Event__c();
    	thisEvent.active__c = true;
    	thisEvent.address__c = '12345 test street';
    	thisEvent.city__c = 'Test City';
    	thisEvent.Default_Stamp_Image__c = 'http://www.somewhere.com/stamp.png';
    	thisEvent.Description__c = 'Test Event';
    	thisEvent.Enable_QR_Codes__c = true;
    	thisEvent.End__c = dT;
    	thisEvent.Missing_Stamp_Image__c = 'http://www.somewhere.com/stamp.png';
    	thisEvent.Postal_Code__c = '55431';
    	thisEvent.Start__c = dT;
    	thisEvent.reward_Email_Template_Id__c = 'some email temp';
    	thisEvent.State__c = 'CA';
    	thisEvent.Title__c = 'Test Event';
    	
    	insert thisEvent;
    	
    	Account thisAccount = new Account();
    	thisAccount.name = 'test Account';
    	insert thisAccount;
    	
    	
    	Sponsorship__c thisSponsor = new Sponsorship__c();
    	thisSponsor.Company__c = thisAccount.id;
    	thisSponsor.Event__c = thisEvent.id;
    	thisSponsor.Is_Stamp_Provider__c = true;
    	thisSponsor.Location_Description__c = 'test location';
    	thisSponsor.Sponsor_Code__c = 'test';
    	thisSponsor.Stamp_Action_Description__c = 'exist';
    	thisSponsor.Stamp_Image_URL__c = 'http://somewhere.com/someImage.png';
    	
    	insert thisSponsor;

    	Stampforce_User__c thisUser = new Stampforce_User__c();
    	thisUser.Company__c = thisAccount.id;
    	thisUser.Email__c = 'test@test.com';
    	thisUser.Firstname__c = 'Frank';
    	thisUser.Lastname__c = 'Jones';
    	thisUser.Password__c = hashPass('testPass');
    	thisUser.Phone__c = '234-623-2342';
    	thisUser.Type__c = 'Admin';
    	
    	insert thisUser;
    	
    	Attendance__c thisAttendance = new Attendance__c();
    	thisAttendance.event__c = thisEvent.id; 
    	thisAttendance.Stampforce_User__c = thisUser.id; 
    	insert thisAttendance; 	
    	
    	Stampforce_Code__c thisCode = new Stampforce_Code__c();
    	thisCode.Code__c = '12345';
    	thisCode.Event__c = thisEvent.id;
    	thisCode.Generated_By__c = thisUser.id;
    	thisCode.Sponsorship__c = thisSponsor.id;
    	    	
    	string signUpData = 'signup-email=Kedafsf76%2B%40gmail.com&signup-firstname=Daniel&signup-lastname=Llewellyn&signup-password=testpass&signup-phone=632-245-6633&signup-company=Woot+Account';
		string loginString = 'login-email=Kedafsf76%2B%40gmail.com&login-password=testpass';
		remoteObject signUp = registerUser(signUpData);
		remoteObject signUpDupe = registerUser(signUpData);
		remoteObject signUpFail = registerUser('not even close to a successful run');
		
		remoteObject login = loginUser(loginString);	
		remoteObject loginFail = loginUser('this aint gonna work');	
		
		remoteObject events = getEvents();		
		
		remoteObject createStamp = createStampCode(thisAccount.id, thisUser.id, thisEvent.id);	
		remoteObject createStampFail = createStampCode('this', 'is', 'fail');
			
		remoteObject registerResult = registerUserForEvent(thisUser.id, thisEvent.id);
		remoteObject registerResultFail = registerUserForEvent('total', 'fail');
		remoteObject registerResultDupe = registerUserForEvent(thisUser.id, thisEvent.id);
		
		remoteObject getStamps = getStamps(thisUser.id, thisEvent.id);
		remoteObject getStampsFail = getStamps('i', 'fail');
		
		remoteObject getUserEvents = getUsersRegisteredEvents(thisUser.id);
		remoteObject getUserEventsFail = getUsersRegisteredEvents('kill me');
		
		remoteObject createStamps = createStampTemplates(thisAttendance.id, thisEvent.id);
		remoteObject createStampsFail = createStampTemplates('total', 'fail');
		
		remoteObject redeemStamp = redeemStampCode(thisAttendance.id, thisEvent.id, '12345');
		remoteObject redeemStampFail = redeemStampCode('Im', 'not', 'correct');
		
		
		remoteObject randomString = generateRandomString(6);    	   
    }
}