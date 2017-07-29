(function($) {

    var default_options = {

        type: 'html', // ajax или html
        content: '',
        url: '',
        ajax: {},
        ajaxRequest: null,

        closeOnEsc: true,
        closeOnOverlayClick: true,

        clone: false,

        overlay: {
            block: undefined,
            tpl: '<div class="modal2-overlay"></div>',
            css: {
                backgroundColor: '#000',
                opacity: .6,
            },
        },

        container: {
            block: undefined,
            tpl: '<div class="modal2-container"><div class="modal2-container_i"><div class="modal2-container_i2"></div></div></div>',
        },

        preloader: {
            verticalAlign: undefined,
            tpl: '<div class="modal2-preloader" />',
        },

        wrap: undefined,
        body: undefined,

        errors: {
            tpl: '<div class="modal2-error modal2-close"></div>',
            autocloseDelay: 2000,
            ajaxUnsuccessfulLoad: 'Error',
        },

        openEffect: {
            type: 'fade',
            speed: 400,
        },
        closeEffect: {
            type: 'fade',
            speed: 400,
        },

        width: 'auto',
        verticalAlign: 'middle',

        beforeOpen: $.noop,
        afterOpen: $.noop,
        beforeClose: $.noop,
        afterClose: $.noop,
        afterLoading: $.noop,
        afterLoadingOnShow: $.noop,
        errorLoading: $.noop,

    };

    var modalID = 0;
    var modals = $([]);

    var utils = {

        // Определяет произошло ли событие e вне блока block
        isEventOut: function(blocks, e) {
            var r = true;
            $(blocks).each(function() {
                if ($(e.target).get(0) == $(this).get(0)) {
                    r = false;
                }
                if ($(e.target).closest('HTML', $(this).get(0)).length ==
                    0) {
                    r = false;
                }
            });
            return r;
        },

    };

    var modal = {

        // Возвращает элемент, которым был вызван плагин
        getParentEl: function(el) {
            var r = $(el);
            if (r.data('modal2')) {
                return r;
            }
            r = $(el).closest('.modal2-container').data('modal2ParentEl');
            if (r) {
                return r;
            }
            return false;
        },

        // Переход
        transition: function(el, action, options, callback) {
            callback = callback == undefined ? $.noop : callback;
            switch (options.type) {
                case 'fade':
                    action == 'show'
                        ? el.fadeIn(options.speed, callback)
                        : el.fadeOut(
                        options.speed, callback);
                    break;
                case 'none':
                    action == 'show' ? el.show() : el.hide();
                    callback();
                    break;
            }
        },

        // Задать отступ для Wrap
        setWrapMarginRight: function(D, offset) {
            D.wrap.css('marginRight', offset + 'px');
            $(document).trigger('modal2_setWrapMarginRight', offset);
        },

        // Инициализация элемента
        initEl: function($this, options) {
            var D = $this.data('modal2');
            if (D) {
                return;
            }

            D = options;
            modalID++;
            D.modalID = modalID;

            // Overlay
            D.overlay.block = $(D.overlay.tpl);
            D.overlay.block.css(D.overlay.css);

            // Container
            D.container.block = $(D.container.tpl);

            // BODY
            D.body = $('.modal2-container_i2', D.container.block);
            if (options.clone) {
                D.body.html($this.clone(true));
            } else {
                $this.before('<div id="modal2Reserve' + D.modalID +
                    '" style="display: none" />');
                D.body.html($this);
            }

            // Закрытие при клике на элемент с соответствующим классом
            D.body.on('click', '.modal2-close', function() {
                $this.modal2('close');
                return false;
            });

            // Закрытие при клике на overlay
            if (D.closeOnOverlayClick) {
                D.overlay.block.add(D.container.block).click(function(e) {
                    if (utils.isEventOut($('>*', D.body), e)) {
                        $this.modal2('close');
                    }
                });
            }

            // Запомним настройки
            D.container.block.data('modal2ParentEl', $this);
            $this.data('modal2', D);
            modals = $.merge(modals, $this);

            // Показать
            $.proxy(actions.show, $this)();
            if (D.type == 'html') {
                return $this;
            }

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
                    D.body.html(D.preloader.tpl).
                        css('verticalAlign',
                            D.preloader.verticalAlign === undefined
                                ? D.verticalAlign
                                : D.preloader.verticalAlign);
                    if (fn_beforeSend !== undefined) {
                        fn_beforeSend(D, $this);
                    }
                },
                success: function(response) {

                    // Событие после загрузки до показа содержимого
                    $this.trigger('afterLoading');
                    response = D.afterLoading(D, $this, response) || response;

                    D.body.css('verticalAlign', D.verticalAlign);

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
                        $('.modal2-error', D.body).
                            html(D.errors.ajaxUnsuccessfulLoad);
                        $('.modal2-close', D.body).click(function() {
                            $this.modal2('close');
                            return false;
                        });
                        if (D.errors.autocloseDelay) {
                            setTimeout(function() {
                                $this.modal2('close');
                            }, D.errors.autocloseDelay);
                        }
                    } else {
                        fn_error(D, $this);
                    }
                },
            }, D.ajax);
            D.ajaxRequest = $.ajax(o);

            // Запомнить настройки
            $this.data('modal2', D);

        },

        // Инициализация
        init: function(options) {
            options = $.extend(true, {}, default_options, options);
            if ($.isFunction(this)) {
                if (options == undefined) {
                    $.error('Modal2: Uncorrect parameters');
                    return;
                }
                if (options.type == '') {
                    $.error('Modal2: Don\'t set parameter "type"');
                    return;
                }
                switch (options.type) {
                    case 'html':
                        if (options.content == '') {
                            $.error('Modal2: Don\'t set parameter "content"');
                            return;
                        }
                        var c = options.content;
                        options.content = '';

                        return modal.initEl($(c), options);
                        break;
                    case 'ajax':
                        if (options.url == '') {
                            $.error('Modal2: Don\'t set parameter "url"');
                            return;
                        }
                        return modal.initEl($('<div />'), options);
                        break;
                }
            } else {
                return this.each(function() {
                    modal.initEl($(this), $.extend(true, {}, options));
                });
            }
        },

    };

    var actions = {

        // Показать
        show: function() {
            var $this = modal.getParentEl(this);
            if ($this === false) {
                $.error('Modal2: Uncorrect call');
                return;
            }
            var D = $this.data('modal2');

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
                D.wrap.data('modal2Overflow', D.wrap.css('overflow-y'));
                var w1 = D.wrap.outerWidth(true);
                D.wrap.css('overflow-y', 'hidden');
                var w2 = D.wrap.outerWidth(true);
                if (w2 != w1) {
                    modal.setWrapMarginRight(D, w2 - w1);
                }
            }

            // Скрыть предыдущие оверлеи
            modals.not($this).each(function() {
                var d = $(this).data('modal2');
                d.overlay.block.hide();
            });

            // Показать
            D.body.css('verticalAlign', D.verticalAlign);
            D.body.parent().css('width', D.width);
            modal.transition(D.overlay.block, 'show',
                modals.length > 1 ? {type: 'none'} : D.openEffect);
            modal.transition(D.container.block, 'show',
                modals.length > 1 ? {type: 'none'} : D.openEffect, function() {
                    D.afterOpen(D, $this);
                    $this.trigger('afterOpen');
                });

            return $this;
        },

        // Закрыть
        close: function() {
            if ($.isFunction(this)) {
                modals.each(function() {
                    $(this).modal2('close');
                });
            } else {
                return this.each(function() {
                    var $this = modal.getParentEl(this);
                    if ($this === false) {
                        $.error('Modal2: Uncorrect call');
                        return;
                    }
                    var D = $this.data('modal2');

                    // Событие перед закрытием
                    if (D.beforeClose(D, $this) === false) {
                        return;
                    }
                    $this.trigger('beforeClose');

                    // Показать предыдущие оверлеи
                    modals.not($this).last().each(function() {
                        var d = $(this).data('modal2');
                        d.overlay.block.show();
                    });

                    modal.transition(D.overlay.block, 'hide',
                        modals.length > 1 ? {type: 'none'} : D.closeEffect);
                    modal.transition(D.container.block, 'hide',
                        modals.length > 1 ? {type: 'none'} : D.closeEffect,
                        function() {

                            // Событие после закрытия
                            D.afterClose(D, $this);
                            $this.trigger('afterClose');

                            // Если не клонировали - вернём на место
                            if (!D.clone) {
                                $('#modal2Reserve' + D.modalID).
                                    replaceWith(D.body.find('>*'));
                            }

                            D.overlay.block.remove();
                            D.container.block.remove();
                            $this.data('modal2', null);
                            if (!$('.modal2-container').length) {
                                if (D.wrap.data('modal2Overflow')) {
                                    D.wrap.css('overflow-y',
                                        D.wrap.data('modal2Overflow'));
                                }
                                modal.setWrapMarginRight(D, 0);
                            }

                        });

                    if (D.type == 'ajax') {
                        D.ajaxRequest.abort();
                    }

                    modals = modals.not($this);
                });
            }
        },

        // Возвращает данные об активном окне
        getActive: function() {
            var b = $('.modal2-container').last();
            if (b.length) {
                return b.data('modal2ParentEl').data('modal2');
            }
            return false;
        },

        // Установить опции по-умолчанию
        setDefault: function(options) {
            $.extend(true, default_options, options);
        },

    };

    $(function() {
        default_options.wrap = $(
            (document.all && !document.querySelector) ? 'html' : 'body');
    });

    // Закрытие при нажатии Escape
    $(document).bind('keyup.modal2', function(e) {
        var m = modals.last();
        if (!m.length) {
            return;
        }
        var D = m.data('modal2');
        if (D.closeOnEsc && (e.keyCode === 27)) {
            m.modal2('close');
        }
    });

    $.modal2 = $.fn.modal2 = function(method) {

        if (actions[method]) {
            return actions[method].apply(this,
                Array.prototype.slice.call(arguments, 1));
        } else {
            if (typeof method === 'object' || !method) {
                return modal.init.apply(this, arguments);
            } else {
                $.error('Modal2: Method ' + method + ' does not exist');
            }
        }

    };

})(jQuery);