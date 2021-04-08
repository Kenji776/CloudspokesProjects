public class getJsonEvents {
    public JsonObject json {get;set;}
    
    /** invoked on an Ajax request */    
    public void getEvents() 
    {
    	try
    	{
	        Map<string,string> params = ApexPages.currentPage().getParameters();
	        json = new JsonObject();
	        
	        // Do SOQL query to see if there are any records !
	       List<Events__c> records = new List<Events__c>();
	        datetime startDate = datetime.newInstance(0);
	        Integer startInt = integer.valueOf(params.get('start'));
	        startDate = startDate.addSeconds(startInt);
	        
	        datetime endDate = datetime.newInstance(0);
	        Integer endInt = integer.valueOf(params.get('end'));
	        endDate = endDate.addSeconds(endInt);
	                
	        records = [Select Id, 
	        					  Study_N__c,
	        					  Event_N__c,
	        					  status__c,
	        					  Start_Date__c,
	        					  End_Date__c,
	        					  Project_Manager__c,
	        					  Project_Associate__c,
	        					  Project_Name__c,
	        					  Project_Number__c,
	        					  Client__c,
	        					  Location__r.name,
	        					  Local_Remote_Indicator__c,
	        					  All_Day__c
	        					  
	        					  from Events__c 
	        					  where 
	        					  Start_Date__c>=:startDate and 
	        					  End_Date__c<=:endDate ];
	        List<JSONObject.value> values = new List<JSONObject.value>(); 

			System.debug(Logginglevel.ERROR);
			
			System.debug(Logginglevel.INFO, 'Start Param '+params.get('start')+' End Param' +params.get('end'));	 
                  
	        if (!records.isEmpty()) 
	        {
	            // Jsonify the results !
	            String ProjectName;
	            for (Events__c c : records) 
	            {
	            	try
	            	{
		                JSONObject cjson = new JSONObject();
		                cjson.putOpt('"id"', new JSONObject.value(c.Id));
		                
		                ProjectName = c.Project_Name__c.replace('"' , '');
		                
		                
		                cjson.putOpt('"title"', new JSONObject.value(c.Project_Number__c + ' ' +ProjectName+ ' N: '+c.Event_N__c+ ' ' +c.Location__r.name));
		                cjson.putOpt('"allDay"', new JSONObject.value(c.All_Day__c));
		
		                //Convert the times into unix timestamp format for the calendar
		                Long startDateTime = c.Start_Date__c.getTime()/1000;
		                Long endDateTime = c.End_Date__c.getTime()/1000;
		
		                cjson.putOpt('"start"', new JSONObject.value(startDateTime.intValue()));
		                cjson.putOpt('"end"', new JSONObject.value(endDateTime.intValue()));
		                cjson.putOpt('"client"', new JSONObject.value(c.Client__c));
		                cjson.putOpt('"PM"', new JSONObject.value(c.Project_Manager__c));
		                cjson.putOpt('"PA"', new JSONObject.value(c.Project_Associate__c));
		                cjson.putOpt('"status"', new JSONObject.value(c.status__c));
		                cjson.putOpt('"test"', new JSONObject.value(ProjectName));
		                cjson.putOpt('"linkurl"', new JSONObject.value('https://na2.salesforce.com/'+c.Id));
		                cjson.putOpt('"className"', new JSONObject.value(c.status__c + ' ' + c.Id + ' ' + c.Local_Remote_Indicator__c));
		                cjson.putOpt('"StudyN"', new JSONObject.value(c.Study_N__c));         
		                cjson.putOpt('"Location"', new JSONObject.value(c.Location__r.name)); 
		                cjson.putOpt('"LRIndicator"', new JSONObject.value(c.Local_Remote_Indicator__c)); 
		                values.add(new JSONObject.value(cjson));
		                
	            	}
	            	catch(Exception e)
	            	{
						System.debug(Logginglevel.ERROR);
						
						System.debug(Logginglevel.INFO, 'ERROR: Start Param '+params.get('start')+' End Param: ' +params.get('end')+' Error: '+e.getMessage());
	            	}
	            }    
	        }
	        else
	        {
	            JSONObject cjson = new JSONObject();
	            cjson.putOpt('"data"', new JSONObject.value('No query records found. Start Param '+params.get('start')+' End Param' +params.get('end')));                  
	            values.add(new JSONObject.value(cjson));           	
	        	
	        } 
			json.putOpt('events', new JSONObject.value(values));
	    }
	    catch(Exception e)
	    {
	         Map<string,string> params = ApexPages.currentPage().getParameters();
	         json = new JsonObject();	    	
	    	 List<JSONObject.value> values = new List<JSONObject.value>();
	         JSONObject cjson = new JSONObject();
	         cjson.putOpt('"data"', new JSONObject.value('ERROR. Start Param: '+params.get('start')+' End Param: ' +params.get('end')+ 'Error: '+e.getMessage()));                  
	         values.add(new JSONObject.value(cjson));  
	         json.putOpt('events', new JSONObject.value(values));   	 
	    }	    
    }

 

    // Returns the JSON result string
    public String getResult() 
    {
       string jsonString = json.ValuetoString();
       jsonString = jsonString.replace('{events: [' , '[');
       jsonString = jsonString.replace('}]}' , '}]');
       return jsonString;
       
    }
    
}