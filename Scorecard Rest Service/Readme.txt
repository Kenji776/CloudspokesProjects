Creates a simple rest service that listens on /v.9/scorecard/*

Supports GET and PUT Methods.

GET /Challenge_Participant__c ID

Returns JSON Payload with answer and scorecard information. If participant already
has a scorecard, existing card and answers are returned. If not, a blank card is provided
that can be updated. Answer templates are also created. A 'surveyId' attribute must be passed
and the 'createScorecard' must be passed and set to true to create a new scorecard and
blank answer templates. The return payload contains one key with information about the
scorecard, and an array of data about teh answers.

 
PUT /[Challenge_Participant__c ID] <-- optional if XML data included in request body

Update a question answer. This has two modes of operation Single question update mode
is automatically selected if a valid question ID is not passed in the URL. EX
	
https://na12.salesforce.com/services/apexrest/v.9/scorecard/a0FU00000008h9G
	
would invoke the single update method. Whereas
	
https://na12.salesforce.com/services/apexrest/v.9/scorecard/
	
would invoke the bulk update method.
	
Either version can take a ?setScored=true attribute in the URL to mark the scorecard as complete.
	
	Single question update: 
		Updates one question answer at a time. 
		Include the question ID in the URL and any fields to update as well.
		Non updateable fields are automatically removed. Optionally you may pass
		a special setScored attribute. When set to true, it will mark the survey
		as being scored and complete.
		(just because all other fields on that object are either formula or fields that should not be changed)
		
		EXAMPLE CALL
		
		https://na12.salesforce.com/services/apexrest/v.9/scorecard/a0FU00000008h9G?Answer_Text__c=1&setScored=true
		
	Bulk question update
		Updated multiple questions at a time. 
		Include a simple XML data structure in the text portion of the PUT request
		that contains the questions to be updated (a sample XML file is included with this package) 
		Of course you can use this approach all the time as it can update one record at a time just like
		the single method. This just takes a bit more data to operate.
		Currently the only updateable field on a question object is the answer_text__c 
		(just because all other fields on that object are either formula or fields that should not be changed)
		

		EXAMPLE CALL
		
		https://na12.salesforce.com/services/apexrest/v.9/scorecard/?Answer_Text__c=1&setScored=true	

		Request Body Contents:
		<?xml version="1.0" encoding="utf-8"?>
		<Objects>
			<Object type="QwikScore_Question_Answer__c" id="a0FU00000008h9G">
				<field id="Answer_Text__c">4</field>
			</Object>
			<Object type="QwikScore_Question_Answer__c" id="a0FU00000008h9F">
				<field id="Answer_Text__c">1</field>
			</Object>
			<Object type="QwikScore_Question_Answer__c" id="a0FU00000008h9E">
				<field id="Answer_Text__c">3</field>
			</Object>
			<Object type="QwikScore_Question_Answer__c" id="a0FU00000008h9D">
				<field id="Answer_Text__c">2</field>
			</Object>	
		</Objects>


Overall I think this is a pretty solid entry. Really the only thing I wish i could improve upon is standardizing how the
data is returned. It would be nice if you could return custom object types that would be serialized. Cause in most 
cases I'd like to return a success flag, a message about the result of the call, and a list of sObjects that were affected.
Alas you can only return maps, lists and other primatives. *Shrug*, oh well, it's good enough for now.			