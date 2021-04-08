//FlexiFilter Dynamic Search Widget for CloudSpokes
//Author: Daniel Llewellyn (Kenji776)
//Date: Wed Aug 1, 2012
//Dependencies: jQuery 1.7.2, jQuery ui 1.8.17
/*Description: Loads JSON content from a remote source (must be in same domain, as it is not configured for JSONP) and uses
               it to build a search interface widget. The data entered by the user is then JSON encoded and sent to a location
			   specified in the source JSON file. The resulting data is passed to a callback which the user may decide what to do with.
			   a sample callback function is provided that parses the data into a basic table layout. Any data provided for a search element is
			   included in the resulting HTML element for easy modificaitons/extensions, including custom CSS classes.
*/
(function( $ ) {
	$.fn.flexiFilter = function(options) {
	    // Create some defaults, extending them with any options that were provided
		var settings = $.extend( {
		  'source' : '',
		  'resultHandler' : function() {console.log('data fetched, but no callback provided. Please provide one by passing a function as the resultHandler param in the flexiFilter plugin invocation')},
		  'enhanceUI' : true
		}, options);
	
		this.each(function() {
			//get a stable reference to the div that we will be working with.
			var formContainer = this;
			
			//get the JSON content from the location specified by the user.
			$.getJSON(options.source, function(data) {
											   
				//write out the fetched json content to the screen. This is just for debugging and could be removed.
				$('#sourceJSONContent').html(JSON.stringify(data, undefined, 4));
		
				//create the form to contain all the elements.
				var flexiFilterContent = '<form class="flexiFilterForm" id="flexiFilter_'+data.searchName+'" action="'+data.searchEndpoint+'"><div class="flexiFilter">';
				
				//iterate over all the searchCriteraSections objects in the JSON
				for(var searchCriteriaSection =0; searchCriteriaSection < data.searchCriteraSections.length; searchCriteriaSection++)
				{
					//created a section out of the section name in the json
					flexiFilterContent += '<h3><a href="#">'+data.searchCriteraSections[searchCriteriaSection].sectionName + ' <button class="flexiFilterToolTip" content="'+data.searchCriteraSections[searchCriteriaSection].sectionHelpText+'" onclick="alert(\''+data.searchCriteraSections[searchCriteriaSection].sectionHelpText+'\'); return false;"> What\'s This</button></a></h3><div>';
					
					//now loop over all the search items
					for(var searchItem = 0; searchItem < data.searchCriteraSections[searchCriteriaSection]['searchCriteria'].length; searchItem++)
					{
						//loop over all the keys within each seach item
						for(var searchCriteriaAttribute in data.searchCriteraSections[searchCriteriaSection]['searchCriteria'][searchItem])
						{
							//when we have found the key that tells us the type of item this is ('criteriaType') pass it the appropriate function
							//with all the data about that searchItem. It will attempt to pass the searchItem data to a function called
							//flexiFilterDraw_[criteriaType] 
							//where [criteriaType] is the value in the criteriaType key. 
							//The default supports criteria types are text, dropmenu, slider, checkbox, and radio.
							//to support more criteriaTypes simple create a function with the appropriate name and make it return the appropriate HTML.
							//use one of the existing functions as sample/template
							if(searchCriteriaAttribute == 'criteriaType')
							{
								//seeing as there is the possibility we may receive an invalid criteriaType, we should wrap this in a catch/try and let the developer
								//know if some kind of invalid type is encountered.
								try
								{
									flexiFilterContent += window['flexiFilterDraw_' + data.searchCriteraSections[searchCriteriaSection]['searchCriteria'][searchItem][searchCriteriaAttribute]](data.searchCriteraSections[searchCriteriaSection]['searchCriteria'][searchItem]);
								}
								catch(ex)
								{
									console.log('unable to call handler function for criteria type ' + searchCriteriaAttribute + '. Please check to make sure type is supported. Default supported types are: text, dropmenu, slider, checkbox, and radio'); 
									console.log(ex);	
								}												
							}						
						}
						
					}
					//put a little spacer at the end of each section just to make things less crowded. You can of course play with it's properties in the CSS file.
					flexiFilterContent += '<div class="spacer"></div></div>';
					
				}
				
				//create the submit button and loading spinner.
				flexiFilterContent += '</div><div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-corner-top"><button id="submitForm" onclick="return false;">Search</button><div class="flexiFilterLoader"></div></div></form><div id="flexiFilterDialog" title="Alert!">Default content</div>';
				
				//write the content generated into the div that the plugin was called on.
				$(formContainer).html(flexiFilterContent);

				//create the sliders. This had to be separate from the regular UI enhancments because otherwise the sliders just don't work at all.
				$('.flexiFilterForm div [criteriatype=slider]').each(function(index){		
					$(this).slider({
						min: $(this).attr('minValue'),
						max: $(this).attr('maxValue'),
						slide: function(event, ui) { 
							$('#flexiFilterSliderValue_'+$(this).attr('criteriaName')).html(ui.value);
						}
					});
				});
	
				//if the user wants the UI enhanced, apply the jQuery accordian plugin to the generated content.
				if(options.enhanceUI)
				{
					flexiFilter_enhanceUI();
				}
				
				//attach the click login to the submit button. When it's clicked, send the serialized form data to the 
				//location specified in the form that was generated. That location is the same one specified in the source JSON.
				//reading it from the form though allowes the programmer to override it easily though if they want between the point when
				//the JSON is first loaded and when the user clicks submit/search.
				$('.flexiFilterForm #submitForm').click(function(){
					
					//show the loading spinner
					$('.flexiFilterLoader').show();
					
					//find where we are going to send the serialized data
					var searchTarget = $(this).parent().parent().attr('action');
					
					//serialize the form to get it's data
					var formData =  $(this).parent().parent().serializeObject();
					
					//since sliders arn't really form elements, we have to make a special case to get their values
					//and include them in the search data.
					$('.flexiFilterSliderValue').each(function(index){
							formData[$(this).attr('name')] = $('#flexiFilterSlider_'+$(this).attr('name')).slider("value");								   
					});
					
					//now turn the object into a JSON string to be sent to the remote target
					var serailizedForm = JSON.stringify(formData);
					 
					//output the generated search JSON. this line can be removed with no side effects. Just for debuggig.
					$('#sentSearchJson').html(JSON.stringify(formData,undefined,4));
					
					//send the serialized form data to the target. Pass the results to the callback specified.
					$.getJSON(searchTarget, serailizedForm,  function(data) {
							
						//output the returned search result JSON. this line can be removed with no side effects. Just for debuggig.	
						$('#returnSearchJson').html(JSON.stringify(data,undefined,4));

						//if we have a callback function, return it. 
						if (typeof options.resultHandler == 'function') { // make sure the callback is a function
							options.resultHandler(data); // brings the scope to the callback
						}
						
						//hide the loading animation spinner.
						$('.flexiFilterLoader').hide();
					}).error(function(event, request, settings){
						alert('Error requesting page ' + searchTarget + '. Please ensure url is on the server and that it result contains valid JSON');
						$('.flexiFilterLoader').hide();

					});
					
					//stops the button from acting like a submit button and going to the location specified in the action. Dumb i know.
					return false;
				});	
				

			}).error(function(data){
				alert('Error requesting page ' + options.source + '. Please ensure url is on the server and that it result contains valid JSON');
			});					
		});
		return 'ran!';
	};	
})( jQuery );

//flexiFilter draw functions. Each function gets called by name. You can extend the functionality of the plugin to handle other kinds of inputs
//by simply created a function with the correct name. ex flexiFilterDraw_datePicker or flexiFilterDraw_colorPicker etc.

//creates a textbox
function flexiFilterDraw_text(objectParams)
{	
	return '<input type="text" name="'+objectParams['criteriaName']+'" id="flexiFilter_'+objectParams['criteriaName']+'" ' + flexiFilter_parseAttributeList(objectParams) + ' value="'+objectParams['criteriaLabel']+'" /><div class="clear" />';
}


//draws a dropdown menu
function flexiFilterDraw_dropmenu(objectParams)
{		
	html = '<select name="'+objectParams['criteriaName']+'" id="flexiFilter_'+objectParams['criteriaName']+'" '+ flexiFilter_parseAttributeList(objectParams) + '>';
	for(var option = 0; option < objectParams.criteriaValues.length; option++)
	{
		html += '<option value="'+objectParams.criteriaValues[option].id+'" '+flexiFilter_parseAttributeList(objectParams.criteriaValues[option])+'>'+objectParams.criteriaValues[option].label+'</option>';	
	}
	html += '</select>';		
	return html;
}

//creates a checkbox
function flexiFilterDraw_checkbox(objectParams)
{
	return '<input name="'+objectParams['criteriaName']+'" type="checkbox" id="flexiFilter_'+objectParams['criteriaName']+'" ' + flexiFilter_parseAttributeList(objectParams) + '><label for="flexiFilter_'+objectParams['criteriaName']+'">'+objectParams['criteriaLabel']+'</label>';
}

//creates a slider. Won't do much without the jQuery UI slider plugin.
function flexiFilterDraw_slider(objectParams)
{
	var html = '<div class="flexiFilterSlider"><div class="flexiFilterSliderTitle" id="flexiFilterSliderTitle_'+objectParams['criteriaName']+'">'+objectParams['criteriaLabel']+'</div> <div class="flexiFilterSliderValue" name="'+objectParams['criteriaName']+'" id="flexiFilterSliderValue_'+objectParams['criteriaName']+'">0</div>';
	html += '<div class="clear"></div><div id="flexiFilterSlider_'+objectParams['criteriaName']+'" ' + flexiFilter_parseAttributeList(objectParams) + '></div></div><div class="clear"></div>';
	return html;
}

//draws a radio button group
function flexiFilterDraw_radio(objectParams)
{
	var html = '<div class="flexiFilterRadioGroup">';
	for(var option = 0; option < objectParams.criteriaValues.length; option++)
	{
		html += '<input type="radio" name="'+objectParams['criteriaName']+'" id="flexiFilterRadio_'+objectParams['criteriaName']+'_'+objectParams.criteriaValues[option].id+'" value="'+objectParams.criteriaValues[option].id+'" '+flexiFilter_parseAttributeList(objectParams.criteriaValues[option])+'><label for="flexiFilterRadio_'+objectParams['criteriaName']+'_'+objectParams.criteriaValues[option].id+'">'+objectParams.criteriaValues[option].label+'</label>';	
	}
	html += '</div>';		
	return html;
}

//parses the attributes in the source json for an element into a list of html attributes.
function flexiFilter_parseAttributeList(objectParams)
{
	var attribString = '';
	if(objectParams.hasOwnProperty('class'))
	{
		objectParams['class'] += ' flexiFilter';	
	}
	else
	{
		objectParams['class'] = 'flexiFilter';	
	}

	for(attrib in objectParams)
	{
		if(typeof objectParams[attrib] == 'string' && attrib.toLowerCase() != 'id' && attrib.toLowerCase() != 'type' && attrib.toLowerCase() != 'name')
		{
			attribString += attrib +'= "'+ objectParams[attrib].replace(/[^a-zA-Z 0-9]/g,'') + '" ';	
		}
	}
	return attribString;
}

//simple function to take an array of objects and convert them into an html table for display.
function flexiFilter_tableFromObjectArray(objArray)
{
	html = '<table class="searchResultTable"><thead>';
	for(col in objArray[0])
	{
		html+= '<th>'+col+'</td>';	
	}
	html += '</thead><tbody>';
	for(var row = 0; row<objArray.length; row++)
	{
		html += '<tr>';
		for(col in objArray[row])
		{
			html += '<td>'+objArray[row][col]+'</td>';
		}
		html += '</tr>';
	}
	html += '</tbody><table>';
	
	return html;
}

//seriailizes a serializes form and turn it into an object so it can be converted into JSON.
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};

//sample function for handling search result data
(function( $ ) {
	$.fn.flexiResultTable = function(options) {
	    // Create some defaults, extending them with any options that were provided
		var settings = $.extend( {
		  'data' : new Object()
		}, options);
	
		this.each(function() {					   
			$(this).html(flexiFilter_tableFromObjectArray(options.data.searchResults));	
		})
	}
})( jQuery );

//functionality for enhancing the UI using jQuery ui and some custom add-ons.
function flexiFilter_enhanceUI()
{
	//create the accordian container.
	$('.flexiFilterForm .flexiFilter').accordion({
		autoHeight: false,
		clearStyle: true
	});	
	
	$(".flexiFilterForm button").button();
	
	$(".flexiFilterForm input:checkbox").button();
	
	$('.flexiFilterRadioGroup').buttonset();
	
	$('.flexiFilterForm select').combobox();

	//setup the info buttons in the accordian headers
	$("button.flexiFilterToolTip").button({
		icons: {
			primary: "ui-icon-info"
		},
		text: false,
		label: ""
	});
	
	//remove the default onlclick behavior for when using unstyled forms.
	$("button.flexiFilterToolTip").attr('onclick',null);
	
	//open the dialog box when the info button is clicked.
	$("button.flexiFilterToolTip").click(function() {
		$('#flexiFilterDialog' ).dialog( "option", "title", "Info" );
		$('#flexiFilterDialog').html($(this).attr('content'));
		$('#flexiFilterDialog').dialog('open');
		return false;
	});
	


	//special styling and functions for text boxes. Will blank out the default value of a textbox when it gets focus
	//and will reset it back to the default if nothing is entered on blur.
	$('.flexiFilterForm input:text').button().addClass( 'flexiFilterTextbox' ).focus(function(){
		if($(this).val() == $(this).attr('criterialabel'))
		{
			$(this).val(null);
		}}).blur(function(){
				if($(this).val().length == 0)
				{
					$(this).val($(this).attr('criterialabel'));
				}
	});
	
	//remove the disables classes from select lists. Since select lists are actually text boxes, and the only way
	//to get rid of the cursor is to make them disabled, you have to remove the jQuery ui disabled classes to get them
	//to look right.
	$('.flexiSelectList').removeClass('ui-button-disabled ui-state-disabled');
	
	//custom code to add better feedback to jQuery ui checkboxes. I don't think they really provide enough UI feedback
	//to the user, so I hacked this together to get some icons on them.
	$( ".flexiFilterForm input[type=checkbox]" ).button({ icons: {primary:'ui-icon-circle-close'} });
		$( ".flexiFilterForm input[type=checkbox]" ).click(function(){
			if($(this).is(':checked'))
			{
				$(this).next().children('.ui-button-icon-primary').addClass("ui-icon-circle-check").removeClass("ui-icon-circle-close");
			}
			else
			{
				$(this).next().children('.ui-button-icon-primary').addClass("ui-icon-circle-close").removeClass("ui-icon-circle-check");
			}
	});

	//custom code to add better feedback to jQuery ui radio buttons. I don't think they really provide enough UI feedback
	//to the user, so I hacked this together to get some icons on them. Had to make this different from checkboxes since
	//you need to remove all icons from any other radion button when one is clicked.
	$( ".flexiFilterForm input[type=radio]" ).button({ icons: {primary:'ui-icon-circle-close'} });
		$( ".flexiFilterForm input[type=radio]" ).click(function(){
	
			
	
			if($(this).is(':checked'))
			{
				$(this).next().children('.ui-button-icon-primary').addClass("ui-icon-circle-check").removeClass("ui-icon-circle-close");
			}
			$('.flexiFilterForm input[type=radio][id!="'+$(this).attr('id')+'"]').each(function(){
				$(this).next().children('.ui-button-icon-primary').addClass("ui-icon-circle-close").removeClass("ui-icon-circle-check");																								 
			});
	});
		
		$('#flexiFilterDialog').dialog({
			autoOpen: false							   		   
		});
}

//ui code to enhance select boxes. 
(function ($) {
    $.widget("ui.combobox", {
        _create: function () {
            var self = this,
				select = this.element.hide(),
				selected = select.children(":selected"),
				value = selected.val() ? selected.text() : "",
				regSearch = /^[^a-zA-Z0-9]*([a-zA-Z0-9])/i,
				comboData = select.children("option").map(function () {
					if (this.value ) {
						var text = $(this).text(), 
							labelHtml = self.options.label ? self.options.label(this) : text; //allows list customization
 
						return {
							label: labelHtml,
							value: text,
							option: this
						};
					}
				});
 
            var input = this.input = $("<input type='text' class='flexiSelectList' disabled='disabled' />")
					.insertAfter(select)
					.val(value)
					.keydown( function( event ) {
							var keyCode = $.ui.keyCode;
							switch( event.keyCode ) {
								case keyCode.PAGE_UP:
								case keyCode.PAGE_DOWN:
								case keyCode.UP:
								case keyCode.DOWN:
								case keyCode.ENTER:
								case keyCode.NUMPAD_ENTER:
								case keyCode.TAB:
								case keyCode.ESCAPE:
									//let autocomplete handle these
									break;
								default:
									//prevent autocomplete doing anything
									event.stopImmediatePropagation();
									//only react to [a-zA-Z0-9]
									if ((event.keyCode < 91 && event.keyCode > 59)
										|| (event.keyCode < 58 && event.keyCode > 47)) {
 
										var str = String.fromCharCode(event.keyCode).toLowerCase(), currVal = input.val(), opt;
 
										//find all options whose first alpha character matches that pressed
										var matchOpt = select.children().filter(function() {
											var test = regSearch.exec(this.text);
											return (test && test.length == 2 && test[1].toLowerCase() == str);
										});
 
										if (!matchOpt.length ) return false;
 
										//if there is something selected we need to find the next in the list
										if (currVal.length) {
											var test = regSearch.exec(currVal);
											if (test && test.length == 2 && test[1].toLowerCase() == str) {
												//the next one that begins with that letter
												matchOpt.each(function(ix, el) {
													if (el.selected) {
														if ((ix + 1) <= matchOpt.length-1) {
															opt = matchOpt[ix + 1];
														}
														return false;
													}
												});
											}
										} 
 
										//fallback to the first one that begins with that character
										if (!opt)
											opt = matchOpt[0];
 
										//select that item
										opt.selected = true;
										input.val(opt.text);
 
										//if the dropdown is open, find it in the list
										if (input.autocomplete("widget").is(":visible")) {
											input.data("autocomplete").widget().children('li').each(function() {		
												var $li = $(this);
												if ($li.data("item.autocomplete").option == opt) {
													input.data("autocomplete").menu.activate(event,$li);
													return false;
												}
											});
										}
									}
									//ignore all other keystrokes
									return false;
									break;
								}
					  })
					.autocomplete({
					    delay: 0,
					    minLength: 0,
					    source: function (request, response) { response(comboData); },
					    select: function (event, ui) {
					        ui.item.option.selected = true;
					        self._trigger("selected", event, {
					            item: ui.item.option
					        });
					    },
					    change: function (event, ui) {
							if (!ui.item) {					
								var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex($(this).val()) + "$", "i"),
									valid = false;
								select.children("option").each(function () {
									if ($(this).text().match(matcher)) {
										this.selected = valid = true;
										return false;
									}
								});
								if (!valid) {
									// remove invalid value, as it didn't match anything
									$(this).val("");
									select.val("");
									input.data("autocomplete").term = "";
									return false;
								}
							}
					    }
					})
					.addClass("ui-widget ui-widget-content ui-corner-left")
					.click(function() { self.button.click(); })
					.bind("autocompleteopen", function(event, ui){
						//find the currently selected item and highlight it in the list
						var opt = select.children(":selected")[0];
						input.data("autocomplete").widget().children('li').each(function() {		
							var $li = $(this);
							if ($li.data("item.autocomplete").option == opt) {
								input.data("autocomplete").menu.activate(event,$li);
								return false;
							}
						});
					});
 
            input.data("autocomplete")._renderItem = function (ul, item) {
                return $("<li></li>")
					.data("item.autocomplete", item)
					.append("<a href='#'>" + item.label + "</a>")
					.appendTo(ul);
            };
 
            this.button = $("<button type='button'>&nbsp;</button>")
					.attr("tabIndex", -1)
					.attr("title", "Show All Items")
					.insertAfter(input)
					.button({
					    icons: {
					        primary: "ui-icon-triangle-1-s"
					    },
					    text: false
					})
					.removeClass("ui-corner-all")
					.addClass("ui-corner-right ui-button-icon")
					.click(function () {
					    // close if already visible
					    if (input.autocomplete("widget").is(":visible")) {
					        input.autocomplete("close");
					        return;
					    }
 
					    // pass empty string as value to search for, displaying all results
					    input.autocomplete("search", "");
					    input.focus();
					});
        },
 
		//allows programmatic selection of combo using the option value
        setValue: function (value) {
            var $input = this.input;
            $("option", this.element).each(function () {
                if ($(this).val() == value) {
                    this.selected = true;
                    $input.val(this.text);
					return false;
                }
            });
        },
 
        destroy: function () {
            this.input.remove();
            this.button.remove();
            this.element.show();
            $.Widget.prototype.destroy.call(this);
        }
    });
})(jQuery);