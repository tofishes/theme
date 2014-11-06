/**
 * @author tofishes
 * 统计模块的入口文件
 */
define(function (require, exports) {
    var $ = jQuery
    ,   km = window.km
    ,   page = km.page

    ,   analysisTmpl = require('text!pages/analysis/analysis.tmpl')

    ,   templates = km.parseTemplates(analysisTmpl);

    // $page是主要页面容器， $title可选，一般不会涉及标题操作
    function init($page, $title) {
        $page.html($.tmpl(templates.chart));
    }

    exports.init = init;
});