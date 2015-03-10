/*! jQuery-Impromptu - v6.0.0 - 2014-12-27
* http://trentrichardson.com/Impromptu
* Copyright (c) 2014 Trent Richardson; Licensed MIT */
(function(root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(root.jQuery);
	}
}(this, function($) {
	'use strict';

	// ########################################################################
	// Base object
	// ########################################################################

	/**
	* Imp - Impromptu object - passing no params will not open, only return the instance
	* @param message String/Object - String of html or Object of states
	* @param options Object - Options to set the prompt
	* @return Imp - the instance of this Impromptu object
	*/
	var Imp = function(message, options){
		var t = this;
		t.id = Imp.count++;

		Imp.lifo.push(t);

		if(message){
			t.open(message, options);
		}
		return t;
	};

	// ########################################################################
	// static properties and methods
	// ########################################################################

	/**
	* defaults - the default options
	*/
	Imp.defaults = {
		prefix:'jqi',
		classes: {
			box: '',
			fade: '',
			prompt: '',
			form: '',
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
		hide: 'fadeOut',
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
	* setDefaults - Sets the default options
	* @param o Object - Options to set as defaults
	* @return void
	*/
	Imp.setDefaults = function(o) {
		Imp.defaults = $.extend({}, Imp.defaults, o);
	};

	/**
	* setStateDefaults - Sets the default options for a state
	* @param o Object - Options to set as defaults
	* @return void
	*/
	Imp.setStateDefaults = function(o) {
		Imp.defaults.state = $.extend({}, Imp.defaults.state, o);
	};

	/**
	* @var Int - A counter used to provide a unique ID for new prompts
	*/
	Imp.count = 0;

	/**
	* @var Array - An array of Impromptu intances in a LIFO queue (last in first out)
	*/
	Imp.lifo = [];

	/**
	* getLast - get the last element from the queue (doesn't pop, just returns)
	* @return Imp - the instance of this Impromptu object or false if queue is empty
	*/
	Imp.getLast = function(){
		var l = Imp.lifo.length;
		return (l > 0)? Imp.lifo[l-1] : false;
	};

	/**
	* removeFromStack - remove an element from the lifo stack by its id
	* @param id int - id of the instance to remove
	* @return api - The api of the element removed from the stack or void
	*/
	Imp.removeFromStack = function(id){
		for(var i=Imp.lifo.length-1; i>=0; i--){
			if(Imp.lifo[i].id === id){
				return Imp.lifo.splice(i,1)[0];
			}
		}
	};

	// ########################################################################
	// extend our object instance properties and methods
	// ########################################################################
	Imp.prototype = {

		/**
		* @var Int - A unique id, simply an autoincremented number
		*/
		id: null,

		/**
		* open - Opens the prompt
		* @param message String/Object - String of html or Object of states
		* @param options Object - Options to set the prompt
		* @return Imp - the instance of this Impromptu object
		*/
		open: function(message, options) {
			var t = this;

			t.options = $.extend({},Imp.defaults,options);

			// Be sure any previous timeouts are destroyed
			if(t.timeout){
				clearTimeout(t.timeout);
			}
			t.timeout = false;

			var opts = t.options,
				$body = $(document.body),
				$window = $(window);

			//build the box and fade
			var msgbox = '<div class="'+ opts.prefix +'box '+ opts.classes.box +'">';
			if(opts.useiframe && ($('object, applet').length > 0)) {
				msgbox += '<iframe src="javascript:false;" style="display:block;position:absolute;z-index:-1;" class="'+ opts.prefix +'fade '+ opts.classes.fade +'"></iframe>';
			} else {
				msgbox += '<div class="'+ opts.prefix +'fade '+ opts.classes.fade +'"></div>';
			}
			msgbox += '<div class="'+ opts.prefix +' '+ opts.classes.prompt +'">'+
						'<form action="javascript:false;" onsubmit="return false;" class="'+ opts.prefix +'form '+ opts.classes.form +'">'+
							'<div class="'+ opts.prefix +'close '+ opts.classes.close +'">'+ opts.closeText +'</div>'+
							'<div class="'+ opts.prefix +'states"></div>'+
						'</form>'+
					'</div>'+
				'</div>';

			t.jqib = $(msgbox).appendTo($body);
			t.jqi = t.jqib.children('.'+ opts.prefix);
			t.jqif = t.jqib.children('.'+ opts.prefix +'fade');

			//if a string was passed, convert to a single state
			if(message.constructor === String){
				message = {
					state0: {
						title: opts.title,
						html: message,
						buttons: opts.buttons,
						position: opts.position,
						focus: opts.focus,
						defaultButton: opts.defaultButton,
						submit: opts.submit
					}
				};
			}

			//build the states
			t.options.states = {};
			var k,v;
			for(k in message){
				v = $.extend({},Imp.defaults.state,{name:k},message[k]);
				t.addState(v.name, v);

				if(t.currentStateName === ''){
					t.currentStateName = v.name;
				}
			}

			//Events
			t.jqi.on('click', '.'+ opts.prefix +'buttons button', function(e){
				var $t = $(this),
					$state = $t.parents('.'+ opts.prefix +'state'),
					stateobj = t.options.states[$state.data('jqi-name')],
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
				$.each(t.jqi.children('form').serializeArray(),function(i,obj){
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
					t.close(true, clicked,msg,forminputs);
				}
			});

			// if the fade is clicked blink the prompt
			var fadeClicked = function(){
				if(opts.persistent){
					var offset = (opts.top.toString().indexOf('%') >= 0? ($window.height()*(parseInt(opts.top,10)/100)) : parseInt(opts.top,10)),
						top = parseInt(t.jqi.css('top').replace('px',''),10) - offset;

					//$window.scrollTop(top);
					$('html,body').animate({ scrollTop: top }, 'fast', function(){
						var i = 0;
						t.jqib.addClass(opts.prefix +'warning');
						var intervalid = setInterval(function(){
							t.jqib.toggleClass(opts.prefix +'warning');
							if(i++ > 1){
								clearInterval(intervalid);
								t.jqib.removeClass(opts.prefix +'warning');
							}
						}, 100);
					});
				}
				else {
					t.close(true);
				}
			};

			// listen for esc or tab keys
			var keyDownEventHandler = function(e){
				var key = (window.event) ? event.keyCode : e.keyCode;

				//escape key closes
				if(key === 27) {
					fadeClicked();
				}

				//enter key pressed trigger the default button if its not on it, ignore if it is a textarea
				if(key === 13){
					var $defBtn = t.getCurrentState().find('.'+ opts.prefix +'defaultbutton');
					var $tgt = $(e.target);

					if($tgt.is('textarea,.'+opts.prefix+'button') === false && $defBtn.length > 0){
						e.preventDefault();
						$defBtn.click();
					}
				}

				//constrain tabs, tabs should iterate through the state and not leave
				if (key === 9){
					var $inputels = $('input,select,textarea,button',t.getCurrentState());
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

			t.position();
			t.style();

			// store copy of the window resize function for interal use only
			t._windowResize = function(e){
				t.position(e);
			};
			$window.resize({ animate: false }, t._windowResize);

			t.jqif.click(fadeClicked);
			t.jqi.find('.'+ opts.prefix +'close').click(function(){ t.close(); });
			t.jqib.on("keydown",keyDownEventHandler)
						.on('impromptu:loaded', opts.loaded)
						.on('impromptu:close', opts.close)
						.on('impromptu:statechanging', opts.statechanging)
						.on('impromptu:statechanged', opts.statechanged);

			// Show it
			t.jqif[opts.show](opts.overlayspeed);
			t.jqi[opts.show](opts.promptspeed, function(){

				var $firstState = t.jqi.find('.'+ opts.prefix +'states .'+ opts.prefix +'state').eq(0);
				t.goToState($firstState.data('jqi-name'));

				t.jqib.trigger('impromptu:loaded');
			});

			// Timeout
			if(opts.timeout > 0){
				t.timeout = setTimeout(function(){ t.close(true); },opts.timeout);
			}

			return t;
		},

		/**
		* close - Closes the prompt
		* @param callback Function - called when the transition is complete
		* @param clicked String - value of the button clicked (only used internally)
		* @param msg jQuery - The state message body (only used internally)
		* @param forvals Object - key/value pairs of all form field names and values (only used internally)
		* @return Imp - the instance of this Impromptu object
		*/
		close: function(callCallback, clicked, msg, formvals){
			var t = this;
			Imp.removeFromStack(t.id);

			if(t.timeout){
				clearTimeout(t.timeout);
				t.timeout = false;
			}

			if(t.jqib){
				t.jqib[t.options.hide]('fast',function(){
					
					t.jqib.trigger('impromptu:close', [clicked,msg,formvals]);
					
					t.jqib.remove();
					
					$(window).off('resize', t._windowResize);

					if(typeof callCallback === 'function'){
						callCallback();
					}
				});
			}
			t.currentStateName = "";

			return t;
		},

		/**
		* addState - Injects a state into the prompt
		* @param statename String - Name of the state
		* @param stateobj Object - options for the state
		* @param afterState String - selector of the state to insert after
		* @return jQuery - the newly created state
		*/
		addState: function(statename, stateobj, afterState) {
			var t = this,
				state = '',
				$state = null,
				arrow = '',
				title = '',
				opts = t.options,
				$jqistates = $('.'+ opts.prefix +'states'),
				buttons = [],
				showHtml,defbtn,k,v,l,i=0;

			stateobj = $.extend({},Imp.defaults.state, {name:statename}, stateobj);

			if(stateobj.position.arrow !== null){
				arrow = '<div class="'+ opts.prefix + 'arrow '+ opts.prefix + 'arrow'+ stateobj.position.arrow +'"></div>';
			}
			if(stateobj.title && stateobj.title !== ''){
				title = '<div class="lead '+ opts.prefix + 'title '+ opts.classes.title +'">'+  stateobj.title +'</div>';
			}

			showHtml = stateobj.html;
			if (typeof stateobj.html === 'function') {
				showHtml = 'Error: html function must return text';
			}

			state += '<div class="'+ opts.prefix + 'state" data-jqi-name="'+ statename +'" style="display:none;">'+
						arrow + title +
						'<div class="'+ opts.prefix +'message '+ opts.classes.message +'">' + showHtml +'</div>'+
						'<div class="'+ opts.prefix +'buttons '+ opts.classes.buttons +'"'+ ($.isEmptyObject(stateobj.buttons)? 'style="display:none;"':'') +'>';

			// state buttons may be in object or array, lets convert objects to arrays
			if($.isArray(stateobj.buttons)){
				buttons = stateobj.buttons;
			}
			else if($.isPlainObject(stateobj.buttons)){
				for(k in stateobj.buttons){
					if(stateobj.buttons.hasOwnProperty(k)){
						buttons.push({ title: k, value: stateobj.buttons[k] });
					}
				}
			}

			// iterate over each button and create them
			for(i=0, l=buttons.length; i<l; i++){
				v = buttons[i],
				defbtn = stateobj.focus === i || (isNaN(stateobj.focus) && stateobj.defaultButton === i) ? (opts.prefix + 'defaultbutton ' + opts.classes.defaultButton) : '';

				state += '<button class="'+ opts.classes.button +' '+ opts.prefix + 'button '+ defbtn;

				if(typeof v.classes !== "undefined"){
					state += ' '+ ($.isArray(v.classes)? v.classes.join(' ') : v.classes) + ' ';
				}

				state += '" name="' + opts.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" value="' + v.value + '">' + v.title + '</button>';
			}
			
			state += '</div></div>';

			$state = $(state);

			$state.on('impromptu:submit', stateobj.submit);

			if(afterState !== undefined){
				$jqistates.find('[data-jqi-name="'+afterState+'"]').after($state);
			}
			else{
				$jqistates.append($state);
			}

			t.options.states[statename] = stateobj;

			return $state;
		},

		/**
		* removeState - Removes a state from the prompt
		* @param state String - Name of the state
		* @param newState String - Name of the state to transition to
		* @return Boolean - returns true on success, false on failure
		*/
		removeState: function(state, newState) {
			var t = this,
				$state = t.getState(state),
				rm = function(){ $state.remove(); };

			if($state.length === 0){
				return false;
			}

			// transition away from it before deleting
			if($state.css('display') !== 'none'){
				if(newState !== undefined && t.getState(newState).length > 0){
					t.goToState(newState, false, rm);
				}
				else if($state.next().length > 0){
					t.nextState(rm);
				}
				else if($state.prev().length > 0){
					t.prevState(rm);
				}
				else{
					t.close();
				}
			}
			else{
				$state.slideUp('slow', rm);
			}

			return true;
		},

		/**
		* getApi - Get the api, so you can extract it from $.prompt stack
		* @return jQuery - the prompt
		*/
		getApi: function() {
			return this;
		},

		/**
		* getBox - Get the box containing fade and prompt
		* @return jQuery - the prompt
		*/
		getBox: function() {
			return this.jqib;
		},

		/**
		* getPrompt - Get the prompt
		* @return jQuery - the prompt
		*/
		getPrompt: function() {
			return this.jqi;
		},

		/**
		* getState - Get the state by its name
		* @param statename String - Name of the state
		* @return jQuery - the state
		*/
		getState: function(statename) {
			return this.jqi.find('[data-jqi-name="'+ statename +'"]');
		},

		/**
		* getCurrentState - Get the current visible state
		* @return jQuery - the current visible state
		*/
		getCurrentState: function() {
			return this.getState(this.getCurrentStateName());
		},

		/**
		* getCurrentStateName - Get the name of the current visible state/substate
		* @return String - the current visible state's name
		*/
		getCurrentStateName: function() {
			return this.currentStateName;
		},

		/**
		* position - Repositions the prompt (Used internally)
		* @return void
		*/
		position: function(e){
			var t = this,
				restoreFx = $.fx.off,
				$state = t.getCurrentState(),
				stateObj = t.options.states[$state.data('jqi-name')],
				pos = stateObj? stateObj.position : undefined,
				$window = $(window),
				bodyHeight = document.body.scrollHeight, //$(document.body).outerHeight(true),
				windowHeight = $(window).height(),
				documentHeight = $(document).height(),
				height = bodyHeight > windowHeight ? bodyHeight : windowHeight,
				top = parseInt($window.scrollTop(),10) + (t.options.top.toString().indexOf('%') >= 0?
						(windowHeight*(parseInt(t.options.top,10)/100)) : parseInt(t.options.top,10));

			// when resizing the window turn off animation
			if(e !== undefined && e.data.animate === false){
				$.fx.off = true;
			}

			t.jqib.css({
				position: "absolute",
				height: height,
				width: "100%",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			});
			t.jqif.css({
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
					t.jqi.css({
						position: "absolute"
					});
					t.jqi.animate({
						top: offset.top + pos.y,
						left: offset.left + pos.x,
						marginLeft: 0,
						width: (pos.width !== undefined)? pos.width : null
					});
					top = (offset.top + pos.y) - (t.options.top.toString().indexOf('%') >= 0? (windowHeight*(parseInt(t.options.top,10)/100)) : parseInt(t.options.top,10));
					$('html,body').animate({ scrollTop: top }, 'slow', 'swing', function(){});
				}
			}
			// custom state width animation
			else if(pos && pos.width){
				t.jqi.css({
						position: "absolute",
						left: '50%'
					});
				t.jqi.animate({
						top: pos.y || top,
						left: pos.x || '50%',
						marginLeft: ((pos.width/2)*-1),
						width: pos.width
					});
			}
			// standard prompt positioning
			else{
				t.jqi.css({
					position: "absolute",
					top: top,
					left: '50%',//$window.width()/2,
					marginLeft: ((t.jqi.outerWidth(false)/2)*-1)
				});
			}

			// restore fx settings
			if(e !== undefined && e.data.animate === false){
				$.fx.off = restoreFx;
			}
		},

		/**
		* style - Restyles the prompt (Used internally)
		* @return void
		*/
		style: function(){
			var t = this;
			
			t.jqif.css({
				zIndex: t.options.zIndex,
				display: "none",
				opacity: t.options.opacity
			});
			t.jqi.css({
				zIndex: t.options.zIndex+1,
				display: "none"
			});
			t.jqib.css({
				zIndex: t.options.zIndex
			});
		},

		/**
		* goToState - Goto the specified state
		* @param state String - name of the state to transition to
		* @param subState Boolean - true to be a sub state within the currently open state
		* @param callback Function - called when the transition is complete
		* @return jQuery - the newly active state
		*/
		goToState: function(state, subState, callback) {
			var t = this,
				$jqi = t.jqi,
				jqiopts = t.options,
				$state = t.getState(state),
				stateobj = jqiopts.states[$state.data('jqi-name')],
				promptstatechanginge = new $.Event('impromptu:statechanging'),
				opts = t.options;

			if(stateobj !== undefined){


				if (typeof stateobj.html === 'function') {
					var contentLaterFunc = stateobj.html;
					$state.find('.' + opts.prefix +'message ').html(contentLaterFunc());
				}

				// subState can be ommitted
				if(typeof subState === 'function'){
					callback = subState;
					subState = false;
				}

				t.jqib.trigger(promptstatechanginge, [t.getCurrentStateName(), state]);

				if(!promptstatechanginge.isDefaultPrevented() && $state.length > 0){
					t.jqi.find('.'+ opts.prefix +'parentstate').removeClass(opts.prefix +'parentstate');

					if(subState){ // hide any open substates
						// get rid of any substates
						t.jqi.find('.'+ opts.prefix +'substate').not($state)
							.slideUp(jqiopts.promptspeed)
							.removeClass('.'+ opts.prefix +'substate')
							.find('.'+ opts.prefix +'arrow').hide();

						// add parent state class so it can be visible, but blocked
						t.jqi.find('.'+ opts.prefix +'state:visible').addClass(opts.prefix +'parentstate');

						// add substate class so we know it will be smaller
						$state.addClass(opts.prefix +'substate');
					}
					else{ // hide any open states
						t.jqi.find('.'+ opts.prefix +'state').not($state)
							.slideUp(jqiopts.promptspeed)
							.find('.'+ opts.prefix +'arrow').hide();
					}
					t.currentStateName = stateobj.name;

					$state.slideDown(jqiopts.promptspeed,function(){
						var $t = $(this);

						// if focus is a selector, find it, else its button index
						if(typeof(stateobj.focus) === 'string'){
							$t.find(stateobj.focus).eq(0).focus();
						}
						else{
							$t.find('.'+ opts.prefix +'defaultbutton').focus();
						}

						$t.find('.'+ opts.prefix +'arrow').show(jqiopts.promptspeed);

						if (typeof callback === 'function'){
							t.jqib.on('impromptu:statechanged', callback);
						}
						t.jqib.trigger('impromptu:statechanged', [state]);
						if (typeof callback === 'function'){
							t.jqib.off('impromptu:statechanged', callback);
						}
					});
					if(!subState){
						t.position();
					}
				} // end isDefaultPrevented()	
			}// end stateobj !== undefined

			return $state;
		},

		/**
		* nextState - Transition to the next state
		* @param callback Function - called when the transition is complete
		* @return jQuery - the newly active state
		*/
		nextState: function(callback) {
			var t = this,
				$next = t.getCurrentState().next();
			if($next.length > 0){
				t.goToState( $next.data('jqi-name'), callback );
			}
			return $next;
		},

		/**
		* prevState - Transition to the previous state
		* @param callback Function - called when the transition is complete
		* @return jQuery - the newly active state
		*/
		prevState: function(callback) {
			var t = this,
				$prev = t.getCurrentState().prev();
			if($prev.length > 0){
				t.goToState( $prev.data('jqi-name'), callback );
			}
			return $prev;
		}

	};

	// ########################################################################
	// $.prompt will manage a queue of Impromptu instances
	// ########################################################################

	/**
	* $.prompt create a new Impromptu instance and push it on the stack of instances
	* @param message String/Object - String of html or Object of states
	* @param options Object - Options to set the prompt
	* @return jQuery - the jQuery object of the prompt within the modal
	*/
	$.prompt = function(message, options){
		var api = new Imp(message, options);
		return api.jqi;
	};

	/**
	* Copy over static methods
	*/
	$.each(Imp, function(k,v){
		$.prompt[k] = v;
	});

	/**
	* Create a proxy for accessing all instance methods. The close method pops from queue.
	*/
	$.each(Imp.prototype, function(k,v){
		$.prompt[k] = function(){
			var api = Imp.getLast(); // always use the last instance on the stack

			if(api && typeof api[k] === "function"){
				return api[k].apply(api, arguments);
			}
		};
	});

	// ########################################################################
	// jQuery Plugin and public access
	// ########################################################################

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

	/**
	* Export it as Impromptu and $.prompt
	* Can be used from here forth as new Impromptu(states, opts)
	*/
	window.Impromptu = Imp;

}));
