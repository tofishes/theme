/**
 * km app, 全局主要对象，管理和挂载各类全局数据等
 * @param  {[type]} require [description]
 * @param  {[type]} exports [description]
 * @param  {[type]} module  [description]
 * @return {[type]}         [description]
 */
define(function (require, exports, module) {
    /* @tofishes _app 基础资源载入 _app系统公共js，建议都先于页面js之前引入*/
    var app = require('app')
    ,   $ = require('jquery')
    ,   sys = require('sys');

    window._app = window._app || new app();

    var $doms = _app.$doms
    ,   templates = _app.templates
    ,   ACTIVE = 'active';

    // 配置_app属性
    _app.config({
        'api_pre': '/p/', // 接口地址前缀
        'accountChange': $.Callbacks(),

        '$win': $(window),
        '$dom': $(document),

        'chineseNumber': ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'],

        'ACTIVECLASS': ACTIVE
    });


    module.exports = _app;
    return _app;
});