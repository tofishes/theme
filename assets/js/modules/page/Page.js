define(function (require, exports, module) {
    var guid = require('util/guid')
    ,   storage = require('util/storage')

    ,   $ = require('jquery')
    ,   pageTmpl = require('text!modules/page/page.tmpl')

    ,   active = 'active'
    ,   tClass = 'page-title'
    ,   conClass = 'page-container'
    ,   pid_prefix = {
        'title': 'title-',
        'page': 'page-'
    }
    ,   initedMap = {}
    ,   refreshDataName = 'refresh'

    ,   templates = km.parseTemplates(pageTmpl);

    function Page() {
        this.$titleContainer = $('#pages-title-container');
        this.$pageContainer = $('#pages-con-container');

        this.offHook = '.page-off'; // 关闭的类
        this.onStatus = active; // 打开的状态
    };
    Page.prototype.config = function (options) {
        for (var name in options) {
            this[name] = options[name];
        };

        return this;
    };
    // page分两步：
    // 1、create()
    // 2、active()
    // @param ([Object])  pageItem = {
    //      title: title,
    //      id: id,
    //      name: name,
    //      active: true
    // }
    Page.prototype.create = function (pageItem) {
        pageItem.pid = pageItem.pid || pageItem.id || guid(); // page id
        pageItem.pid_prefix = pid_prefix;

        if (this.exsit(pageItem.pid)) return pageItem;

        var $title = $.tmpl(templates.title, pageItem)
        ,   $page = $.tmpl(templates.con, pageItem);

        this.$titleContainer.append($title);
        this.$pageContainer.append($page);

        this.store();

        return pageItem;
    };
    /**
     * 判断是否存在某个page
     * @param  {[String]} pid page-id
     * @return {[Boolean]}
     */
    Page.prototype.exsit = function (pid) {
        return getPageDoms(pid).title.length;
    };

    /**
    // @param ([Object])  pageItem = {
    //      title: title,
    //      id: id,
    //      name: name,
    //      active: true
    // }
     */
    Page.prototype.active = function (pageItem) {
        var pid = pageItem.pid;

        if (!pid || !pid.substring) return this;

        var doms = getPageDoms(pid)
        ,   $title = doms.title
        ,   $page = doms.page;

        $title.addClass(active).siblings().removeClass(active);
        $page.addClass(active).fadeIn().siblings().removeClass(active).hide();

        if (!initedMap[pid]) {
            initedMap[pid] = 1;

            // 载入页面主js，并执行init方法，传入页面标题和页面容器对象
            // 路径为 pages/name/name.js
            // 变量拼接的模块名不能使用 var item = require()载入，因此用异步方法载入
            requirejs(['pages/' + pageItem.name + '/' + pageItem.name], function (item) {
                item.init($page, $title);

                // 提供refresh功能，可以自定义一个refresh接口实现，否则就用init
                $page.data(refreshDataName, item.refresh || item.init);
            });
            // 载入同名css
            require(['css!css_base/pages/' + pageItem.name]);
        };

        return this;
    };
    /**
     * 刷新页面的方法
     * @return {[type]}     [description]
     */
    Page.prototype.refresh = function () {
        var pid = this.getActiveId()
        ,   doms = getPageDoms(pid)
        ,   $title = doms.title
        ,   $page = doms.page
        ,   refresh = $page.data(refreshDataName);

        refresh && refresh($page, $title)
    };

    Page.prototype.getActiveId = function () {
        var $active = this.$titleContainer.children('.' + active);

        return $active.length && $active.data('pid');
    };

    Page.prototype.isActive = function (pid) {
        return getPageDoms(pid).title.hasClass(this.onStatus);
    };
    Page.prototype.trash = function (pid, fn) {
        var doms = getPageDoms(pid)
        ,   $title = doms.title
        ,   $page = doms.page;

        // 激活上一个
        $title.prev().trigger('click');

        $title.remove();
        $page.remove();
        // 初始化为0
        initedMap[pid] = 0;

        this.store();

        fn && fn.call(this);
    };
    // 存储当前打开状态
    Page.prototype.store = function () {
        var status = [];
        this.$titleContainer.children().each(function () {
            status.push($(this).tmplItem().data);
        });
        storage('page-status', status);
    };
    // 恢复上次打开状态
    Page.prototype.restore = function () {
        var status = storage('page-status') || []
        ,   l = status.length
        ,   i = 0;

        if (!l) return;

        for (; i < l; i++) {
            this.create(status[i]);
        }
    };

    // 一些帮助方法
    /**
     * 获取page相关dom元素
     * @param  {[type]} pid 页面id
     * @return {[type]}
     */
    function getPageDoms(pid) {
        return {
            'title': $('#' + pid_prefix.title + pid),
            'page': $('#' + pid_prefix.page + pid)
        }
    }

    return Page;
});