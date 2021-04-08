trigger filterChatterUserStatus on User (before insert, before update) 
{
	String[] filterFields = new String[] {'CurrentStatus'};
	redacted.filterObject(trigger.new,filterFields,'Id');
}