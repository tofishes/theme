    /**
     * @author ToFishes
     * @desc 简单选项卡切换
     * url: http://localhost/something#tab-current
     * html:
     * <div id="jtabsimple">
     * 	<div class="tabs">
     *      <li id="current"><a class="curr">标题1</a></li>
     * 		<li><a>标题2</a></li>
     * 		<li><a>标题3</a></li>
     * 	</div>
     * 	<div class="jtab-con">
     * 		内容1
     * 	</div>
     * 	<div class="jtab-con" style="display:none;">
     * 		内容2
     * 	</div>
     * 	<div class="jtab-con" style="display:none;">
     * 		内容3
     * 	</div>
     * </div>
     * 
     * js:
     * 
     * $(function(){
     * 		$("#jtabsimple").jTabSimple({
     * 			tab: ".tabs a",
     * 			con: ".jtab-con"
     *      });
     * });
     */
    $.jTabSimple = $.fn.jTabSimple = function(c){
        c = $.extend({
            tab: ".tabs li", //标题项
            con: ".tab-con", //内容项
            curr: "curr",  //当前高亮的css类名
            init: true, //是否自动初始化，否则手动
            index: 0,      //默认显示的tab
            remote: false, //远程加载
            loading: '<p class="panel t-c"><em class="loading"></em></p>', //自定义loading的提示html片段
            timeout: 15000, //远程ajax载入超时设置
            event: "click", //触发的事件，jQuery所支持的所有事件
            prevent: true,
            callback: function(i, tab, con){} //传递一个索引，tab集合，con集合
        },c);
        var o = this.jquery ? this : $(document);
        return o.each(function(){
            var tab = c.tab.jquery ? c.tab : $(this).find(c.tab),
            		con = c.con.jquery ? c.con : $(this).find(c.con);
            
            function toggle(i){
                i = (i < 0) ? c.index : i; 
                tab.removeClass(c.curr).eq(i).addClass(c.curr); 
                if(c.remote){
                    con.html(c.loading);            
                    $.ajax({
                    	'type': "GET",
                    	'url': tab.eq(i).find("a").attr("href"),
                    	'success': function(ret){
                         	con.html(ret);
                        },
                        'error': function(xhq, info){
                        	if(info == 'timeout') {
                        		con.html('<p style="text-align:center">内容载入超时，请稍后再试。</p>');
                        	};
                        },
                        'timeout': c.timeout
                    });
                } else {
                    con.hide().eq(i).show();
                }
                c.callback(i, tab, con);
            };
            
            tab.bind(c.event, function(){
                var i = tab.index($(this));
                toggle(i);
                return ! c.prevent;
            });
            
            //init, hash必须以 #tab- 开头，代表元素id
            var uri = location.hash.match(/\#tab\-(.*)$/);
            if(uri != null){
                $("#"+uri[1]).addClass(c.curr);
            }
            var index = tab.index(tab.filter("." + c.curr));
            c.init && toggle(index);
        });
    };
