trigger filterChatterFeedComment on FeedComment (before insert, before update) 
{
    String[] filterFields = new String[] {'CommentBody'};
    redacted.filterObject(trigger.new,filterFields); 
}