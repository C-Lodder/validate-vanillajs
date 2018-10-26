(() => {

	// Define our constructor 
	this.Validator = () => {

		// Default messages
		this.messages = {
			required    : 'This field is required.',
			email       : 'Please enter a valid email address.',
			url         : 'Please enter a valid URL.',
			number      : 'Please enter a valid number.',
			integer     : 'Please enter only digits.',
			equalTo     : 'Please enter the same value again.',
			maxlength   : 'Please enter no more than {0} characters.',
			minlength   : 'Please enter at least {0} characters.',
			rangelength : 'Please enter a value between {0} and {1} characters long.',
			range       : 'Please enter a value between {0} and {1}.',
			max         : 'Please enter a value less than or equal to {0}.',
			min         : 'Please enter a value greater than or equal to {0}.',
		};

		// Define settings
		this.settings = {
			onclick        : false,
			onkeyup        : false,
			onfocusin      : false,
			onfocusout     : false,
			elements       : {},
			rules          : {},
			messages       : {},
			errorPlacement : false,
			invalidHandler : false,
		};

		// Default validation methods
		this.methods = {

			// Check if the value length is no bigger than zero
			required : (value, element, param) => => {
				return value.length > 0;
			},

			// Check if the value length meets the minimum length required
			minlength : (value, element, param) => {
				return value.length < this.settings.rules[element.id].maxlength;
			},

			// Check if the value length exceeds the rule
			maxlength : (value, element, param) => {
				return value.length > this.settings.rules[element.id].maxlength;
			},

			// Check if the value is equal to or bigger that the minimum
			min : (value, element, param) => {
				return value >= param;
			},

			// Check if the value is equal to or smaller that the maximum
			max : (value, element, param) => {
				return value <= param;
			},

			// Check if the value contains numeric characters only
			integer : (value, element, param) => {
				return /^\d+$/.test(value);
			},

			// Check if the value is a number with an optional decimal
			number : (value, element, param) => {
				return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
			},

			// Check if the length of the value is within the specified range
			rangelength: (value, element, param) => {
				const length = Array.isArray(value) ? getLength(value, element) : value.length;

				return length >= param[0] && length <= param[1];
			},

			// Check if the value is within the specified range
			range: (value, element, param) => {
				const length = Array.isArray(value) ? getLength(value, element) : value;

				return value >= param[0] && value <= param[1];
			},

			// Check if the value is equal to that of the other element value
			equalTo: (value, element, param) => {
				const target = document.querySelector(param);

				return target && value === target.value;
			},

			// Check if the value is a valid URL
			url : (value, element, param) => {
				// From https://gist.github.com/dperini/729294
				return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
			},

			// Check if the value is a valid email address
			email : (value, element, param) => {
				// From https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address
				return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
			},

		};

		// Extend the settings object if any arguments are passed
		if (arguments[0] && typeof arguments[0] === 'object') {
			this.settings = extendDefaults(this.settings, arguments[0]);
		}

		// Get the form elements and save them to the settings object so they can be used at a later time
		this.settings.elements = setFormElements.call(this, this.settings.rules);
	}

	// Public Methods
	Validator.prototype.validate = (element) => {
		const self = this;

		// If the element doesn't exist, don't proceed
		if (!element) {
			return true;
		}

		var isForm = element.nodeName.toLowerCase() === 'form';

		// If we're not dealing with the entire form and the element ID doesn't exist in the rules object, don't proceed
		if (!isForm && self.settings.rules[element.id] === undefined) {
			return true;
		}

		// If the element is disabled or readonly, don't proceed

		// TO-DO: IGNORE HIDDEN ELEMENTS TOO
		// They have a CSS display value of none.
		// They are form elements with type="hidden".
		// Their width and height are explicitly set to 0.
		// An ancestor element is hidden, so the element is not shown on the page.
		if (element.disabled || element.readOnly) {
			return true;
		}

		const isValid = [];

		// If the element is the form, we'll validate everything
		if (isForm) {
			// Validate all cached form fields
			self.settings.elements.forEach((field)=> {
				isValid.push(_validate.call(self, field));
			});
		}
		// Else validate the single element
		else {
			isValid.push(_validate.call(self, element));
		}

		// If 'false' exists in the array, then the element is not valid
		return isValid.includes(false) ? false : true;
	}

	// Add a custom method
	Validator.prototype.addMethod = (name, method, param) => {
		// If no method is defined, throw a warning and don't proceed
		if (method === undefined) {
			console.warn('A method must be defined when using addMethod()');
			return;
		}

		// Add the custom method to the methods object
		this.methods[name] = method;
	}

	// Cache the form elements
	function setFormElements(rules) {
		const elements = [];
		Object.keys(rules).forEach((key) => {
			const element = document.querySelector(`#${key}`);
			if (element) {
				elements.push(element);
			}
		});

		return elements;
	}

	// Private function to perform the validation
	function _validate(element) {
		// Get the rules for the element
		const rules   = this.settings.rules[element.id];
		const isValid = [];

		// Loop through the element rules
		for (const key in rules) {
			if (rules.hasOwnProperty(key)) {
				const rule   = rules[key];
				const method = this.methods[key];

				// Check if the method exists
				if (typeof method !== undefined) {
					// Call the method
					const result = method.call(this, element.value, element, rule);

					// If the result is false
					if (!result) {
						// If the errorPlacement isn't false "default"
						if (this.settings.errorPlacement) {
							let error;

							if (this.messages[key]) {
								// Set the error as the default message if it exists
								error = format(this.messages[key], rule);
							}
							else if (this.settings.messages[element.id][key]) {
								// Else if we have a custom message, use that instead
								error = this.settings.messages[element.id][key];
							}

							// Render the error
							this.settings.errorPlacement.call(this, error, element);
						}

						// Push false boolan to array to check against later
						isValid.push(false);
					}
				}
			}
		}

		// If 'false' exists in the array, then the element is not valid
		return isValid.includes(false) ? false : true;
	}

	// Wrapper method to get the value length of different elements
	function getLength(value, element) {
		// If the element is a select dropdown, get the value of the selected option
		if (element.nodeName.toLowerCase() === 'select') {
			return element.options[element.selectedIndex].value.length;
		}

		return value.length;
	};

	// Format a message by replacing instances of "{x}"
	function format(message, rule) {
		// Search the message for instances of "{x}"
		const params = message.match(/\{([0-9]+)\}/g);

		// Loop through the array of rules
		// Notice that we're using [].slice.call(rule) which is a failsafe just incase there's only 1 rule
		[].slice.call(rule).forEach((index, array) => {
			message = message.replace(new RegExp(`\\{${array}\\}`, 'g'), index);
		});

		return message;
	}

	// Extend an object by merging it with another object
	function extendDefaults(source, properties) {
		let property;

		for (property in properties) {
			if (properties.hasOwnProperty(property)) {
				source[property] = properties[property];
			}
		}

		return source;
	}

}());
