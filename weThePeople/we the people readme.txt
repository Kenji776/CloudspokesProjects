We The People
Mobile Town Hall Application
Kenji776


We the people is a simple force.com hosted (visualforce) application built using jQuery mobile
and associated schema that will allow administrators to organize meetings at their stores, create
ideas and let meeting attendees vote on those ideas. The application is easy to use, and very intuitive.

Administrators can install the application from by unmanaged package by visiting

https://login.salesforce.com/packaging/installPackage.apexp?p0=04tE0000000QaND

while logged into their Salesforce organization. A new app will be available called 'We the People'.
You can now create a store. By entering an address and clicking save, the geolocation elements should
be updated automatically using google maps. When users start the application
their location is also automatically calculated so distance between them and the store can be shown.

After a store has been created an administrator can create town hall meetings for that store, and ideas
to be discussed at those meetings. There are various rollups that provide statistics and tracking about
the ideas and associated votes.

Users may start the application by clicking the 'We the people' tab in the same Salesforce application.
They will be presented a simple interface where they are prompted to choose a store, then a meeting, and
finally an idea. There they can see the idea details and vote up or down. Once a vote has been cast a user
will not be allowed to vote again for that idea, or change their vote. Administrators can change votes in
salesforce, but not from the application.

After the meeting is over administrators can easily see the results of the votes by looking the meeting and 
idea objects, or running reports against the various provided talley fields.

You will also need to make sure to enable to allow not https content from https sites (to get the jQuery mobile
stylesheet and google maps library). You will also need to add the google maps API to your remote sites.
(http://maps.googleapis.com/)

Have fun!

-Dan/Kenji
