// @tofishes 评论搜索功能
!function(window, km){
	var $doms = km.$doms
	,	templates = km.templates

	,	urlMap = km.uri({
		'weibo': 'weibo/getContent',
		'search': 'weibo/getCommentList'
	})

    // 来自于pages.json配置文件
    ,   pages = km.pages;

	km.$win.scrollTop(0);

    require(['modules/page/Page'], function (Page) {
        var page = new Page()
        ,   i = 0
        ,   l = pages.length
        ,   pageItem;

        page.restore(); // 恢复上次打开状态

        for (; i < l; i++) {
            pageItem = pages[i];

            if (pageItem.create) {
                pageItem = page.create(pageItem);
            }

            if (pageItem.active) {
                page.active(pageItem);
            }
        }

        km.page = page;

        // 绑定切换
        var pageEvent = 'click.page'
        km.$dom.off(pageEvent).on(pageEvent, '.page-title', function () {
            var pageItem = $(this).tmplItem().data;

            page.active(pageItem);
        }).on(pageEvent, '#pages-title-container .trash', function () {
            var pid = $(this).closest('li').data('pid');

            page.trash(pid);
        }).on(pageEvent, '#page-refresh-feature', function () {
            page.refresh();
        });
    });

}(this, km);