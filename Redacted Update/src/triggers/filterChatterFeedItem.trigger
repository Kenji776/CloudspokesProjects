trigger filterChatterFeedItem on FeedItem (before insert, before update) 
{
    String[] filterFields = new String[]{'Body'};

    redacted.filterObject(trigger.new,filterFields);   
}