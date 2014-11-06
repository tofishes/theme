/* @tofishes */
// 1、自动载入和html同名的css和js
// 2、自动载入公共css
// 其他的js和css，tmpl等依赖通过require自行在js中管理
;function pageInfo() {
    var path = location.pathname
    ,   pageId
    ,   pageName

    ,   dotPos
    ,   lastSlashPos

    ,   defaultPage = 'index'; // 暂不处理多个/的情况

    if (path == '/') {
        pageName = pageId = defaultPage;
    } else {
        dotPos = path.indexOf('.') || path.length;
        lastSlashPos = path.lastIndexOf('/');

        pageName = path.substring(lastSlashPos + 1, dotPos); // +1， 不包含第一个 /
        pageId = path.substring(1, dotPos).replace(/\//g, '-'); // 从1开始，去掉第一个 /
    };

    return {
        'path': path,
        'pageId': pageId,
        'pageName': pageName
    };
};

// 核心配置及默认载入资源
;(function (window, undefined) {
    var pageInfo = window.pageInfo();

    requirejs.config({
        baseUrl: '/assets/js', // for requirejs
        paths: {
            'css_base': '../css',
            'jquery': 'lib/jquery-1.8.2.min'
        },
        map: {
          '*': {
            'css': 'css.min' //css载入插件的路径 or whatever the path to require-css is
          }
        },
        urlArgs: '0' // 控制缓存，考虑改成 'v=@KM_VERSION',然后grunt编译替换@KM_VERSION
    });
    // 载入pages目录下的同名js
    var defaultAssets = ['pages/' + pageInfo.pageName]

    require(['css!css_base/pages/' + pageInfo.pageName]);

    require(['jquery', 'app', 'km', 'util', 'sys', 'emoji', 'json!/pages.json',
            'json!/assets/data/emotions.json'
        ],function ($, app, km, util, sys, emoji, pages, emotions) {

        // 载入page同名资源
        require(defaultAssets);
        window.km = km;
        window.util = util;
        window.sys = sys;
        window.jEmoji = emoji;

        km.pages = pages;
        km.emotions = emotions;

        sys.loading();
        km.initActions.add(function () {
            sys.loaded();
        });
        km.init();
    });
})(this);
