Install and Use
----------------------
1) Install the class and RSS Feed object into your org.

2) Create a Chatter group you wish to post to, or go to an existing group

3) Get the group Id from the URL

4) Get the URL of the RSS Feed you want to post to your chatter group. For example, you could use my blogs RSS feed at 
   http://iwritecrappycode.wordpress.com/feed/

5) Create a new RSS Feed object. Enter the chatter group ID and RSS feed url. Also make sure to check the active box.

6) Enter the URL of your RSS feed in your remote site settings.
   - Side note, if you plan to have a lot of these you may want to build some kind of RSS proxy site where you 
     can pass the URL of the desired feed as a GET parameter and it will return the content of that feed for you.
     This would save you from having to add tons of remote sites in your configs.

7) Save the RSS feed object.

8) Go to setup->develop->apex classes -> schedule apex

9) Schedule the rssForChatter class to run on any schedule you desire. I would recommend daily at most.

10) You are done. You can hit the 'Get RSS Now' button the on the RSS feed object and check your chatter group to test it, or just wait for the scheduled job to run. Any problems should be logged in the last run result field on the object.

rssToChatter will only add posts that are newer than it's 'last run date'. For testing you may want to set that back a ways to a date before some content was added to your RSS feed.


Installable Package Link

https://login.salesforce.com/packaging/installPackage.apexp?p0=04tE0000000Pce8
version 1.1

Watch the video here

http://xerointeractive.com/rssToChatter.swf