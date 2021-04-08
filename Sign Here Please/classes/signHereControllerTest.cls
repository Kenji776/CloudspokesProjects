@isTest
private class signHereControllerTest
{
    static testmethod void runTest1()
    {
        SignHereSettings__c settings = new SignHereSettings__c();
        settings.Organization_Logo_Image__c = 'http://www.google.com/image.gif';
        insert settings;
        
        Account testAccount = new Account();
        testAccount.name = 'test account';
        insert testAccount;
        
        Contact testContact = new Contact();
        testContact.firstname = 'test';
        testContact.lastname = 'guy';
        testContact.accountId = testAccount.id;
        insert testContact;
        
        AccountContactRole thisRole = new AccountContactRole();
        thisRole.accountId = testAccount.id;
        thisRole.contactId = testContact.id;
        thisRole.isPrimary = true;
        thisRole.role = 'Primary';
        insert thisRole;
        
        Quote__c thisQuote = new Quote__c();
        thisQuote.Account__c = testAccount.id;
        insert thisQuote;
        
        Quote_Line_Item__c testLineItem = new Quote_Line_Item__c();
        testLineItem.quote__c = thisQuote.id;
        insert testLineItem;

        PageReference pageRef = Page.signHere;
        pageRef.getParameters().put('pdf','true');
        pageRef.getParameters().put('force_download','true');
        Test.setCurrentPageReference(pageRef);

        ApexPages.StandardController sc = new ApexPages.standardController(thisQuote);
        // create an instance of the controller
        signHereController myPageCon = new signHereController(sc);  
    }

}