trigger memberTriggers on Member__c (before insert, before update)
{
    list<member__c> memberData = trigger.new;
    memberMethods.calculateProfileScore(memberData);
}