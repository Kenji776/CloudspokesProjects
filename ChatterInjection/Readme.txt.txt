To inject custom chatter content my approach loads some custom javascript, and uses that javascript to call out to a listening visualforce page that is hosted on a Salesforce site. That visualforce page has a controller that is responsible for creating the actual content. Through customization of that apex class you could deliver whatever content you wanted into the chatter box. 

Setup

1) Create a salesforce site
2) Copy and paste the code from chatterContentController.class into a new apex class and save.
3) Copy and poaste the code from chatterContent.page into a new visualforce page and save.
4) Make both those resources available to through the Salesforce site. (modify the public access settings and enable the apex class and page near the bottom of the profile)
5) Navigate to a chatter user page
6) Open firebug and open the javascript execution console
7) Copy and paste the code from chatterPageScript.js
8) Modify the URL variable to reflect the location of your page that will provide the content 
9) Run the script
10) The data should appear on the users chatter page below the recent files on the right side.