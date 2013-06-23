
define(['./default'], function(FieldDefault) {

	var field = function(main) {
		this.main = main;
		this.divs = [];
		this.input = $("<input />");
	}

	field.prototype = $.extend({}, FieldDefault, {

		initHtml: function(tableWrapper) {},
		buildHtml: function() {tableWrapper},
		addField: function(position) {
			var div = $("<div />");
			this.divs.splice(position, 0, div)
			this.input = $("<input />");


			return { html: div, index: position };		
		},

		removeField: function(position) {
			this.divs.splice(position, 1)[0].remove();
		},

		startEditing: function(position) {
			this.divs[position].hide().after(this.input.val(this.main.getValue(position)));
			if(this.autocompleteOptions) {
				this.input.autocomplete({
					minLength: 0,
					source: this.autocompleteOptions
				});

				this.input.autocomplete('widget').addClass('bi-form-autocomplete');
				this.input.autocomplete("search", this.input.val());
			}

			this.input.focus();
		},

		stopEditing: function(position) {
			this.divs[position].show().html(this.input.val());
			this.input.remove();
			this.main.changeValue(position, this.input.val());
		},

		setValue: function(index, value) {
			this.main.fields[index].html.html(value);
			this.main.changeValue(index, value);		
		}		
	});

	return field;
});
