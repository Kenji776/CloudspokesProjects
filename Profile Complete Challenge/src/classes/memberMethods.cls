public class memberMethods
{
   
    //default variables
    public static double baseProfileComplete = 10.00; 
    public static string defaultPicUrl  = 'whatever.jpg'; 

    //takes a list of member__c records and calculates their profile score.
    public  static void calculateProfileScore(list<member__c> members)
    {
        for(member__c member : members)
        {
            member.Profile_Complete__c = baseProfileComplete;
            
            //If their address information has been filled out
            if(member.Address_Line1__c != null && member.City__c != null && member.Country__c != null && member.State__c != null && member.Zip__c != null && member.Time_Zone__c  != null)
            {
                 member.Profile_Complete__c += 30.00;   
            }          
            //if they have selected a payment method
            if(member.paperwork_Received__c != null && member.Preferred_Payment__c != null)
            {
                member.Profile_Complete__c += 10.00;   
            }
            //if they have selected a non default profile picture
            if(member.Profile_Pic__c != defaultPicUrl)
            {
                member.Profile_Complete__c += 10.00;   
            }                       
            //if have a company
            if(member.Company__c != null)
            {
                member.Profile_Complete__c += 02.50; 
            }
            //if they have a school
            if(member.School__c != null)
            {
                member.Profile_Complete__c += 02.50; 
            }
            //if they have a summary/bio
            if(member.Summary_Bio__c != null)
            {
                member.Profile_Complete__c += 02.50; 
            }
            //if they have a quote
            if(member.Quote__c != null)
            {
                member.Profile_Complete__c += 02.50; 
            }                                    
        }
    }    
    
    @isTest
    public static void memberMethods()
    {
        
        //create an insert a test member
        Member__c thisMember = new Member__c();
        thisMember.email__c = 'test@test.com';
        thisMember.Username__c = 'testman!';
        thisMember.Profile_Pic__c = defaultPicUrl;
        insert thisMember;
        
        //verify they only have the base profile complete percent
        thisMember = [select id, Profile_Complete__c from member__c where id = : thisMember.id];
        system.assertEquals(baseProfileComplete,thisMember.Profile_Complete__c);
        
        //fill out their profile
        thisMember.Address_Line1__c = '5555 TEST Street';
        thisMember.City__c = 'Nowhere Town';
        thisMember.Country__c = 'US';
        thisMember.State__c = 'MN';
        thisMember.Zip__c = '52342';
        thisMember.Time_Zone__c  = 'Eastern Time (US & Canada) -- (GMT-05:00)';
        thisMember.Paperwork_Received__c = 'true';
        thisMember.Preferred_Payment__c = 'Paypal';
        thisMember.Profile_Pic__c = 'test.jpg';
        thisMember.Company__c = 'test';
        thisMember.School__c ='harvard';
        thisMember.Summary_Bio__c = 'Im not real';
        thisMember.Quote__c = 'This is a quote';
        
        update thisMember;
        
        //make sure their profile complete percent is that maximum it can be (which is 70% as of this writting)
        thisMember = [select id, Profile_Complete__c from member__c where id = : thisMember.id];
        system.assertEquals(70.00,thisMember.Profile_Complete__c);        
        
    }
}