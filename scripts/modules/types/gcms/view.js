define(['modules/defaultview', 'libs/plot/plot', 'util/datatraversing', './gcms', 'util/util', 'util/api'], function(Default, Graph, Traversing, gcms, Util, API) {
	
	function view() {};
	view.prototype = $.extend(true, {}, Default, {
		
		init: function() {

			var html = [];
			html.push('<div class="gcms"><div class="gc"></div><div class="ms"></div></div>');
			this.namedSeries = {};
			this.dom = $(html.join(''));
			this.module.getDomContent().html(this.dom);
		},

		unload: function() {
			this.gcmsInstance.unload();
			this.dom.remove();
		},

		inDom: function() {
			var self = this;
			var _gcms = new gcms();
			_gcms.setMSContinuous(this.module.getConfiguration().continuous);
			_gcms.setRangeLimit(this.module.getConfiguration().nbzones || 1);
			_gcms.inDom(this.dom.find('.gc').get(0), this.dom.find('.ms').get(0));

			_gcms.onAnnotationChange = function(annot) {
				self.module.controller.sendAction('annotation', annot, 'onAnnotationChange');
				Traversing.triggerDataChange(annot);
			}

			_gcms.onAnnotationMake = function(annot) {
				self.module.controller.sendAction('annotation', annot, 'onAnnotationAdd');
			}

			_gcms.onZoomGC = function(from, to) {
				self.module.controller.sendAction('fromtoGC', {type: 'fromTo', value: { from: from, to: to }}, 'onZoomGCChange');
			}

			_gcms.onZoomMS = function(from, to) {
				self.module.controller.sendAction('fromtoMS', {type: 'fromTo', value: { from: from, to: to }}, 'onZoomMSChange');
			}

			this.gcmsInstance = _gcms;
		},

		onResize: function(width, height) {

			this.gcmsInstance.resize(width, height);
		},
		
		update: {
			'jcamp': function(moduleValue) {
				var self = this;
				moduleValue = Traversing.getValueIfNeeded(moduleValue);
				require(['util/jcampconverter'], function(tojcamp) {

					var jcamp = tojcamp(moduleValue);
					if(jcamp.gcms) {
						self.gcmsInstance.setGC(jcamp.gcms.gc);
						self.gcmsInstance.setMS(jcamp.gcms.ms);

						self.resetAnnotationsGC();
					}
				});
			},

			'annotationgc': function(value) {
				value = Traversing.getValueIfNeeded(value);
				if(!value)
					return;
				this.annotations = value;
				this.resetAnnotationsGC();
			},

			'gcms': function(moduleValue) {
				this.gcmsInstance.setGC(moduleValue.gc);
				this.gcmsInstance.setMS(moduleValue.ms);
				this.resetAnnotationsGC();
			},

			'gc': function(moduleValue) {
				var self = this;
				if(!this.gcmsInstance)
					return;
				require(['util/jcampconverter'], function(tojcamp) {
					var jcamp = tojcamp(Traversing.getValueIfNeeded(moduleValue));
					if(jcamp.spectra)
						self.gcmsInstance.setExternalGC(jcamp.spectra[0].data[0]);
				});
			},


			'ms': function(moduleValue, name, cont) {
				var self = this;
				if(!this.gcmsInstance)
					return;
				require(['util/jcampconverter'], function(tojcamp) {
					var jcamp = tojcamp(Traversing.getValueIfNeeded(moduleValue));
					if(jcamp.spectra)
						self.gcmsInstance.setExternalMS(jcamp.spectra[0].data[0], cont);
				});
			},

			'mscont': function(moduleValue, name) {
				this.update.ms(moduleValue, name, true);
			}
		},

		getDom: function() {
			return this.dom;
		},

		resetAnnotationsGC: function() {
			if(!this.gcmsInstance)
				return;
			for(var i = 0, l = this.annotations.length; i < l; i++) {
				this.doAnnotation(this.annotations[i]);
			}
		},


		onActionReceive: {
			fromtoGC: function(value, name) {
				this.gcmsInstance.getGC().getBottomAxis()._doZoomVal(value.value.from, value.value.to, true);
			},

			fromtoMS: function(value, name) {
				this.gcmsInstance.getMS().getBottomAxis()._doZoomVal(value.value.from, value.value.to, true);
			},

			zoomOnAnnotation: function(value, name) {
				if(!value.pos && !value.pos2)
					return;
				this.gcmsInstance.zoomOn(value.pos.x, value.pos2.x, value._max || false);
			}
		},

		doAnnotation: function(annotation) {
			var self = this;
			var shape = this.gcmsInstance.getGC().makeShape(annotation, {}, false);

			shape.setSelectable(true);

			Traversing.listenDataChange(annotation, function(value) {
				shape.draw();
				shape.redraw();
			}, self.module.getId());

			if(annotation._highlight) {
				API.listenHighlight(annotation._highlight, function(onOff) {
					if(onOff)
						shape.highlight();
					else
						shape.unHighlight();
				});
			}

			shape.draw();
			shape.redraw();
		}
	});

	return view;
});
