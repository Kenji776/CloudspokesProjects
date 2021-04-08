public class MoveAttachments_Con {
    public Boolean showBlock{get;set;}
    public List<AttachmentWrapper> attachmentWrapperList{get;set;}
    public List<LibraryWrapper> libraryWrapperList {get;set;}
    String recId;

    public MoveAttachments_Con(ApexPages.StandardController controller) {
        recId = controller.getId();
        populateWrapper();
    }
    
    public void populateWrapper(){
        attachmentWrapperList = new List<AttachmentWrapper>();
        libraryWrapperList = new List<LibraryWrapper>();
        for(Attachment attachmentObj:[SELECT Body,BodyLength,ContentType,Name,ParentId FROM Attachment WHERE ParentId =:recId]){
            AttachmentWrapper tempWrapper = new AttachmentWrapper();
            tempWrapper.attachmentObj = attachmentObj;
            attachmentWrapperList.add(tempWrapper );
            showBlock = true; 
        }
        
        for(ContentWorkspace libraryObj: [SELECT Description,Id,Name,TagModel FROM ContentWorkspace]){
            LibraryWrapper tempWrapper = new LibraryWrapper();
            tempWrapper .libraryObj= libraryObj;
            libraryWrapperList.add(tempWrapper);
        }
    }
    
    public Pagereference moveAttachment(){
        delete createContent();
        return new Pagereference('/'+recId);
    }
    
     public Pagereference copyAttachment(){
         createContent();
         return new Pagereference('/'+recId);
     }
     
     public Pagereference cancel(){
         return new Pagereference('/'+recId);
     }
    
    public List<Attachment> createContent(){
        List<Attachment> attachmentList = new List<Attachment>();
        List<ContentWorkspaceDoc> contentWorkspaceList = new List<ContentWorkspaceDoc>();
        List<ContentVersion> contentVersionList = new List<ContentVersion>();
        //iterate through the wrapper list
        for(AttachmentWrapper wrapObj:attachmentWrapperList){
            //check which records are selected
            if(wrapObj.isChecked){
                //create content object from wrapper
                ContentVersion content = new ContentVersion();
                content.versionData =  wrapObj.attachmentObj.Body;
                content.title = wrapObj.attachmentObj.Name;
                content.pathOnClient = '/'+wrapObj.attachmentObj.Name;
                contentVersionList.add(content);
                attachmentList.add(wrapObj.attachmentObj);
            }
            
        }
        
        if(!contentVersionList.isEmpty()){ 
            //insert the content version records to create content
            insert contentVersionList;
            //query the ContentDocument Id for the newly created Content Versions
            contentVersionList = [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN:contentVersionList ];
            
            for(LibraryWrapper libWrap: libraryWrapperList){
                    //check which libraries are selected
                    if(libWrap.isChecked){
                        for(ContentVersion tempContent:contentVersionList){
                                //map the content to the selected libraries
                                ContentWorkspaceDoc work = new ContentWorkspaceDoc(ContentDocumentId= tempContent.ContentDocumentId,ContentWorkspaceId=libWrap.libraryObj.Id);
                                contentWorkspaceList.add(work );
                        }
                    }
                }
           if(!contentWorkspaceList.isEmpty()) insert contentWorkspaceList;
        }    
        
        return attachmentList;
    }
    
    public class AttachmentWrapper{
        public Attachment attachmentObj{get;set;}
        public Boolean isChecked{get;set;}
        public AttachmentWrapper(){
            attachmentObj = new Attachment();
            isChecked=false;
        }
    }
    
    public class LibraryWrapper{
        public ContentWorkspace libraryObj{get;set;}
        public Boolean isChecked{get;set;}
        public LibraryWrapper(){
            libraryObj = new ContentWorkspace();
            isChecked=false;
        }
    }
}