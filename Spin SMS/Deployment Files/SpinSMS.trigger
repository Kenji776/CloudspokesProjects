trigger sendSMSMessage on Spin_SMS_Message__c (after insert) 
{
  list<String> messageIds = new list<String>();
  list<String> numbers= new list<String>();
  
  for(Spin_SMS_Message__c message : Trigger.new)
  {
    if(message.Message_Direction__c == 'Outbound')
    {
      messageIds.add(message.id);
      numbers.add(message.MatchingPhone__c);
    }
  }
  
  system.debug('Sending Numbers to be messaged' + messageIds);
  SpinSMS.sendSMSmessage(messageIds, numbers);
}