

<script src="https://na2.salesforce.com/soap/ajax/10.0/connection.js"></script>
<script src="https://na2.salesforce.com/soap/ajax/10.0/apex.js"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js"></script>
<script>
	jQuery.noConflict();
	jQuery(document).ready(function() 
	{
		alert('hello');
		var customContent = "<div id='customContent'>Im custom content</div>";
		jQuery(customContent).insertAfter('recentFilesPanel');
	});
</script>

<div id="recentFilesPanel"> 

</div>


