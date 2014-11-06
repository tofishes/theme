/**
 * @author tofishes
 * 主页模块的入口文件， 完成主页的内容展示和交互
 */
define(function (require, exports) {
    var $ = jQuery
    ,   km = window.km
    ,   page = km.page

    ,   homeTmpl = require('text!pages/home/home.tmpl')

    ,   templates = km.parseTemplates(homeTmpl);

    // $page是主要页面容器， $title可选，一般不会涉及标题操作
    function init($page, $title) {
        var $features = $.tmpl(templates.home)
        ,   $list = $.tmpl(templates.featureItem, km.pages);

        $features.prepend($list);

        $page.html($features);

        $page.off('click').on('click', 'li.feature-item', function () {
            var $this = $(this)
            ,   pageItem = $this.tmplItem().data;

            if (!pageItem.pid || !page.exsit(pageItem.pid)) {
                pageItem = page.create(pageItem);
            }

            page.active(pageItem);

        }).on('click', '.page-title .trash', function () {
            var pid = $(this).closest('li').data('pid');

            page.trash(pid);
        }).on('click', '.feature-item-remove', function () {
            var $item = $(this).closest('li')
            ,   pid = $item.data('pid');

            $item.remove();
            return false;
        }).on('click', '.feature-plus', function () {
            require(['modules/step/stepDo'], function () {
                $page.stepDo(function ($step) {
                    $step.css({
                        'height': 300,
                        'background': '#fff'
                    }).html('3秒后进行下一步');

                    var step = this;
                    setTimeout(function () {
                        step.nextStep();
                    }, 3000);
                }).next(function ($step) {
                    $step.css({
                        'height': 300,
                        'background': 'green'
                    }).html('3秒后进行下一步');

                    var step = this;
                    setTimeout(function () {
                        step.nextStep();
                    }, 3000);
                }).done(function ($step) {
                    $step.css({
                        'height': 300,
                        'background': 'red'
                    }).html('最后一步， 5秒后销毁');

                    var step = this;
                    setTimeout(function () {
                        // step.destroy();
                    }, 5000);

                });
            });
        });
    }

    function refresh($page, $title) {
        $page.append(new Date() + '<p>你在刷新首页...</p>');
    }

    exports.init = init;
    exports.refresh = refresh;
});