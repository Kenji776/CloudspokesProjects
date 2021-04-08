var shapeyShapes = new Object();

(function( $ ){
  
  $.fn.shapey = function( options ) {  

    // Create some defaults, extending them with any options that were provided
    var settings = $.extend( {
      'source'         : 'shapes.json', //url to load shape data from.
	  'columns'        : 4, //how many columns will the shapes be arranged into
	  'mergeable'      : true, //boolean that controls if shapes can be merged together to create a new one
	  'mergeParent'    : 'source', //specified the shape that is used as the template for the new one on merge
	  'destroyOnMerge' : false, // (can be true, false, source or target)
	  'useAnimations'  : true, // should grow/shrink animations be used when valid shapes are drug over each other, and when explode when destroyed?
	  'typeMergeMatching' : true
    }, options);

    return this.each(function() {  
		try
		{      
			if(!options.useAnimations)
			{
				$.fx.off =  true;	
			}
			var container = $(this);
			
			//get the shape json from the remote source. Currently source must be local. change to options.source+'callback=?' to support remote sources,and ensure remote
			//json includes callback function name
			$.getJSON(options.source, function(data) {
			
				//iterate over all the returned shapes. Draw them by passing them to the shapey_createShape function.
				for(var i = 0; i <data.length; i++)
				{
					var newShape = new shapeyShape(data[i]);
					var shapeId = shapey_createShape(options,data[i],newShape);
				}			
			});
		}
		catch(ex)
		{
			console.log('Error during shapey invocation: ' + ex.message + ' ' + ex.lineNumber);	
		}
    });
  };
})( jQuery );

//takes json data about a shape, draws it and attached behaviors.
function shapey_createShape(options,shapeData)
{
	try
	{
		//if this shape doesn't have an id, or the id has already been used, assign a new one.
		if($('#'+shapeData.id).length > 0 || !shapeData.hasOwnProperty('id'))
		{
			//shapeData.id = shapeData.id + Math.floor((Math.random()*1000)+1)
			shapeData.id = 'Shape_'+Object.keys(shapeyShapes).length
			shapeData.name = 'Shape ' +Object.keys(shapeyShapes).length;
		}
		
		//write the updated shape data back to the object
		shapeyShapes[shapeData.id] = shapeData;
		
		//for our demo we want to write the json to the div window. Can remove this line in production.
		$('#shapeyJsonData').html(shapey_serializeShapeData());
		
		//now actually draw the shape container, the shape itself and the shape label.
		//the shape container creates a margin around the shape so it has room to grow and shrunk (when another shape is drug over it) without
		//messing with the layout for all the other shapes.
		var contWidth = shapeData.properties.width.replace(/[A-Za-z$-]/g, "");
		var contHeight = shapeData.properties.height.replace(/[A-Za-z$-]/g, "");
			
		//if we are using animation effects, we have to make the containers a little bigger so they have room for the shapes to grow
		//without causing the layout to freak out. Since they start having the same size as the shape, and the shapes grow by 120% (get 20% bigger) 
		//we also need to make the containers 20% larger than their base size.	
		if(!$.fx.off)
		{
			contWidth = parseInt(contWidth*1.20,10);
			contHeight = parseInt(contHeight*1.20,10);
		}
		$('#container').append('<div id="parent_'+shapeData.id+'" class="shapey_padding_box"  style="float:left; width:'+contWidth+'px; height:'+contHeight+'px; "><div class="shapey_shape '+shapeData.type+'"  title="type: '+shapeData.type+'" type="'+shapeData.type+'" id="'+shapeData.id+'" style="overflow:hidden; background-repeat:no-repeat; cursor: move;"> <div class="shapey_label" style="position:absolute; top:'+shapeData.labelTopOffset+'px; left:'+shapeData.labelLeftOffset+'px;">'+shapeData.name+'</div> </div></div>');
	
		//iterate over all the properties in the properties key for this shape. These are all treated as css properties and 
		//can override any options set in the initial creation above.
		if(shapeData.hasOwnProperty('properties'))
		{
			for(property in shapeData.properties)
			{
				$('#'+shapeData.id).css(property,shapeData.properties[property]);
			}
		}
		//if there any buttons on this shape, draw them by passing them into the shapey_drawButton function. A shape can have an infinite amount of buttons.
		if(shapeData.hasOwnProperty('buttons'))
		{	
			for(button in shapeData.buttons)
			{
				var newButton = shapey_drawButton(options,shapeData.id,shapeData.buttons[button]);	
				//write the id of button back to the object.
				shapeData.buttons[button] = newButton;
			}
		}
		
		//after the shape is added and buttons are drawn, we need to make sure they are arranged in columns properly
		//do this by calling the shapey_arrangeColumns function.
		shapey_arrangeColumns(options);
		
		//create a reference to the current shape so we can attach behaviors to it.
		var thisShape=$('#'+shapeData.id);
		
		//Now, if we are going to allow merging of shapes, we need to make them draggable, dropable and do all
		//that other complicated stuff.
		if(options.mergeable)
		{	
			//make the shape draggable, make it snap to possible targets and revert after drop.
			$(thisShape).draggable({ 
				revert: true,
				opacity: 0.55,
				snap: true,
				zIndex: 2700,
				snapMode: "outer",
				snapTolerance: 30,
				delay: 100
			});
	
			//whwen a shape is dropped rig up some events.
			$(thisShape).droppable({
				//we only want to accept shapes that have the same type attribute. Only like shapes can be merged together (possible optional feature?)
				accept: function(thisObject){
					if(options.typeMergeMatching && $(thisObject).attr('type') == $(this).attr('type'))
					{
						return true;
					}
					else if(options.typeMergeMatching)
					{
						return false;	
					}
					else
					{
						return true;
					}
				},
				
				//when we drag a shape over a potential drop target make it grow and shrink as a fun little animation queue of what you are currently 
				//about to drop onto.
				over: function(event, ui) { 
					$( this ).effect("scale", { percent: 125, origin: ['middle','center'], scale: 'box' }, 200, function(){
						$( this ).effect("scale", { percent: 80, origin: ['middle','center'], scale: 'box' }, 200);
					});
				},
				//make sure that after we leave a shape the animation stops and the shape returns to original size, or else 
				//it could get kind of buggy with shapes being stuck at various different points of their animation cycle
				out: function(event, ui) { 
					$( this ).stop(false,true);
				},				
				
				//when we drop a shape onto another acceptable shape.
				drop: function( event, ui ) {
					
					//if we allow merging and the mergeParent is target then get the properties of the target
					//and clone it to create a new shape.
					if(options.mergeable && options.mergeParent == 'target')
					{
						shapey_cloneShape(options,$( this ).attr('id'),$( ui.draggable ).attr('id'));
					}	
					//if we allow merging and the mergeParent is target then get the properties of the source
					//and clone it to create a new shape.																	
					else if(options.mergeable && options.mergeParent == 'source')
					{
						shapey_cloneShape(options,$( ui.draggable ).attr('id'),$( this ).attr('id'));					
					}
					//if we are destroying shapes on merge, or testroying the target shape, then remove the target shape.												
					if(options.destroyOnMerge == true || options.destroyOnMerge == 'target')
					{
						shapey_removeShape(options,$( this ).attr('id'));					
					}
					//if we are destroying shapes on merge, or testroying the target shape, then remove the source shape.	
					else if(options.destroyOnMerge == true || options.destroyOnMerge == 'source')
					{
						shapey_removeShape(options,$( ui.draggable ).attr('id'));
					}	
					
					if(shapeyShapes[$(ui.draggable ).attr('id')].hasOwnProperty('mergeHandler') && shapeyShapes[$(ui.draggable ).attr('id')].mergeHandler != null)
					{
						try
						{
							var result = window[shapeyShapes[$(ui.draggable ).attr('id')].mergeHandler](event,shapeyShapes[$(ui.draggable ).attr('id')], shapeyShapes[$( this ).attr('id')]);
						}
						catch(ex)
						{
							console.log('unable to call handler function for merge "'+shapeyShapes[$(ui.draggable ).attr('id')].mergeHandler+'" Please ensure the function has been implimented.'); 				
						}
					}

					
				}
			});
		}
		
		//if this shape has it's deleted property set to true, remove it now.
		//I know it seems wasteful to render the shape just to destroy it, but I prefer
		//to design things with as few one off cases an neccessary. More reliable this way.
		if(shapeData.deleted)
		{
			shapey_removeShape(options,shapeData.id)
		}
	}
	catch(ex)
	{
		console.log('Error during new shape creation: ' + ex.message + ' ' + ex.lineNumber);
	}
	
	return shapeData;
}

//Arrange the shapes in rows that contains a user specified amount of columns.
function shapey_arrangeColumns(options)
{
	try
	{
		//remove any existing column breakers
		$('.shapeyColBreaker').remove();	
		
		//after every n:th child (specified by the column attribute in the options, insert a new div breaker
		$('.shapey_padding_box:nth-child('+options.columns+'n)').after('<div style="clear:both" class="shapeyColBreaker"></div');
		return true;
	}
	catch(ex)
	{
		console.log('Error arrangig shape columns: ' + ex.message + ' ' + ex.lineNumber);
		return false;
	}
}

//simple wrapper for the creating shape function incase any additional logic might be needed.
//called when one shape is drug onto another and a merge is initiated. For example if you wanted to try and create some kind
//of hybrid shape here you could.
function shapey_cloneShape(options,parentId,secondParentId)
{
	var newShape = new shapeyShape();
	try
	{
		//for our new shape we want to clone the parent shape instead of just making a reference to it, which
		//can cause odd behavior. So we use jQuerys extend method to create a clone of it, which we can then modify.
		var shapeData = $.extend(true, {}, shapeyShapes[parentId]);
		var secondParent = shapeyShapes[secondParentId];
		
		
		//make sure that the new shape doesn't inheret the deleted property
		shapeData.deleted =false;
		
		//set the parent information about the shape
		shapeData.parent = parentId;
		shapeData.secondParent = secondParentId;
		
		//create a new instance of the shape using the specified shape data
		newShape = shapey_createShape(options,new shapeyShape(shapeData));

		if(shapeData.hasOwnProperty('cloneHandler') && shapeData.cloneHandler != null)
		{
			try
			{
				var result = window[shapeData.cloneHandler](shapeData, shapeyShapes[parentId], secondParent);
			}
			catch(ex)
			{
				console.log('unable to call handler function for clone "'+shapeData.cloneHandler+'" Please ensure the function has been implimented.'); 			
			}
		}		
	}
	catch(ex)
	{
		console.log('Error cloning shape: ' + ex.message + ' ' + ex.lineNumber);		
	}
	
	return newShape;
}

//responsible for removing a shape, such as after a merge event with a destroy action.
function shapey_removeShape(options,id)
{
	try
	{
		//set the deleted flag in the shape data.
		var shapeData = shapeyShapes[id];
		shapeyShapes[id].deleted = true;
		
		//update the running log of json data on the demo page (can be removed in production)
		$('#shapeyJsonData').html(shapey_serializeShapeData());
		
		//run the explode animation, when it's complete remove the parent of the shape (the container div)
		//and call the arrange columns function.			
		

		if(shapeData.hasOwnProperty('destroyHandler') && shapeData.destroyHandler != null)
		{
			try
			{
				var result = window[shapeData.destroyHandler](shapeyShapes[id]);
			}
			catch(ex)
			{
				console.log('unable to call handler function for destroy "'+shapeData.clone+'" Please ensure the function has been implimented.'); 			
			}
		}
				
		if($.fx.off)
		{
			$( '#'+id ).parent().remove();
			$( '#'+id ).remove();
			
			shapey_arrangeColumns(options);				
		}
		else
		{
			$( '#'+id ).effect("explode",300,function(){
				$(this).parent().remove()
				shapey_arrangeColumns(options);		
			});

		}
	}
	catch(ex)
	{
		console.log('Error removing shape: ' + ex.message + ' ' + ex.lineNumber);	
	}
}

//returns a serialized JSON string of the current shape data. Can be used to store current config
//for another instance.
function shapey_serializeShapeData()
{
	try
	{
		return JSON.stringify(shapeyShapes,null, 4);
	}
	catch(ex)
	{
		console.log('Error serializing shape data: ' + ex.message + ' ' + ex.lineNumber);	
		return ex;
	}
}

//draw a button on the given shape using the passed in information.
function shapey_drawButton(options,parentShapeId,buttonInfo)
{
	try
	{
		//create an id for this button based on the parents id, and the number of buttons that exist on it.
		buttonInfo.id = parentShapeId+'_button'+$('#'+parentShapeId+' .shapey_button').length;
			
		buttonInfo = new shapeysShapeButton(buttonInfo)
		
		//draw the button on the shape
		$('#'+parentShapeId).append('<div id="'+buttonInfo.id+'" class="shapey_button" parent="'+parentShapeId+'" style="cursor:pointer; position:absolute; overflow:hidden;">'+buttonInfo.name+'</div>');
		
		//set any css properties of the button.
		if(buttonInfo.hasOwnProperty('properties'))
		{
			for(property in buttonInfo.properties)
			{
				$('#'+buttonInfo.id).css(property,buttonInfo.properties[property]);
			}
		}
		
		//attach the click handler to the button if it has one.
		if(buttonInfo.hasOwnProperty('click') && buttonInfo.click != null)
		{
			$('#'+buttonInfo.id).click(function(){
				try
				{
					var result = window[buttonInfo.click](event,buttonInfo,shapeyShapes[parentShapeId]);
				}
				catch(ex)
				{
					console.log('unable to call handler function for button click "'+buttonInfo.click+'" Please ensure the function has been implimented.'); 			
				}
			});
		}
	}
	catch(ex)
	{
		console.log('Error drawing button on shape: ' + ex.message + ' ' + ex.lineNumber);	
	}
	return buttonInfo;
}

//creates some default shapes and helps show json data structure of shapey shapes
function shapey_shapeFactory()
{
	var shapes = new Array();
	for(var i =0; i<5; i++)
	{
		var thisShape = new Object();
		thisShape.type = 'circle';			
		thisShape.deleted = false,
		thisShape.destroyHandler = 'destroyHandler';
		thisShape.cloneHandler = 'cloneHandler';
		thisShape.properties = new Object({
			"background-image": "URL(shapey/img/Shape1.png)",
			"width": "122px",
			"height": "122px",
			"background-size": "100%"
			
		}),
		thisShape.labelTopOffset = 55;
		thisShape.labelLeftOffset= 37;
		thisShape.buttons = new Array();
		
		var button1 = new Object({
			click: 'clickHandler',
			name: 'Button 1',
			properties: new Object({
					"top": "20px",
					"left": "20px",
					"width": "20px",
					"height": "20px",
					"border-style": "solid",
					"border-width": "1px",
					"border-radius": "50%"
				})
		});

		var button2 = new Object({
			click: 'clickHandler',
			name: 'Button 2',
			properties: new Object({
					"top": "80px",
					"left": "80px",
					"width": "20px",
					"height": "20px",
					"border-style": "solid",
					"border-width": "1px"
				})
		});
		
		thisShape.buttons.push(new shapeysShapeButton(button1));			
		thisShape.buttons.push(new shapeysShapeButton(button2));
		
		shapes.push(new shapeyShape(thisShape));
	}

	for(var i =5; i<11; i++)
	{
		var thisShape = new Object();
		thisShape.type = 'circle';			
		thisShape.deleted = false,
		
		thisShape.properties = new Object({
			"background-image": "URL(shapey/img/Shape2.png)",
			"width": "122px",
			"height": "122px",
			"background-size": "100%"
			
		}),
		thisShape.labelTopOffset = 55;
		thisShape.labelLeftOffset= 37;
		thisShape.buttons = new Array();
		
		var button1 = new Object({
			click: 'clickHandler',
			name: 'Button 1',
			properties: new Object({
					"top": "20px",
					"left": "20px",
					"width": "20px",
					"height": "20px",
					"border-style": "solid",
					"border-width": "1px",
					"border-radius": "50%"
				})
		});

		
		thisShape.buttons.push(new shapeysShapeButton(button1));			
		
		shapes.push(new shapeyShape(thisShape));
	}	

	for(var i =11; i<16; i++)
	{
		var thisShape = new Object();
		thisShape.type = 'derp';			
		thisShape.deleted = false,
		thisShape.mergeHandler = 'mergeHandler',
		thisShape.properties = new Object({
			"background-image": "URL(shapey/img/derpShape.png)",
			"width": "122px",
			"height": "122px",
			"background-size": "100%"
			
		}),
		thisShape.labelTopOffset = 30;
		thisShape.labelLeftOffset= 37;
		thisShape.buttons = new Array();
		
		var button1 = new Object({
			click: 'clickHandler',
			name: 'Button 1',
			properties: new Object({
					"top": "50px",
					"left": "36px",
					"width": "20px",
					"height": "20px",
					"border-style": "solid",
					"border-width": "1px",
					"border-radius": "50%"
				})
		});

		
		thisShape.buttons.push(new shapeysShapeButton(button1));			
		
		shapes.push(new shapeyShape(thisShape));
	}		
	return JSON.stringify(shapes);
}

//object types with defaults to fill in the gaps incase the user doesn't specify all the required properties in the shape data.
var numShapes = 0;
function shapeyShape(properties)
{
	this.id = 'Shape_'+numShapes
	this.type = 'Default';
	this.name = 'Shape_'+numShapes
	this.deleted = false;
	this.labelTopOffset = 55;
	this.labelLeftOffset = 37;
	this.parent = null;
	this.secondParent = null;
	this.mergeHandler = null;	
	this.destroyHandler = null;
	this.cloneHandler = null;
	this.properties = new Object();
	this.properties.width = '122px';
	this.properties.height = '122px';
	this.properties['border-radius'] = "50%";
	this.properties['background-size'] = "100%";
	this.properties['background-color'] = 'red';	
		
	if(typeof properties === 'object' && properties != null)
	{
		for(key in properties)
		{
			this[key] = properties[key];	
		}
	
		if(properties.hasOwnProperty('properties'))
		{
			for(key in properties.properties)
			{
				this.properties[key] = properties.properties[key];
			}
		}
	}
	numShapes++;
}


function shapeysShapeButton(properties)
{
	this.click = null;
	this.name = 'Button';
	this.id = 'Button'+Math.floor((Math.random()*100000)+1);;
	this.properties = new Object();
	this.properties.top = "0px";
	this.properties.left = "0px";
	this.properties.width = "20px";
	this.properties.height = "20px";
	this.properties['border-style'] = "solid";
	this.properties['border-width'] = "1px";
	this.properties['border-radius'] = "50%";

	if(typeof properties === 'object' && properties != null)
	{
		for(key in properties)
		{
			this[key] = properties[key];	
		}
	
		if(properties.hasOwnProperty('properties'))
		{
			for(key in properties.properties)
			{
				this.properties[key] = properties.properties[key];
			}
		}
	}	
}

// Create a new object, that prototypally inherits from the Error constructor.
function customError(message) {
	this.name = "MyError";
	this.message = message || "Default Message";
}
customError.prototype = new Error();
customError.prototype.constructor = customError;
