trigger chatterSwagger on Chatter_Swagger__c (after insert) 
{
  list<Id> swaggerIds = new list<Id>();
  for(Chatter_Swagger__c cs : Trigger.new)
  {
    if(cs.post_text__c != null)
    {
      swaggerIds.add(cs.id);  
    }
  }
  if(!swaggerIds.isEmpty())
  {
    chatterSwagger.updateTopicMoods(swaggerIds);
  }
}