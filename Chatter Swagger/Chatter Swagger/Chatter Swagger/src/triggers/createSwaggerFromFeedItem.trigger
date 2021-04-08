trigger createSwaggerFromFeedItem on FeedItem (after insert)
{
    chatterSwagger.createSwagger(trigger.new,  'createdById', 'Body');
}