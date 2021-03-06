Pirate Chatter Challenge - Chatter Dialects
Daniel Llewellyn (Kenji776)

Chatter Dialects is a translation engine that allows users to have some fun in Salesforce by translating their chatter posts into other languages. It is very flexible, can support infinite languages and translations, is totally dynamic, and comes with a handy translation import utility.
To get started instal the package located at 
https://login.salesforce.com/packaging/installPackage.apexp?p0=04tE0000000QMA2
It will create all the required objects, classes, and triggers. 
Then go to the user object page layout and add the inline visualforce page called chatter_dialects_chooser. This will allow a user to select any created dialect and apply it to themselves. 
Now go to the Chatter Dialects App. Create a new Dialect. For this example, lets call it pirate. Provide the following URL for the import source.
https://docs.google.com/spreadsheet/pub?key=0Ak4fc3zIG4iydEUtUlY2RDQ5clhpMmwzMEZVYnBUc0E&single=true&gid=0&output=csv
That is a shared google doc which contains all the english to pirate translations. Save the record. Click the import translations button. In a moment you should get a dialog that informs you that translatons were created (if you get an error, make sure docs.google.com has been added to your authorized remote sites). The page will reload and you will see a list of translations in the related list.
Now navigate to your user record and you should see pirate as a possible option to select. Select it and click update. Pirate language is now applied to your chatter posts. Go ahead and make a post in chatter that includes some of the translatable words, such as food, money, grave, or you. Your post should be translated automatically to Pirate!
As an administrator your may also disable or enable Chatter Dialects for your entire org by use of the custom setting that gets created. Simply check or uncheck the enable box on the custom setting record to control the use of Chatter Dialects.
As you can see Chatter Dialects is easy to use, flexible, and will scale to meet any number of desired languages/dialects.
