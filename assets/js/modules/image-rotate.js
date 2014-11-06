// @tofishes
// 微博列表的附图旋转,放大缩小功能
// 相关文件：image-rotate.js, image-rotate.css
// 迁移步骤：
// plugins.js内，FeedPicCtrl和imgCtrlObj、imgZooming相关删除，本代码移动此处
// feed-list.less 中feed-img样式修订
// 相关模板在weibo-detail.tmpl： attachment-thumb-tmpl（新增）  & attachment-show-tmpl(原thumb-zoom-tmpl)
// global-module.html中移除 picture-box-forward-tmpl & picture-box-tmpl
// 模板中原先的附图代码（搜feed-img）直接替换为 {{html km.attachmentShow($data, "define")}} //define = [main | quote]
// 已知有用到的文件：feed-list.tmpl, weibo-detail.tmpl, inbox-list.tmpl, publish.html
;
(function(window, $, undefined) {
    var FALSE = false,
    NULL = null,
    toInt = parseInt,
    km = window.km || {};

    var templates = {
        'attachmentShow': $('#attachment-show-tmpl').template(),
        'attachmentThumb': $('#attachment-thumb-tmpl').template(),
        'imageBox': $('#image-box-tmpl').template()
    }
    ,   canvas_enabled = !!document.createElement('canvas').getContext;;

    // data 数据
    // define = [main | quote] 插入的位置，是主体还是引用(引用代表转发微博中的原创体)
    km.attachmentShow = function (data, define) {
        var items, rt = data.rt, meta = rt ? rt : data;
        // 是转发微博时候，主体无附图
        if (define === 'main' && rt) return '';

        if (meta.pic_urls && meta.pic_urls.length) items = meta.pic_urls;
        else if (meta.tp) items = [{
            'op': meta.op,
            'mp': meta.mp,
            'tp': meta.tp
        }];

        return items ? $.tmpl(templates.attachmentThumb, {'items': items})[0].outerHTML
                     : ''; 
    };

    // 图片控制组件
    var imgCtrler = function() {
        this.cid = 'imageCtrler';
        this.canvas = NULL;
        this.maxWidth = 440;
        this.width = 0;
        this.height = 0;
        this.curAngle = 0;
    };

    imgCtrler.prototype = {
        // 初始化，支持canvas的创建canvas，IE使用矩阵滤镜
        init: function(data) {
            var _el = data.el;

            this.width = _el.offsetWidth;
            this.height = _el.offsetHeight;

            // 原先的判断是 先判断是否是ie，然后用canvas，现在改为直接判断canvas，然后默认使用ie css滤镜
            // 理论上不是合理的判断，不过，至少比原来的好，支持IE10 
            if (canvas_enabled) {
                this.canvas = $('<canvas>').attr({
                    'height': this.height,
                    'width': this.width
                }).addClass('narrow-move').insertBefore(_el)[0];
                
                $(_el).hide();
                var ctx = this.canvas.getContext('2d');
                //ctx.drawImage(_el,0,0);
            } else {
                var _matrix = 'DXImageTransform.Microsoft.Matrix';
                _el.style.filter = 'progid:DXImageTransform.Microsoft.Matrix()';
                _el.filters.item(_matrix).SizingMethod = "auto expand";
                $(_el).addClass('narrow-move');
                _matrix = NULL;
            }

            this.element = _el;
        },
        //旋转图片
        //旋转方式，'left'或者'right'
        rotate: function(dir) {
            if (!this.element) {
                return;
            }

            //相对原始图片的旋转角度
            var _angle, drawW, drawH, h = this.width, w = this.height;
            if (dir === 'right') {
                _angle = this.curAngle + 90;
                this.curAngle = _angle >= 360 ? 0: _angle;
            } else if (dir === 'left') {
                _angle = this.curAngle - 90;
                this.curAngle = _angle < 0 ? 360 + _angle: _angle;
            } else {
                w = this.width;
                h = this.height;
            }
            _angle = NULL;

            //调整图片旋转后的大小
            this.width = w;
            this.height = h;

            if (w > this.maxWidth) {
                h = toInt(this.maxWidth * h / w);
                w = this.maxWidth;
            }
            if (this.canvas) {
                var ctx = this.canvas.getContext('2d'),
                el = this.element,
                cpx = 0,
                cpy = 0;
                //设置画布大小，重置了内容
                $(this.canvas).attr({
                    'width': w,
                    'height': h
                });
                ctx.clearRect(0, 0, w, h);
                switch (this.curAngle) {
                case 0:
                    cpx = 0;
                    cpy = 0;
                    drawW = w;
                    drawH = h;
                    break;
                case 90:
                    cpx = w;
                    cpy = 0;
                    drawW = h;
                    drawH = w;
                    break;
                case 180:
                    cpx = w;
                    cpy = h;
                    drawW = w;
                    drawH = h;
                    break;
                case 270:
                    cpx = 0;
                    cpy = h;
                    drawW = h;
                    drawH = w;
                    break;
                }
                ctx.save();
                ctx.translate(cpx, cpy);
                ctx.rotate(this.curAngle * Math.PI / 180);
                ctx.drawImage(el, 0, 0, drawW, drawH);
                ctx.restore();
            } else {
                var _rad = this.curAngle * Math.PI / 180,
                _cos = Math.cos(_rad),
                _sin = Math.sin(_rad),
                _el = this.element,
                _matrix = 'DXImageTransform.Microsoft.Matrix';

                _el.filters.item(_matrix).M11 = _cos;
                _el.filters.item(_matrix).M12 = - _sin;
                _el.filters.item(_matrix).M21 = _sin;
                _el.filters.item(_matrix).M22 = _cos;

                // this.width = _el.offsetWidth;
                // this.height = _el.offsetHeight;
                switch (this.curAngle) {
                case 0:
                case 180:
                    drawW = w;
                    drawH = h;
                    break;
                case 90:
                case 270:
                    drawW = h;
                    drawH = w;
                    break;
                }
                _el.width = drawW;
                _el.height = drawH;
                //修正IE8下图片占位的问题
                //18是操作菜单的高度
                var _parent = _el.parentNode;
                _parent.style.height = h;
                _parent.style.display = "block";
            }
        }
    };

    // TODO @tofishes js引用顺序导致这里的imgRotate已经被jqext.js里面的定义给覆盖了。。。囧
    $.fn.imgRotate = function(dir) {
        this.each(function() {
            if (this.tagName !== 'IMG') {
                return FALSE;
            }
            var img = $(this).data('img');
            if (!img) {
                img = new imgCtrler();
                img.init({
                    el: this
                });

                $(this).data('img', img);
            }
            // @tofishes parent()改为.closest('div')，parent取值错误 2013.11.6
            img.maxWidth = $(this).closest('div').width();
            img.rotate(dir);
        });
        return this;
    };
    // @tofishes 处理图片缩放和旋转
    // $thumb 被单击的那个图片元素
    // $thumbWrap $thumb的祖级最近的.feed-img元素
    // $zoomWrap 用来显示原图的元素区域
    function multiHandler($thumb, $thumbWrap, $zoomWrap) {
        $thumb.addClass('active'); // 用于被克隆后也带上这个class用于高亮
        var $items = $thumbWrap.children().clone(),
            $slider = $zoomWrap.find('.thumb-slider-wrap ul');

        $thumb.removeClass('active'); // 已被克隆了class，这里再清除掉
        $items.children().removeClass('thumb-zoom zoom-move');
        $slider.html($items);
    }

    function slider($ul, index) {
        var $li = $ul.children(),
            width = $li.outerWidth(true),
            size = $li.length,
            maxWidth = width * size;
        var visibleCount = 7, half = 3, // 可视图片数 和 居中图片的前面可见图片数
            visibleWidth = width * visibleCount;

        $ul.width(maxWidth);

        // 如果ul宽度还没有显示宽度大，那就没必要移动了
        if (maxWidth < visibleWidth) return;

        var offset = (index - half) * width; // 使active图片居中时候的ul的left偏移量
        offset = Math.max(0, offset); // left偏移量不能是正数
        offset = Math.min(maxWidth - visibleWidth, offset); // left偏移量最小

        $ul.animate({
            'left': 0 - offset // 上面是绝对值，这里得用负数
        }, 300);
    }

    $(document).on('click.img-zoom', 'img.thumb-zoom', function(e) {
        var $thumb = $(this), $thumbWrap = $thumb.closest('.feed-img');

        if ($thumbWrap.isLocked()) {
            return;
        };

        var loadingClass = 'zoom-loading', isMulti = $thumbWrap.hasClass('multi-attachment');
        var $wrapper = $thumbWrap.closest('.preview-img');

        $thumbWrap.lock();

        var $zoomWrap = $thumbWrap.siblings('.zoom-wrap');
        if (! $zoomWrap.length) {
            $zoomWrap = $('<div class="zoom-wrap show-img"/>').hide();
            $thumbWrap.before($zoomWrap);
        }
      
        $thumb.addClass(loadingClass).after('<div class="loading-img" />');

        var data_images = $thumb.data('images'), zoom_img = data_images.zoom_img;

        var image = new Image();
        image.onload = function() {
            $thumb.removeClass(loadingClass).siblings('.loading-img').remove();
            $thumbWrap.unLock().hide();

            data_images.isMulti = isMulti;
            data_images.index = $thumb.data('index');
            data_images.count = $wrapper.data('count');

            $zoomWrap.html($.tmpl(templates.attachmentShow, data_images)).show();

            if (isMulti) multiHandler($thumb, $thumbWrap, $zoomWrap);
            slider($zoomWrap.find('.thumb-slider-wrap ul'), data_images.index);
        };
        image.src = zoom_img;

        // 记录打开前位置 侧面板内是 window.MultiPanel.$scrollHook
        // 否则是window
        var scrollElement = window.MultiPanel && $wrapper.closest(MultiPanel.$scrollHook).length ? MultiPanel.$scrollHook : $(window);
        $wrapper.data('go-origin-scroll', {'scrollElement': scrollElement, 'top': scrollElement.scrollTop()});

    }).on('click.img-zoom', '.image-box a', function(e) {
        var $this = $(this), action = $this.data('action');
        var $imageBox = $this.closest('.image-box'),
            $zoomWrap = $imageBox.closest('.zoom-wrap'),
            $wrapper = $zoomWrap.closest('.preview-img');

        var actions = {
            'piup': function() {
                var $thumbWrap = $zoomWrap.siblings('.feed-img');
                $zoomWrap.hide();
                $thumbWrap.show();
                // 返回到原位置, 隐藏元素取不到offset
                var originScroll = $wrapper.data('go-origin-scroll');
                if ($(window).scrollTop() > $wrapper.offset().top && originScroll) {
                    originScroll.scrollElement.scrollTop(originScroll.top);
                };
            },
            'left': function() {
                $imageBox.find('img').imgRotate('left');
            },
            'right': function() {
                $imageBox.find('img').imgRotate('right');
            }
        };

        actions[action] && actions[action]();
    }).on('click', '.thumb-slider-wrap img', function () {
        var $this = $(this), $sliderWrap, $imageBox, data, $loading, $wrapper;
        if ($this.hasClass('active')) return;

        $sliderWrap = $this.closest('.thumb-slider-wrap');
        $sliderWrap.find('.active').removeClass('active');
        $this.addClass('active');

        $imageBox = $sliderWrap.siblings('.image-box');
        data = $this.data('images');

        $loading = $imageBox.find('.loading-img').show();

        $wrapper = $imageBox.closest('.preview-img');

        var timestamp = + new Date();
        $wrapper.data('timestamp', timestamp);
        var image = new Image();
        image.onload = function () {
            // 因网络载入问题，处理过期动作
            if (timestamp != $wrapper.data('timestamp')) return;

            // 索引和总数的数据
            data.index = $this.data('index');
            data.count = $wrapper.data('count');

            slider($sliderWrap.find('ul'), data.index);

            $imageBox.html($.tmpl(templates.imageBox, data));   
            $loading.hide();

            var originScroll = $wrapper.data('go-origin-scroll');
            if ($(window).scrollTop() > $wrapper.offset().top && originScroll) {
                originScroll.scrollElement.scrollTop(originScroll.top);
            };
        };
        image.src = data.zoom_img;
    }).on('click', '.pic-nav', function () {
        var $this = $(this), index = $this.data('index'),
            $imageBox = $this.closest('.image-box'),
            $thumbWrap = $imageBox.siblings('.thumb-slider-wrap');

        $thumbWrap.find('li img').eq(index).trigger('click');
    }).on('click', '.slider-dir', function () {
        var $this = $(this);

        if ($this.hasClass('disabled')) return;

        var $other = $this.siblings('.slider-dir'),
            isPrev = $this.hasClass('slider-prev');

        var $ul = $this.parent().find('ul'), $li = $ul.children(),
            size = $li.length, index = isPrev ? 0 : size;

        slider($ul, index);
        $this.addClass('disabled');
        $other.removeClass('disabled');
    });
})(window, jQuery);