Application Name: cloudVote, Version 1.0

Managed Package URL: https://login.salesforce.com/packaging/installPackage.apexp?p0=04tE0000000Pcz7

Setup:
1) Install Package
2) Host cloudVote and cv_fb_regFinish in a salesforce site
3) Give the site profile access to the cloudVote class
4) Give the site profile to the pages, as well as all cloudVote objects.
5) Create a facebook app to handle the facebook integration
5) Create a cloudVote config object. Populate it with the data from the facebook app (the app id and app secret)
6) Fill in the rest of the fields on the config object. Make sure to mark it as active. (the threshold score doesn't do anything, don't worry about it)

Your site should now be active!

If you do plan to use this thing, it could use a bit more polish around ensuring users are logged in before performing actions, and validating form input. Just a heads up.


Visit http://xerointeractive-developer-edition.na9.force.com/partyForce/cloudVote for a demo.

Video 1: http://www.screencast.com/t/j1pJNAOEe
Video 2: http://www.screencast.com/t/Og52prVlPkQ1


EMBED CODE 1
<!-- copy and paste. Modify height and width if desired. --> <object id="scPlayer"  width="1920" height="955" type="application/x-shockwave-flash" data="http://content.screencast.com/users/Kenji776/folders/Jing/media/3a5e2c9f-5ec6-4c20-92b6-7a079685653a/jingswfplayer.swf" > <param name="movie" value="http://content.screencast.com/users/Kenji776/folders/Jing/media/3a5e2c9f-5ec6-4c20-92b6-7a079685653a/jingswfplayer.swf" /> <param name="quality" value="high" /> <param name="bgcolor" value="#FFFFFF" /> <param name="flashVars" value="thumb=http://content.screencast.com/users/Kenji776/folders/Jing/media/3a5e2c9f-5ec6-4c20-92b6-7a079685653a/FirstFrame.jpg&containerwidth=1920&containerheight=955&content=http://content.screencast.com/users/Kenji776/folders/Jing/media/3a5e2c9f-5ec6-4c20-92b6-7a079685653a/cloudVote1.swf&blurover=false" /> <param name="allowFullScreen" value="true" /> <param name="scale" value="showall" /> <param name="allowScriptAccess" value="always" /> <param name="base" value="http://content.screencast.com/users/Kenji776/folders/Jing/media/3a5e2c9f-5ec6-4c20-92b6-7a079685653a/" /> Unable to display content. Adobe Flash is required.</object>


EMBED CODE 2
<!-- copy and paste. Modify height and width if desired. --> <object id="scPlayer"  width="1920" height="955" type="application/x-shockwave-flash" data="http://content.screencast.com/users/Kenji776/folders/Jing/media/c10186df-4bc1-4aae-867c-2c2d82d79160/jingswfplayer.swf" > <param name="movie" value="http://content.screencast.com/users/Kenji776/folders/Jing/media/c10186df-4bc1-4aae-867c-2c2d82d79160/jingswfplayer.swf" /> <param name="quality" value="high" /> <param name="bgcolor" value="#FFFFFF" /> <param name="flashVars" value="thumb=http://content.screencast.com/users/Kenji776/folders/Jing/media/c10186df-4bc1-4aae-867c-2c2d82d79160/FirstFrame.jpg&containerwidth=1920&containerheight=955&content=http://content.screencast.com/users/Kenji776/folders/Jing/media/c10186df-4bc1-4aae-867c-2c2d82d79160/cloudvote2.swf&blurover=false" /> <param name="allowFullScreen" value="true" /> <param name="scale" value="showall" /> <param name="allowScriptAccess" value="always" /> <param name="base" value="http://content.screencast.com/users/Kenji776/folders/Jing/media/c10186df-4bc1-4aae-867c-2c2d82d79160/" /> Unable to display content. Adobe Flash is required.</object>