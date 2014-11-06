/**
* 分页条小插件
* 参数 : data  --->  页码信息，通常为后端传回来的数据，包含 maxPage , page 两个字段
* HTML: 使用前在需要放置页码的位置放置如下这样一段代码即可:
*       <div class="page"></div>
* CSS : 使用前保证已经 @import pager.less
* Event: 如果给定第三个参数(一个回调函数),那么插件会自动给分页条绑定点击事件(click.pager,命名空间为pager),回调函数的第一个参数就是触发时点击的页码数; 也可以不给定这个参数,如果希望自己为分页条绑定事件
*/
$.fn.pageBar = function(data, callback) {
    return this.each(function() {
        var pager = $(this).html('<a data-page="pr" href="#" class="pre">上一页</a><span class="pagenum"></span><a data-page="nx" class="next" href="#">下一页</a>');
        var pagenum = pager.find('.pagenum'),
        pageNext = pager.find('.next'),
        pagePre = pager.find('.pre');

        if (data.maxPage > 1) {
            var pageTmpl = '<a data-page="${$data}" class="{{if $data == $item.cur}}cur{{/if}}" href="#">${$data}</a>';
            pagenum.empty();

            $.tmpl(pageTmpl, 1, {
                cur: data.page
            }).appendTo(pagenum);

            if (data.maxPage <= 5) {
                for (i = 2; i < data.maxPage; i++) {
                    $.tmpl(pageTmpl, i, {
                        cur: data.page
                    }).appendTo(pagenum);
                }
            } else {
                var ellipsis = '<span class="ellipsis">…</span>'
                if (data.page > 4 && (data.maxPage - data.page) > 3) {
                    pagenum.append(ellipsis);
                    for (var i = data.page - 2; i <= data.page + 2; i++) {
                        $.tmpl(pageTmpl, i, {
                            cur: data.page
                        }).appendTo(pagenum);
                    }
                    pagenum.append(ellipsis);
                } else if (data.page <= 4) {
                    for (var i = 2; i < 6; i++) {
                        $.tmpl(pageTmpl, i, {
                            cur: data.page
                        }).appendTo(pagenum);
                    }
                    if (data.maxPage > 6) {
                        pagenum.append(ellipsis);
                    }
                } else if ((data.maxPage - data.page) <= 4) {
                    if (data.maxPage > 6) {
                        pagenum.append(ellipsis);
                    }
                    for (var i = data.maxPage - 4; i < data.maxPage; i++) {
                        $.tmpl(pageTmpl, i, {
                            cur: data.page
                        }).appendTo(pagenum);
                    }
                }
            }
            $.tmpl(pageTmpl, data.maxPage, {
                cur: data.page
            }).appendTo(pagenum);

            if (data.page == data.maxPage) {
                pageNext.addClass('hidden');
            } else {
                pageNext.removeClass('hidden');
            }

            if (data.page == 1) {
                pagePre.addClass('hidden');
            } else {
                pagePre.removeClass('hidden');
            }

            pager.removeClass('hidden');
        } else {
            pager.addClass('hidden');
        }
        
        if (!pager.data('eventBinded') && typeof callback === 'function') {
            pager.data('eventBinded', true);
            pager.on('click.pager', 'a',
            function(e) {
                var eventElem = $(this),
                page = eventElem.data('page'),
                currentPage;
                e.preventDefault(); ! data.preventTop && window.scroll(0, 0);
                if (!$.isNumeric(page)) {
                    var $currPage = pager.find('.cur');
                    currentPage = parseInt($currPage.data('page'));
                    page = (page == 'nx') ? currentPage + 1 : currentPage - 1;
                    eventElem = (page == 'nx') ? $currPage.next() : $currPage.prev();
                };
                eventElem.addClass('cur').siblings().removeClass('cur');
                callback.call(null, page);
            });
        };
    });
}