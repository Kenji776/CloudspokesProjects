public class signHereController {

    public string renderAs{get;set;}
    public Quote__c thisQuote;
    public Contact primaryContact{get;set;}
    public Date currentDate{get;set;}
    public String businessLogo{get;set;}
    public String accountName{get;set;}
    public string accountContactName{get;set;}
    public string accountAddress{get;set;}
    public string businessName{get;set;}
    public string businessPhone{get;set;}
    public string businessContactName{get;set;}
    public string businessContactTitle{get;set;}
    public list<Quote_Line_Item__c> quoteLineItems{get;set;}
    public string terms{get;set;}
    
    public signHereController(ApexPages.StandardController controller) {
        SignHereSettings__c settings = SignHereSettings__c.getOrgDefaults();
        
        thisQuote = [select id,
                            name,
                            Owner.name,
                            Owner.title,
                            account__r.name, 
                            account__r.billingStreet, 
                            account__r.billingCity, 
                            account__r.billingState, 
                            account__r.billingCountry, 
                            account__r.billingPostalCode,
                            (select 
                                name, 
                                id, 
                                Product_c__r.name, 
                                Product_c__r.Product_Name__c, 
                                Quantity__c, 
                                Style__c 
                                from Quote_Line_Items__r
                            )
                            from Quote__c where id =  :controller.getRecord().id];
        
        list<AccountContactRole> primaryContact = [select Account.id, 
                                                          Contact.Name, 
                                                          Contact.Phone, 
                                                          Contact.Title 
                                                          from AccountContactRole 
                                                          where accountId = : thisQuote.account__c and
                                                          IsPrimary = true];
        
        quoteLineItems = new list<Quote_Line_Item__c>();
        if(!thisQuote.Quote_Line_Items__r.isEmpty())
        {
            quoteLineItems = thisQuote.Quote_Line_Items__r;
        }
        Organization myOrg = [Select Phone, Name From Organization o];
        
        //set variables
        currentDate = date.today();
        string logoWidth = Settings.Width__c != null ? Settings.Width__c+'px' : '100%';
        string logoHeight = Settings.Height__c != null ? Settings.Height__c+'px' : '100%';
        if(Settings.Organization_Logo_Image__c != null)
        {
            businessLogo = '<img src="'+EncodingUtil.urlDecode(Settings.Organization_Logo_Image__c,'utf-8')+'" class="businessLogo" width="'+logoWidth+'" height="'+logoHeight+'" />';
        }
        accountName = thisQuote.account__r.name;
        accountAddress = thisQuote.account__r.billingStreet + ', ' + thisQuote.account__r.billingCity + ', ' + thisQuote.account__r.billingState + ', ' + thisQuote.account__r.billingPostalCode + ' ' + thisQuote.account__r.billingCountry;
        businessName = myOrg.name;
        businessPhone = myOrg.phone;
        businessContactName = thisQuote.Owner.Name;
        businessContactTitle = thisQuote.Owner.Title;
        if(!primaryContact.isEmpty())
        {
            accountContactName = primaryContact[0].Contact.Name;
        }

        list<Terms_Conditions__c> termsObj = [select id,name,Terms__c,Is_Active__c from Terms_Conditions__c where is_active__c = true];
        if(!termsObj.isEmpty())
        {
            terms = termsObj[0].Terms__c;
        }    
        if(ApexPages.currentPage().getParameters().get('pdf') != null && ApexPages.currentPage().getParameters().get('pdf') == 'true') 
        {
            renderAs = 'pdf';
            if(ApexPages.currentPage().getParameters().get('force_download') != null && ApexPages.currentPage().getParameters().get('force_download') == 'true') 
            {
                string fileName = 'Line Item Report For Quote '+thisQuote.name+'.pdf';
                if(apexPages.currentPage().getParameters().get('filename') != null)
                {
                    fileName = apexPages.currentPage().getParameters().get('filename') +'.pdf';
                }
                Apexpages.currentPage().getHeaders().put('content-disposition', 'attachemnt; filename='+fileName);
            }               
        }
       
    }

}