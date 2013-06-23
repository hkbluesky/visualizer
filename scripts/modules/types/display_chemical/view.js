define(function(['modules/view'], function(Default)) {
	
	function view() {};
	view.prototype = $.extend(true, {}, Default, {

		init: function() {	
			var html = [];
			html.push('<div class="ci-displaychemical-chemical"></div>');
			this.dom = $(html.join(''));
			this.module.getDomContent().html(this.dom);
		},
		
		onResize: function() {
					
		},

		inDom: function() {

		},

		blank: function() {
			this.dom.html('');
		},

		onProgress: function() {
			this.dom.html("Loading in progress");
		},
		
		update: function() {

			var moduleValue;
			var view = this;
			if(!(moduleValue = this.module.getDataFromRel('chemical')))
				return;
				
			moduleValue = moduleValue.getData()
			this.chemical = moduleValue;
			CI.DataType.toScreen(this.chemical, this.module, function(val) {
				view.dom.html(val);	
			});
		},
		
		
		getDom: function() {
			return this.dom;
		},
		
		typeToScreen: {
			
			asChemical: function(data) {
				
				return $('<div class="ci-displaylist-list">').each(function(i) {
					var div = $(this);
					var html = [];
					html.push('<div class="ci-chemical-display">');
					html.push('<div class="ci-chemical-img"><img src="' + data.instance.getImageUrl() + '" /></div>');
					html.push('<div class="ci-chemical-details">');
					html.push('<div class="ci-chemical-iupac"><label>IUPAC</label>' + data.instance.getIUPAC() + '<div class="ci-spacer"></div></div>');
					html.push('<div class="ci-chemical-mw"><label>Molecular weight</label>' + data.instance.getMW() + '<div class="ci-spacer"></div></div>');
					html.push('<div class="ci-chemical-mw"><label>Molecular formula</label>' + data.instance.getMF() + '<div class="ci-spacer"></div></div>');
					html.push('<div class="ci-chemical-mw"><label>Density</label>' + data.instance.getDensity() + '<div class="ci-spacer"></div></div>');
					html.push('</div>');
					html.push('</div>');
					div.append(html.join(''));
				});
			}
			
		}
	});

	return view;
});
