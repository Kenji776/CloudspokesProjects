global class packageClasses 
{

    public package__c activePackage{get;set;}
    public Id rootPackageId{get;set;}
    public boolean isClone{get;set;}
    public string mode{get;set;}
    
    //make this an extension so we can use these classes in a visualforce page that is setup to override the standard buttons.
    public packageClasses(ApexPages.StandardController controller) 
    {

    }
    
    //finds details about a package given the id. It also checks to see if there is a clone arguments in the url. If so, then clone the packages passed in, refresh the page and go 
    //to the edit version. Otherwise just go to the edit version.
        
    global void getPackage()
    {  
        
        if(rootPackageId == null)
        {
            rootPackageId= Apexpages.currentPage().getParameters().get('id');
        }
        
        if(Apexpages.currentPage().getParameters().containsKey('clone') && Apexpages.currentPage().getParameters().get('clone') == 'true')
        {
            isClone = true;            
        }
        else
        {
            isClone = false;      
                 
        }
        if(!isClone)
        {
            mode = 'Edit';
            activePackage = [select id, name, Description__c, Policy_Holder__c, Segment__c, Trust_Type__c from package__c where id = :rootPackageId];
        }
        else
        {      
            mode = 'Copy';         
            activePackage = clonePackage(rootPackageId);
        }
                  
    }
        
    @RemoteAction
    global static list<Package_provisions__c> getAssignedProvisions(id packageId)
    {
        return  [select Provision__r.name, Provision__r.Affected_Party__c, Provision__r.Category__c, Provision__r.Sub_category__c from Package_provisions__c where package__c = :packageId];
    }
    
    @RemoteAction
    global static list<Provision__c> getAvailableProvisions(list<id> assignedProvisions)
    {
        return  [select name, Affected_Party__c, Category__c, Sub_category__c from Provision__c where id  not in :assignedProvisions];
    }
            
    @RemoteAction 
    global static void removePackageProvision(id provisionId, id packageId)
    {
        list<Package_provisions__c> deleteProv = [select id from Package_provisions__c where Package__c= :packageId and Provision__c= :provisionId];
        delete deleteProv;
    }
        
    @RemoteAction
    global static Package_provisions__c addPackageProvision(id provisionId, id packageId)
    {
        Package_provisions__c newProv = new Package_provisions__c(Package__c=packageId,Provision__c= provisionId);
        insert newProv;
        return newProv;
    }
    
    @RemoteAction 
    global static Package__c clonePackage(Id packageIdToClone)
    {

        Package__c packageToClone= [select id, name, Description__c, Policy_Holder__c, Segment__c, Trust_Type__c from package__c where id = :packageIdToClone];
        Package__c newPackage =  packageToClone.clone(false,true);
        newPackage.name = 'Copy of ' + newPackage.name;                       
        insert newPackage;

        list<Package_provisions__c> provisionsOnOriginal = [select id, Package__c, Provision__c from Package_provisions__c where Package__c = :packageIdToClone];
        list<Package_provisions__c> provisionsToCreate = new list<Package_provisions__c>();
        for(Package_provisions__c p : provisionsOnOriginal)
        {
            Package_provisions__c thisProv= p.clone();
            thisProv.package__c = newPackage.id;
            provisionsToCreate.add(thisProv);
        }
        insert provisionsToCreate;             
        return newPackage;
    } 
        
    public pageReference save()
    {
        update  activePackage;
  
        
        PageReference packagePage = new ApexPages.StandardController(activePackage).view();

        packagePage.getParameters().put('mode','Edit');
        packagePage.getParameters().put('clone','false');
        
        return packagePage;         
    }

    public pageReference cancel()
    {
    
        delete activePackage;
        Package__c returnTo = new Package__c(id=rootPackageId);
        system.debug('-------------------------------- RETURNING TO' + rootPackageId);
        PageReference packagePage = new ApexPages.StandardController(returnTo).view();            
        return packagePage;            
    }
                   
    static testMethod void testPackageClasses()
    {
        Package__c thisPackage = new Package__c(); 
        thisPackage.name = 'Test Package';
        thisPackage.Description__c = 'Test Package';
        thisPackage.Policy_Holder__c = 'Test';
        thisPackage.Segment__c = 'Test Package';
        thisPackage.Trust_Type__c = 'Test Package'; 
        
        insert thisPackage;

        Provision__c thisProvision = new Provision__c();
        thisProvision.name = 'test prov 1'; 
        thisProvision.Affected_Party__c = 'me';
        thisProvision.Category__c  = 'test'; 
        thisProvision.Sub_category__c = 'test1';
        
        insert thisProvision;


        ApexPages.StandardController sc = new ApexPages.standardController(thisPackage);         
        //create reference to the page      
        packageClasses pc = new packageClasses(sc);
        PageReference copyPackage = Page.copyPackage;
        system.test.setCurrentPageReference(copyPackage);
        
        //get the details about the package
        copyPackage.getParameters().put('id',thisPackage.id);
        pc.getPackage();
        
        //Now make it clone it
        copyPackage.getParameters().put('clone','true');
        pc.getPackage();
        
        
        //Find the provisions we can add to this package
        list<Provision__c> availableProvisions =  getAvailableProvisions(new list<id>());
        
        //Create a new package provision for the original package
        for(Provision__c prov : availableProvisions)
        {
            Package_provisions__c newProv1 = packageClasses.addPackageProvision(prov.id, thisPackage.id) ;   
        }
        
        //Get the assigned provisions for the package
        list<Package_provisions__c>  assignedProvisions = getAssignedProvisions(thisPackage.id);
        
        //Now remove all the provisions
        for(Package_provisions__c prov : assignedProvisions)
        {
            packageClasses.addPackageProvision(prov.Provision__c, thisPackage.id);   
        }   
        
        pc.save();
        
        pc.cancel();
        
    }
}