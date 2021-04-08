@isTest(OnInstall=true)
private class Test_MoveAttachment_Con{
    static testMethod void  testController(){
        Account accObj = new Account(Name='Test Account##1');
        insert accObj;
        Attachment attObj = new Attachment(Name='SampleTestFile#',Body=Blob.valueOf('12432'),ParentId =accObj.Id);
        insert attObj ;
        ApexPages.StandardController mc = new ApexPages.StandardController(accObj);
        //init the controller
        MoveAttachments_Con  controller = new MoveAttachments_Con(mc);
        controller.attachmentWrapperList[0].isChecked = true;
        controller.libraryWrapperList[0].isChecked = true;
        controller.copyAttachment();
        controller.moveAttachment();
        System.assertEquals(0,[SELECT Id FROM Attachment WHERE parentId=:accObj.Id].size());
        controller.cancel();
    }
}