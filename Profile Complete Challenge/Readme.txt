Profile Completion Challenge
Kenji776

Outline:
A simple class and trigger to update the percentage a persone has completed their cloudspokes profile based on
several rules.

Install:

Either install the package from https://login.salesforce.com/packaging/installPackage.apexp?p0=04tE0000000PdH7
or drop the Apex trigger and class in your org. 

That should be all you have to do. You may optionally change the base percent complete that a profile has just for existing, and the default 
url for the profile image. If you change the base percent complete, you will have to change the very last assert statment, as it expects
to only be able to reach 70% complete for a full profile. Just change the 70.00 to your new base percent, plus 60.00.

The defaultProfileImageURl is just used to compare. If any value other than that is found in the users profile picture field, they are marked
as having completed their profile picture section. Change this to whatever the profile picture defaults to to get the comparison working.