/*!
 * SemanticWP Modal
 * @version 1.0.4
 * @author Sergey Predvoditelev
 */
(function($) {


	var default_options = {

		type: 'html', // ajax или html
		content: '',
		url: '',
		ajax: {},
		ajax_request: null,

		closeOnEsc: true,
		closeOnOverlayClick: true,

		clone: false,

		overlay: {
			block: undefined,
			tpl: '<div class="swpmodal-overlay"></div>',
			css: {
				backgroundColor: '#000',
				opacity: .6
			}
		},

		container: {
			block: undefined,
			tpl: '<div class="swpmodal-container"><table class="swpmodal-container_i"><tr><td class="swpmodal-container_i2"></td></tr></table></div>'
		},

		wrap: undefined,
		body: undefined,

		errors: {
			tpl: '<div class="swpmodal-error swpmodal-close"></div>',
			autoclose_delay: 2000,
			ajax_unsuccessful_load: 'Error'
		},

		openEffect: {
			type: 'fade',
			speed: 400
		},
		closeEffect: {
			type: 'fade',
			speed: 400
		},

		beforeOpen: $.noop,
		afterOpen: $.noop,
		beforeClose: $.noop,
		afterClose: $.noop,
		afterLoading: $.noop,
		afterLoadingOnShow: $.noop,
		errorLoading: $.noop

	};


	var modalID = 0;
	var modals = $([]);


	var utils = {


		// Определяет произошло ли событие e вне блока block
		isEventOut: function(blocks, e) {
			var r = true;
			$(blocks).each(function() {
				if ($(e.target).get(0) == $(this).get(0)) r = false;
				if ($(e.target).closest('HTML', $(this).get(0)).length == 0) r = false;
			});
			return r;
		}


	};


	var modal = {


		// Возвращает элемент, которым был вызван плагин
		getParentEl: function(el) {
			var r = $(el);
			if (r.data('swpmodal')) return r;
			r = $(el).closest('.swpmodal-container').data('swpmodalParentEl');
			if (r) return r;
			return false;
		},


		// Переход
		transition: function(el, action, options, callback) {
			callback = callback == undefined ? $.noop : callback;
			switch (options.type) {
				case 'fade':
					action == 'show' ? el.fadeIn(options.speed, callback) : el.fadeOut(options.speed, callback);
					break;
				case 'none':
					action == 'show' ? el.show() : el.hide();
					callback();
					break;
			}
		},


		// Задать отступ для Wrap
		set_wrap_margin_right: function(D, offset) {
			D.wrap.css('marginRight', offset + 'px');
			$(document).trigger('swpmodalSetWrapMarginRight', offset);
		},


		// Инициализация элемента
		init_el: function($this, options) {
			var D = $this.data('swpmodal');
			if (D) return;

			D = options;
			modalID++;
			D.modalID = modalID;

			// Overlay
			D.overlay.block = $(D.overlay.tpl);
			D.overlay.block.css(D.overlay.css);

			// Container
			D.container.block = $(D.container.tpl);

			// BODY
			D.body = $('.swpmodal-container_i2', D.container.block);
			if (options.clone) {
				D.body.html($this.clone(true));
			} else {
				$this.before('<div id="swpmodalReserve' + D.modalID + '" style="display: none" />');
				D.body.html($this);
			}

			// Закрытие при клике на элемент с соответствующим классом
			D.body.on('click', '.swpmodal-close', function() {
				$this.swpmodal('close');
				return false;
			});

			// Закрытие при клике на overlay
			if (D.closeOnOverlayClick)
				D.overlay.block.add(D.container.block).click(function(e) {
					if (utils.isEventOut($('>*', D.body), e))
						$this.swpmodal('close');
				});

			// Запомним настройки
			D.container.block.data('swpmodalParentEl', $this);
			$this.data('swpmodal', D);
			modals = $.merge(modals, $this);

			// Показать
			$.proxy(actions.show, $this)();
			if (D.type == 'html') return $this;

			// Ajax-загрузка
			if (D.ajax.beforeSend != undefined) {
				var fn_beforeSend = D.ajax.beforeSend;
				delete D.ajax.beforeSend;
			}
			if (D.ajax.success != undefined) {
				var fn_success = D.ajax.success;
				delete D.ajax.success;
			}
			if (D.ajax.error != undefined) {
				var fn_error = D.ajax.error;
				delete D.ajax.error;
			}
			var o = $.extend(true, {
				url: D.url,
				beforeSend: function() {
					D.body.html('<div class="swpmodal-loading" />');
					if (fn_beforeSend !== undefined)
						fn_beforeSend(D, $this);
				},
				success: function(response) {

					// Событие после загрузки до показа содержимого
					$this.trigger('afterLoading');
					response = D.afterLoading(D, $this, response) || response;

					if (fn_success == undefined) {
						D.body.html(response);
					} else {
						fn_success(D, $this, response);
					}

					// Событие после загрузки после отображения содержимого
					$this.trigger('afterLoadingOnShow');
					D.afterLoadingOnShow(D, $this, response);

				},
				error: function() {

					// Событие при ошибке загрузки
					$this.trigger('errorLoading');
					D.errorLoading(D, $this);

					if (fn_error == undefined) {
						D.body.html(D.errors.tpl);
						$('.swpmodal-error', D.body).html(D.errors.ajax_unsuccessful_load);
						$('.swpmodal-close', D.body).click(function() {
							$this.swpmodal('close');
							return false;
						});
						if (D.errors.autoclose_delay)
							setTimeout(function() {
								$this.swpmodal('close');
							}, D.errors.autoclose_delay);
					} else {
						fn_error(D, $this);
					}
				}
			}, D.ajax);
			D.ajax_request = $.ajax(o);

			// Запомнить настройки
			$this.data('swpmodal', D);

		},


		// Инициализация
		init: function(options) {
			options = $.extend(true, {}, default_options, options);
			if ($.isFunction(this)) {
				if (options == undefined) {
					$.error('jquery.swpmodal: Uncorrect parameters');
					return;
				}
				if (options.type == '') {
					$.error('jquery.swpmodal: Don\'t set parameter "type"');
					return;
				}
				switch (options.type) {
					case 'html':
						if (options.content == '') {
							$.error('jquery.swpmodal: Don\'t set parameter "content"');
							return
						}
						var c = options.content;
						options.content = '';

						return modal.init_el($(c), options);
						break;
					case 'ajax':
						if (options.url == '') {
							$.error('jquery.swpmodal: Don\'t set parameter "url"');
							return;
						}
						return modal.init_el($('<div />'), options);
						break;
				}
			} else {
				return this.each(function() {
					modal.init_el($(this), $.extend(true, {}, options));
				});
			}
		}


	};


	var actions = {


		// Показать
		show: function() {
			var $this = modal.getParentEl(this);
			if ($this === false) {
				$.error('jquery.swpmodal: Uncorrect call');
				return;
			}
			var D = $this.data('swpmodal');

			// Добавить overlay и container
			D.overlay.block.hide();
			D.container.block.hide();
			$('BODY').append(D.overlay.block);
			$('BODY').append(D.container.block);
			D.container.block.css('zIndex', D.overlay.block.css('zIndex'));

			// Событие
			D.beforeOpen(D, $this);
			$this.trigger('beforeOpen');

			// Wrap
			if (D.wrap.css('overflow-y') != 'hidden') {
				D.wrap.data('swpmodalOverflow', D.wrap.css('overflow-y'));
				var w1 = D.wrap.outerWidth(true);
				D.wrap.css('overflow-y', 'hidden');
				var w2 = D.wrap.outerWidth(true);
				if (w2 != w1)
					modal.set_wrap_margin_right(D, w2 - w1);
			}

			// Скрыть предыдущие оверлеи
			modals.not($this).each(function() {
				var d = $(this).data('swpmodal');
				d.overlay.block.hide();
			});

			// Показать
			modal.transition(D.overlay.block, 'show', modals.length > 1 ? {type: 'none'} : D.openEffect);
			modal.transition(D.container.block, 'show', modals.length > 1 ? {type: 'none'} : D.openEffect, function() {
				D.afterOpen(D, $this);
				$this.trigger('afterOpen');
			});

			return $this;
		},


		// Закрыть
		close: function() {
			if ($.isFunction(this)) {
				modals.each(function() {
					$(this).swpmodal('close');
				});
			} else {
				return this.each(function() {
					var $this = modal.getParentEl(this);
					if ($this === false) {
						$.error('jquery.swpmodal: Uncorrect call');
						return;
					}
					var D = $this.data('swpmodal');

					// Событие перед закрытием
					if (D.beforeClose(D, $this) === false) return;
					$this.trigger('beforeClose');

					// Показать предыдущие оверлеи
					modals.not($this).last().each(function() {
						var d = $(this).data('swpmodal');
						d.overlay.block.show();
					});

					modal.transition(D.overlay.block, 'hide', modals.length > 1 ? {type: 'none'} : D.closeEffect);
					modal.transition(D.container.block, 'hide', modals.length > 1 ? {type: 'none'} : D.closeEffect, function() {

						// Событие после закрытия
						D.afterClose(D, $this);
						$this.trigger('afterClose');

						// Если не клонировали - вернём на место
						if (!D.clone)
							$('#swpmodalReserve' + D.modalID).replaceWith(D.body.find('>*'));

						D.overlay.block.remove();
						D.container.block.remove();
						$this.data('swpmodal', null);
						if (!$('.swpmodal-container').length) {
							if (D.wrap.data('swpmodalOverflow'))
								D.wrap.css('overflow-y', D.wrap.data('swpmodalOverflow'));
							modal.set_wrap_margin_right(D, 0);
						}

					});

					if (D.type == 'ajax')
						D.ajax_request.abort();

					modals = modals.not($this);
				});
			}
		},


		// Установить опции по-умолчанию
		setDefault: function(options) {
			$.extend(true, default_options, options);
		}


	};


	$(function() {
		default_options.wrap = $((document.all && !document.querySelector) ? 'html' : 'body');
	});


	// Закрытие при нажатии Escape
	$(document).bind('keyup.swpmodal', function(e) {
		var m = modals.last();
		if (!m.length) return;
		var D = m.data('swpmodal');
		if (D.closeOnEsc && (e.keyCode === 27))
			m.swpmodal('close');
	});


	$.swpmodal = $.fn.swpmodal = function(method) {

		if (actions[method]) {
			return actions[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return modal.init.apply(this, arguments);
		} else {
			$.error('jquery.swpmodal: Method ' + method + ' does not exist');
		}

	};


})(jQuery);