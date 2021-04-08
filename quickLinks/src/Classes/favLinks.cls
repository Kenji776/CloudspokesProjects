global class favLinks
{
    @RemoteAction
    public static list<favLink__c> getLinks()
    {
        list<favLink__c> links = [select id, name, location__c, owner__c, clicks__c from favLink__c where owner__c = :UserInfo.getUserId() order by clicks__c desc, name];
        return links;
    }
    
    @RemoteAction
    public static boolean addClick(string linkId, integer clicks)
    {
        favLink__c thisLink = new favLink__c(id=linkId,clicks__c=clicks+1);
        update thisLink;
        return true;
    }
    
    @RemoteAction
    public static favLink__c createLink(favLink__c linkToCreate)
    {
        insert linkToCreate;
        return linkToCreate;
    }

    @RemoteAction
    public static boolean deleteLink(id linkId)
    {
        favLink__c thisLink = new favLink__c(id=linkId);
        delete thisLink;
        return true;
    }
    
    static testMethod void testfavLinks()
    {
        User thisUser = [select id from user limit 1];
        favLink__c thisLink = new favLink__c();
        
        thisLink.name =  'testLink';
        thisLink.location__c =  'http://www.google.com';
        thisLink.owner__c = thisUser.id;
               
        favLink__c myLink = createLink(thisLink);
        list<favLink__c> link = getLinks();
        boolean clickAdded = addClick(myLink.id, 0);
        boolean deleteLink = deleteLink(myLink.id);
    }
    
}