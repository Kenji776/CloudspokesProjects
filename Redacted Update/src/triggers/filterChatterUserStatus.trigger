trigger filterChatterUserStatus on User (before update) 
{
    //when a user updates, we want to filter their current status field.
    String[] filterFields = new String[] {'CurrentStatus'};
    redacted.filterObject(trigger.new,filterFields);   
}