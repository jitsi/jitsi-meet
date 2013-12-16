/*! jQuery-Impromptu - v5.1.1
* http://trentrichardson.com/Impromptu
* Copyright (c) 2013 Trent Richardson; Licensed MIT */
(function($) {
	"use strict";

	/**
	* setDefaults - Sets the default options
	* @param message String/Object - String of html or Object of states
	* @param options Object - Options to set the prompt
	* @return jQuery - container with overlay and prompt 
	*/
	$.prompt = function(message, options) {
		// only for backwards compat, to be removed in future version
		if(options !== undefined && options.classes !== undefined && typeof options.classes === 'string'){
			options = { box: options.classes };
		}

		$.prompt.options = $.extend({},$.prompt.defaults,options);
		$.prompt.currentPrefix = $.prompt.options.prefix;
		
		// Be sure any previous timeouts are destroyed
		if($.prompt.timeout){
			clearTimeout($.prompt.timeout);
		}
		$.prompt.timeout = false;

		var opts = $.prompt.options,
			$body = $(document.body),
			$window = $(window);
					
		//build the box and fade
		var msgbox = '<div class="'+ $.prompt.options.prefix +'box '+ opts.classes.box +'">';
		if(opts.useiframe && ($('object, applet').length > 0)) {
			msgbox += '<iframe src="javascript:false;" style="display:block;position:absolute;z-index:-1;" class="'+ opts.prefix +'fade '+ opts.classes.fade +'"></iframe>';
		} else {
			msgbox +='<div class="'+ opts.prefix +'fade '+ opts.classes.fade +'"></div>';
		}
		msgbox += '<div class="'+ opts.prefix +' '+ opts.classes.prompt +'">'+
					'<form action="javascript:false;" onsubmit="return false;" class="'+ opts.prefix +'form">'+
						'<div class="'+ opts.prefix +'close '+ opts.classes.close +'">'+ opts.closeText +'</div>'+
						'<div class="'+ opts.prefix +'states"></div>'+
					'</form>'+
				'</div>'+
			'</div>';

		$.prompt.jqib = $(msgbox).appendTo($body);
		$.prompt.jqi = $.prompt.jqib.children('.'+ opts.prefix);//.data('jqi',opts);
		$.prompt.jqif = $.prompt.jqib.children('.'+ opts.prefix +'fade');

		//if a string was passed, convert to a single state
		if(message.constructor === String){
			message = {
				state0: {
					title: opts.title,
					html: message,
					buttons: opts.buttons,
					position: opts.position,
					focus: opts.focus,
					submit: opts.submit
				}
			};
		}

		//build the states
		$.prompt.options.states = {};
		var k,v;
		for(k in message){
			v = $.extend({},$.prompt.defaults.state,{name:k},message[k]);
			$.prompt.addState(v.name, v);

			if($.prompt.currentStateName === ''){
				$.prompt.currentStateName = v.name;
			}
		}

		// Go ahead and transition to the first state. It won't be visible just yet though until we show the prompt
		var $firstState = $.prompt.jqi.find('.'+ opts.prefix +'states .'+ opts.prefix +'state').eq(0);
		$.prompt.goToState($firstState.data('jqi-name'));

		//Events
		$.prompt.jqi.on('click', '.'+ opts.prefix +'buttons button', function(e){
			var $t = $(this),
				$state = $t.parents('.'+ opts.prefix +'state'),
				stateobj = $.prompt.options.states[$state.data('jqi-name')],
				msg = $state.children('.'+ opts.prefix +'message'),
				clicked = stateobj.buttons[$t.text()] || stateobj.buttons[$t.html()],
				forminputs = {};

			// if for some reason we couldn't get the value
			if(clicked === undefined){
				for(var i in stateobj.buttons){
					if(stateobj.buttons[i].title === $t.text() || stateobj.buttons[i].title === $t.html()){
						clicked = stateobj.buttons[i].value;
					}
				}
			}

			//collect all form element values from all states.
			$.each($.prompt.jqi.children('form').serializeArray(),function(i,obj){
				if (forminputs[obj.name] === undefined) {
					forminputs[obj.name] = obj.value;
				} else if (typeof forminputs[obj.name] === Array || typeof forminputs[obj.name] === 'object') {
					forminputs[obj.name].push(obj.value);
				} else {
					forminputs[obj.name] = [forminputs[obj.name],obj.value];	
				} 
			});

			// trigger an event
			var promptsubmite = new $.Event('impromptu:submit');
			promptsubmite.stateName = stateobj.name;
			promptsubmite.state = $state;
			$state.trigger(promptsubmite, [clicked, msg, forminputs]);
			
			if(!promptsubmite.isDefaultPrevented()){
				$.prompt.close(true, clicked,msg,forminputs);
			}
		});

		// if the fade is clicked blink the prompt
		var fadeClicked = function(){
			if(opts.persistent){
				var offset = (opts.top.toString().indexOf('%') >= 0? ($window.height()*(parseInt(opts.top,10)/100)) : parseInt(opts.top,10)),
					top = parseInt($.prompt.jqi.css('top').replace('px',''),10) - offset;

				//$window.scrollTop(top);
				$('html,body').animate({ scrollTop: top }, 'fast', function(){
					var i = 0;
					$.prompt.jqib.addClass(opts.prefix +'warning');
					var intervalid = setInterval(function(){
						$.prompt.jqib.toggleClass(opts.prefix +'warning');
						if(i++ > 1){
							clearInterval(intervalid);
							$.prompt.jqib.removeClass(opts.prefix +'warning');
						}
					}, 100);
				});
			}
			else {
				$.prompt.close(true);
			}
		};
		
		// listen for esc or tab keys
		var keyPressEventHandler = function(e){
			var key = (window.event) ? event.keyCode : e.keyCode;
			
			//escape key closes
			if(key===27) {
				fadeClicked();	
			}
			
			//constrain tabs, tabs should iterate through the state and not leave
			if (key === 9){
				var $inputels = $('input,select,textarea,button',$.prompt.getCurrentState());
				var fwd = !e.shiftKey && e.target === $inputels[$inputels.length-1];
				var back = e.shiftKey && e.target === $inputels[0];
				if (fwd || back) {
					setTimeout(function(){ 
						if (!$inputels){
							return;
						}
						var el = $inputels[back===true ? $inputels.length-1 : 0];

						if (el){
							el.focus();
						}
					},10);
					return false;
				}
			}
		};
		
		$.prompt.position();
		$.prompt.style();
		
		$.prompt.jqif.click(fadeClicked);
		$window.resize({animate:false}, $.prompt.position);
		$.prompt.jqi.find('.'+ opts.prefix +'close').click($.prompt.close);
		$.prompt.jqib.on("keydown",keyPressEventHandler)
					.on('impromptu:loaded', opts.loaded)
					.on('impromptu:close', opts.close)
					.on('impromptu:statechanging', opts.statechanging)
					.on('impromptu:statechanged', opts.statechanged);

		// Show it
		$.prompt.jqif[opts.show](opts.overlayspeed);
		$.prompt.jqi[opts.show](opts.promptspeed, function(){
			$.prompt.jqib.trigger('impromptu:loaded');
		});
		
		// Timeout
		if(opts.timeout > 0){
			$.prompt.timeout = setTimeout(function(){ $.prompt.close(true); },opts.timeout);
		}

		return $.prompt.jqib;
	};
	
	$.prompt.defaults = {
		prefix:'jqi',
		classes: {
			box: '',
			fade: '',
			prompt: '',
			close: '',
			title: '',
			message: '',
			buttons: '',
			button: '',
			defaultButton: ''
		},
		title: '',
		closeText: '&times;',
		buttons: {
			Ok: true
		},
		loaded: function(e){},
		submit: function(e,v,m,f){},
		close: function(e,v,m,f){},
		statechanging: function(e, from, to){},
		statechanged: function(e, to){},
		opacity: 0.6,
		zIndex: 999,
		overlayspeed: 'slow',
		promptspeed: 'fast',
		show: 'fadeIn',
		focus: 0,
		defaultButton: 0,
		useiframe: false,
		top: '15%',
		position: { 
			container: null, 
			x: null, 
			y: null,
			arrow: null,
			width: null
		},
		persistent: true,
		timeout: 0,
		states: {},
		state: {
			name: null,
			title: '',
			html: '',
			buttons: {
				Ok: true
			},
			focus: 0,
			defaultButton: 0,
			position: { 
				container: null, 
				x: null, 
				y: null,
				arrow: null,
				width: null
			},
			submit: function(e,v,m,f){
				return true;
			}
		}
	};
	
	/**
	* currentPrefix String - At any time this show be the prefix 
	* of the current prompt ex: "jqi"
	*/
	$.prompt.currentPrefix = $.prompt.defaults.prefix;
	
	/**
	* currentStateName String - At any time this is the current state
	* of the current prompt ex: "state0"
	*/
	$.prompt.currentStateName = "";
		
	/**
	* setDefaults - Sets the default options
	* @param o Object - Options to set as defaults
	* @return void
	*/
	$.prompt.setDefaults = function(o) {
		$.prompt.defaults = $.extend({}, $.prompt.defaults, o);
	};
	
	/**
	* setStateDefaults - Sets the default options for a state
	* @param o Object - Options to set as defaults
	* @return void
	*/
	$.prompt.setStateDefaults = function(o) {
		$.prompt.defaults.state = $.extend({}, $.prompt.defaults.state, o);
	};

	/**
	* position - Repositions the prompt (Used internally)
	* @return void
	*/
	$.prompt.position = function(e){
		var restoreFx = $.fx.off,
			$state = $.prompt.getCurrentState(),
			stateObj = $.prompt.options.states[$state.data('jqi-name')],
			pos = stateObj? stateObj.position : undefined,
			$window = $(window),
			bodyHeight = document.body.scrollHeight, //$(document.body).outerHeight(true),
			windowHeight = $(window).height(),
			documentHeight = $(document).height(),
			height = bodyHeight > windowHeight ? bodyHeight : windowHeight,
			top = parseInt($window.scrollTop(),10) + ($.prompt.options.top.toString().indexOf('%') >= 0? 
					(windowHeight*(parseInt($.prompt.options.top,10)/100)) : parseInt($.prompt.options.top,10));

		// when resizing the window turn off animation
		if(e !== undefined && e.data.animate === false){
			$.fx.off = true;
		}
		
		$.prompt.jqib.css({
			position: "absolute",
			height: height,
			width: "100%",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		});
		$.prompt.jqif.css({
			position: "fixed",
			height: height,
			width: "100%",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0
		});

		// tour positioning
		if(pos && pos.container){
			var offset = $(pos.container).offset();
			
			if($.isPlainObject(offset) && offset.top !== undefined){
				$.prompt.jqi.css({
					position: "absolute"
				});
				$.prompt.jqi.animate({
					top: offset.top + pos.y,
					left: offset.left + pos.x,
					marginLeft: 0,
					width: (pos.width !== undefined)? pos.width : null
				});
				top = (offset.top + pos.y) - ($.prompt.options.top.toString().indexOf('%') >= 0? (windowHeight*(parseInt($.prompt.options.top,10)/100)) : parseInt($.prompt.options.top,10));
				$('html,body').animate({ scrollTop: top }, 'slow', 'swing', function(){});
			}
		}
		// custom state width animation
		else if(pos && pos.width){
			$.prompt.jqi.css({
					position: "absolute",
					left: '50%'
				});
			$.prompt.jqi.animate({
					top: pos.y || top,
					left: pos.x || '50%',
					marginLeft: ((pos.width/2)*-1),
					width: pos.width
				});
		}
		// standard prompt positioning
		else{
			$.prompt.jqi.css({
				position: "absolute",
				top: top,
				left: '50%',//$window.width()/2,
				marginLeft: (($.prompt.jqi.outerWidth(false)/2)*-1)
			});
		}

		// restore fx settings
		if(e !== undefined && e.data.animate === false){
			$.fx.off = restoreFx;
		}
	};
	
	/**
	* style - Restyles the prompt (Used internally)
	* @return void
	*/
	$.prompt.style = function(){
		$.prompt.jqif.css({
			zIndex: $.prompt.options.zIndex,
			display: "none",
			opacity: $.prompt.options.opacity
		});
		$.prompt.jqi.css({
			zIndex: $.prompt.options.zIndex+1,
			display: "none"
		});
		$.prompt.jqib.css({
			zIndex: $.prompt.options.zIndex
		});
	};

	/**
	* get - Get the prompt
	* @return jQuery - the prompt
	*/
	$.prompt.get = function(state) {
		return $('.'+ $.prompt.currentPrefix);
	};

	/**
	* addState - Injects a state into the prompt
	* @param statename String - Name of the state
	* @param stateobj Object - options for the state
	* @param afterState String - selector of the state to insert after
	* @return jQuery - the newly created state
	*/
	$.prompt.addState = function(statename, stateobj, afterState) {
		var state = "",
			$state = null,
			arrow = "",
			title = "",
			opts = $.prompt.options,
			$jqistates = $('.'+ $.prompt.currentPrefix +'states'),
			defbtn,k,v,i=0;

		stateobj = $.extend({},$.prompt.defaults.state, {name:statename}, stateobj);

		if(stateobj.position.arrow !== null){
			arrow = '<div class="'+ opts.prefix + 'arrow '+ opts.prefix + 'arrow'+ stateobj.position.arrow +'"></div>';
		}
		if(stateobj.title && stateobj.title !== ''){
			title = '<div class="lead '+ opts.prefix + 'title '+ opts.classes.title +'">'+  stateobj.title +'</div>';
		}
		state += '<div id="'+ opts.prefix +'state_'+ statename +'" class="'+ opts.prefix + 'state" data-jqi-name="'+ statename +'" style="display:none;">'+ 
					arrow + title +
					'<div class="'+ opts.prefix +'message '+ opts.classes.message +'">' + stateobj.html +'</div>'+
					'<div class="'+ opts.prefix +'buttons '+ opts.classes.buttons +'"'+ ($.isEmptyObject(stateobj.buttons)? 'style="display:none;"':'') +'>';
		
		for(k in stateobj.buttons){
			v = stateobj.buttons[k],
			defbtn = stateobj.focus === i || (isNaN(stateobj.focus) && stateobj.defaultButton === i) ? ($.prompt.currentPrefix + 'defaultbutton ' + opts.classes.defaultButton) : '';

			if(typeof v === 'object'){
				state += '<button class="'+ opts.classes.button +' '+ defbtn;
				
				if(typeof v.classes !== "undefined"){
					state += ' '+ ($.isArray(v.classes)? v.classes.join(' ') : v.classes) + ' ';
				}
				
				state += '" name="' + opts.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" id="' + opts.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" value="' + v.value + '">' + v.title + '</button>';
				
			} else {
				state += '<button class="'+ opts.classes.button +' '+ defbtn +'" name="' + opts.prefix + '_' + statename + '_button' + k + '" id="' + opts.prefix +  '_' + statename + '_button' + k + '" value="' + v + '">' + k + '</button>';
				
			}
			i++;
		}
		state += '</div></div>';
		
		$state = $(state);

		$state.on('impromptu:submit', stateobj.submit);

		if(afterState !== undefined){
			$jqistates.find('#'+ $.prompt.currentPrefix +'state_'+ afterState).after($state);
		}
		else{
			$jqistates.append($state);
		}

		$.prompt.options.states[statename] = stateobj;

		return $state;
	};
	
	/**
	* removeState - Removes a state from the promt
	* @param state String - Name of the state
	* @return Boolean - returns true on success, false on failure
	*/
	$.prompt.removeState = function(state) {
		var $state = $.prompt.getState(state),
			rm = function(){ $state.remove(); };

		if($state.length === 0){
			return false;
		}

		// transition away from it before deleting
		if($state.is(':visible')){
			if($state.next().length > 0){
				$.prompt.nextState(rm);
			}
			else{
				$.prompt.prevState(rm);
			}
		}
		else{
			$state.slideUp('slow', rm);
		}

		return true;
	};

	/**
	* getState - Get the state by its name
	* @param state String - Name of the state
	* @return jQuery - the state
	*/
	$.prompt.getState = function(state) {
		return $('#'+ $.prompt.currentPrefix +'state_'+ state);
	};
	$.prompt.getStateContent = function(state) {
		return $.prompt.getState(state);
	};
	
	/**
	* getCurrentState - Get the current visible state
	* @return jQuery - the current visible state
	*/
	$.prompt.getCurrentState = function() {
		return $.prompt.getState($.prompt.getCurrentStateName());
	};
		
	/**
	* getCurrentStateName - Get the name of the current visible state
	* @return String - the current visible state's name
	*/
	$.prompt.getCurrentStateName = function() {
		return $.prompt.currentStateName;
	};
	
	/**
	* goToState - Goto the specified state
	* @param state String - name of the state to transition to
	* @param subState Boolean - true to be a sub state within the currently open state
	* @param callback Function - called when the transition is complete
	* @return jQuery - the newly active state
	*/	
	$.prompt.goToState = function(state, subState, callback) {
		var $jqi = $.prompt.get(),
			jqiopts = $.prompt.options,
			$state = $.prompt.getState(state),
			stateobj = jqiopts.states[$state.data('jqi-name')],
			promptstatechanginge = new $.Event('impromptu:statechanging');

		// subState can be ommitted
		if(typeof subState === 'function'){
			callback = subState;
			subState = false;
		}

		$.prompt.jqib.trigger(promptstatechanginge, [$.prompt.getCurrentStateName(), state]);
		
		if(!promptstatechanginge.isDefaultPrevented() && $state.length > 0){
			$.prompt.jqi.find('.'+ $.prompt.currentPrefix +'parentstate').removeClass($.prompt.currentPrefix +'parentstate');

			if(subState){ // hide any open substates
				// get rid of any substates
				$.prompt.jqi.find('.'+ $.prompt.currentPrefix +'substate').not($state)
					.slideUp(jqiopts.promptspeed)
					.removeClass('.'+ $.prompt.currentPrefix +'substate')
					.find('.'+ $.prompt.currentPrefix +'arrow').hide();

				// add parent state class so it can be visible, but blocked
				$.prompt.jqi.find('.'+ $.prompt.currentPrefix +'state:visible').addClass($.prompt.currentPrefix +'parentstate');

				// add substate class so we know it will be smaller
				$state.addClass($.prompt.currentPrefix +'substate');
			}
			else{ // hide any open states
				$.prompt.jqi.find('.'+ $.prompt.currentPrefix +'state').not($state)
					.slideUp(jqiopts.promptspeed)
					.find('.'+ $.prompt.currentPrefix +'arrow').hide();
			}
			$.prompt.currentStateName = stateobj.name;

			$state.slideDown(jqiopts.promptspeed,function(){
				var $t = $(this);

				// if focus is a selector, find it, else its button index
				if(typeof(stateobj.focus) === 'string'){
					$t.find(stateobj.focus).eq(0).focus();
				}
				else{
					$t.find('.'+ $.prompt.currentPrefix +'defaultbutton').focus();
				}

				$t.find('.'+ $.prompt.currentPrefix +'arrow').show(jqiopts.promptspeed);
				
				if (typeof callback === 'function'){
					$.prompt.jqib.on('impromptu:statechanged', callback);
				}
				$.prompt.jqib.trigger('impromptu:statechanged', [state]);
				if (typeof callback === 'function'){
					$.prompt.jqib.off('impromptu:statechanged', callback);
				}
			});
			if(!subState){
				$.prompt.position();
			}
		}
		return $state;
	};

	/**
	* nextState - Transition to the next state
	* @param callback Function - called when the transition is complete
	* @return jQuery - the newly active state
	*/	
	$.prompt.nextState = function(callback) {
		var $next = $('#'+ $.prompt.currentPrefix +'state_'+ $.prompt.getCurrentStateName()).next();
		return $.prompt.goToState( $next.attr('id').replace($.prompt.currentPrefix +'state_',''), callback );
	};
	
	/**
	* prevState - Transition to the previous state
	* @param callback Function - called when the transition is complete
	* @return jQuery - the newly active state
	*/	
	$.prompt.prevState = function(callback) {
		var $prev = $('#'+ $.prompt.currentPrefix +'state_'+ $.prompt.getCurrentStateName()).prev();
		$.prompt.goToState( $prev.attr('id').replace($.prompt.currentPrefix +'state_',''), callback );
	};
	
	/**
	* close - Closes the prompt
	* @param callback Function - called when the transition is complete
	* @param clicked String - value of the button clicked (only used internally)
	* @param msg jQuery - The state message body (only used internally)
	* @param forvals Object - key/value pairs of all form field names and values (only used internally)
	* @return jQuery - the newly active state
	*/	
	$.prompt.close = function(callCallback, clicked, msg, formvals){
		if($.prompt.timeout){
			clearTimeout($.prompt.timeout);
			$.prompt.timeout = false;
		}

		$.prompt.jqib.fadeOut('fast',function(){

			if(callCallback) {
				$.prompt.jqib.trigger('impromptu:close', [clicked,msg,formvals]);
			}
			$.prompt.jqib.remove();
			
			$(window).off('resize',$.prompt.position);
		});
	};
	
	/**
	* Enable using $('.selector').prompt({});
	* This will grab the html within the prompt as the prompt message
	*/
	$.fn.prompt = function(options){
		if(options === undefined){
			options = {};
		}
		if(options.withDataAndEvents === undefined){
			options.withDataAndEvents = false;
		}
		
		$.prompt($(this).clone(options.withDataAndEvents).html(),options);
	};
	
})(jQuery);
