@RestResource(urlMapping='/v.9/login/*') 
global with sharing class loginService  
{
	//allows the getting of a salesforce username and id based on a 3rd party service and username
	@HttpGet
	global static map<string,string> doGet(RestRequest req, RestResponse res) 
	{
		//map of strings to return with information about the run
		map<string,string> returnMap = new map<string,string>();
			
		String message = 'Query Ran';
		Boolean success = true;
		String sfUsername;
		String sfUserId;
		String service;
		String username;

		try
		{
			//make sure the user has passed in both the service name and username and get their decoded values. Toss error if either is missing
			if(req.params.containsKey('service') && req.params.containsKey('username'))
			{
				service = EncodingUtil.urlDecode(req.params.get('service'), 'UTF-8').trim();
				username = EncodingUtil.urlDecode(req.params.get('username'), 'UTF-8').trim();
			}
			else
			{
				throw new customException('Missing required paramter. Please specify a username and service. Please note all keys names are case sensative. Keys should be lower case.');
			}
			
			//find the user that has information that is the same as that provided
			list<User> users = [select 
									Id, 
									username,
									isActive
								from 
									user 
								where 
									Third_Party_Account__c = :service and
									Third_Party_Username__c = :username
								LIMIT 1];
			//if a user is found, set the variables to return. if not, toss an error
			if(!users.isEmpty())
			{		
				//make sure the user is active, if not, let the user know that
				if(users[0].isActive)
				{
					sfUsername = users[0].username;
					sfUserID = users[0].id;
				}
				else
				{
					throw new customException('A user was located but they are inactive. Please active the user to retreive username');
				}
			}
			else
			{
				throw new customException('No user could be found with specified service and username');
			}		
		}
		//error handling for reportng back to the user
		catch(Exception e)
		{
			message = e.getMessage();
			success = false;		
		}	
		
		//set the data to be returned
		returnMap.put('Success',string.valueOf(success));
		returnMap.put('Message',message);
		returnMap.put('SFuserId', sfUserID );
		returnMap.put('SFusername', sfUsername );
		returnMap.put('Service', service );
		returnMap.put('Username', username );
		
		return returnMap;
	}

	//This method will allow the updating a user Third_Party_Account__c and Third_Party_Username__c based on
	//a salesforce username, or salesforce user id
	@HttpPut 
	global static map<string,string> doPut(RestRequest req, RestResponse res) 
	{
		//map of strings to return with information about the run
		map<string,string> returnMap = new map<string,string>();
				
		String message = 'Update Ran';
		Boolean success = true;
		String sfUsername;
		String sfUserid;
		String service;
		String username;
		try
		{
			//make sure user has passed in a service and a username, and also included either a salesforce user username, or a salesforce user id
			//either one will work.
			if(req.params.containsKey('service') && req.params.containsKey('username') && (req.params.containsKey('sfusername') || req.params.containsKey('sfuserid')) )
			{
				//get the values for the variables and assign them
				service = EncodingUtil.urlDecode(req.params.get('service'), 'UTF-8').trim();
				username =  EncodingUtil.urlDecode(req.params.get('username'), 'UTF-8').trim();
				if(req.params.containsKey('sfusername')) sfUsername =  EncodingUtil.urlDecode(req.params.get('sfusername'), 'UTF-8').trim();
				if(req.params.containsKey('sfuserid')) sfUserId = EncodingUtil.urlDecode(req.params.get('sfuserid'), 'UTF-8').trim();
			}
			else
			{
				//if info is missing, toss an error
				throw new customException('Missing required paramter. Please specify a username and service, and either a salesforce username or ID to update. Please note all keys are case sensative. Keys should be lower case.');
				
			}
			
			//now find any user where there is a match on the salesforce user username or salesforce user id
			list<User> users = [select id, username from user where username = :sfUsername or id = :sfUserId limit 1];
			
			//if a match is found, set the values on it to the ones that were passed in
			if(!users.isEmpty())
			{
				User updateUser = new User(id=users[0].id);
				sfUserID = users[0].id;
				sfUsername = users[0].username;
				updateUser.Third_Party_Account__c = service;
				updateUser.Third_Party_Username__c = username;
				update updateUser;				
			}
			//otherwise toss an error letting the user know the update could not be completed
			else
			{
				throw new customException('No user with that name or id could be located');
			}						
		}
		//graceful error handling
		catch(Exception e)
		{
			message = e.getMessage();
			success = false;		
		}	
		
		//set the values to be returned to the user
		returnMap.put('Success',string.valueOf(success));
		returnMap.put('Message',message);
		returnMap.put('SFuserId', sfUserID );
		returnMap.put('SFusername', sfUsername );
		returnMap.put('Service', service );
		returnMap.put('Username', username );
		
		//return the data
		return returnMap;
	}
	
	@isTest
	public static void unitTests()
	{
		
		User thisUser = [select name, id, username, Third_Party_Account__c, Third_Party_Username__c from user limit 1];
		
        RestRequest req = new RestRequest(); 
        RestResponse res = new RestResponse();        
 		req.requestURI = 'https://na12.salesforce.com/services/apexrest/v.9/login'; 
 		
 		//run get test with missing information              
        req.httpMethod = 'GET';        
        doGet(req,res);		
        
        //run get test with bad information      
        req.httpMethod = 'GET';
        req.addParameter('username','fail');
        req.addParameter('service','fail');
        doGet(req,res);

        //run put test with missing information
 		req.requestURI = 'https://na12.salesforce.com/services/apexrest/v.9/login';
 		req.httpMethod = 'PUT';     
        doPut(req,res);

        //run put test with missing information
 		req.requestURI = 'https://na12.salesforce.com/services/apexrest/v.9/login';
 		req.httpMethod = 'PUT';   
 		req.addParameter('username', 'test');
        req.addParameter('service','Twitter');
        req.addParameter('sfuserid', 'somebadid'); 		  
        doPut(req,res);
                
        //run put test with good information
		req.httpMethod = 'PUT';   
 		req.addParameter('username', 'test');
        req.addParameter('service','Twitter');
        req.addParameter('sfuserid', thisUser.id); 		  
        doPut(req,res);	
        
        //run get test with good information
 		req.httpMethod = 'GET';         
 		req.addParameter('username', 'test');
        req.addParameter('service','Twitter');        
        doGet(req,res);	     
           
	}
	public class customException extends Exception {}
}