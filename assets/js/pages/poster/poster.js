/**
 * @author tofishes
 * 统计模块的入口文件
 */
define(function (require, exports) {
    var $ = jQuery
    ,   km = window.km
    ,   page = km.page

    ,   postTmpl = require('text!pages/poster/poster.tmpl')

    ,   templates = km.parseTemplates(postTmpl);

    // $page是主要页面容器， $title可选，一般不会涉及标题操作
    function init($page, $title) {
        $page.html($.tmpl(templates.input));
    }

    exports.init = init;
});