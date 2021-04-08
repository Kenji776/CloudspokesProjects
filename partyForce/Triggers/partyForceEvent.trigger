trigger partyForceEvent on Party_Force_Event__c (before insert, before update) 
{
	list<Id> eventIds = new list<Id>();
	for(Party_Force_Event__c event :Trigger.new)
	{
		if(event.IsFutureContext__c)
		{
			event.IsFutureContext__c = false;
		}
		else
		{
			eventIds.add(event.id);
		}
	}
	
	if(!eventIds.isEmpty())
	{
		partyForce.geoCodeAddress(eventIds);
	}
}