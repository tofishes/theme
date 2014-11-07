# gulp项目编译

### 目标
* less编译, 生成sourceMap (方案：gulp-less + gulp-sourcemaps 或者 gulp-less-sourcemap)
* css合并压缩 (gulp-concat, gulp-minify-css)
* js语法检查，合并，压缩 (gulp-jshint, gulp-concat, gulp-uglify)
* 图片压缩 (gulp-imagemin)
* assets资源缓存，生成hash文件名并替换引用路径 (gulp-rev-all)
* 实时监控文件更改，并只处理有更改的文件 (gulp-changed || gulp-newer)
* 文档生成

### 相关插件列表(通过[gulp plugins] (http://gulpjs.com/plugins/)，寻找合适的gulp组件)
* [gulp-size] (https://github.com/sindresorhus/gulp-size): Log输出显示文件大小
* [gulp-concat] (https://github.com/wearefractal/gulp-concat): 合并文件
* [gulp-imagemin] (https://github.com/sindresorhus/gulp-imagemin): 压缩图片
* [gulp-less] (https://github.com/plus3network/gulp-less): 编译less
* [gulp-sourcemasp] (https://github.com/floridoo/gulp-sourcemaps): 配合gulp-less可以生成sourcemap
* [gulp-less-sourcemap] (https://github.com/radist2s/gulp-less-sourcemap): 编译less，并可以生成sourcemap 
* [gulp-autoprefixer] (https://github.com/sindresorhus/gulp-autoprefixer): 自动为多浏览器私有css属性加前缀
* [gulp-minify-css] (https://github.com/jonathanepollack/gulp-minify-css): 压缩css
* [gulp-jshint] (http://github.com/spenceralger/gulp-jshint): 检查js
* [gulp-requirejs] (http://github.com/robinthrift/gulp-requirejs): 优化requirejs
* [gulp-uglify] (https://github.com/terinjokes/gulp-uglify/): 压缩js
* [gulp-rename] (https://github.com/hparra/gulp-rename): 重命名文件
* [gulp-minify-html] (https://github.com/jonathanepollack/gulp-minify-html): 压缩html
* [gulp-clean] (https://github.com/peter-vilja/gulp-clean): 清空文件夹
* [gulp-changed] (https://github.com/sindresorhus/gulp-changed) || [gulp-newer] (https://github.com/tschaub/gulp-newer): 只处理内容有改变的文件
* [gulp-rev-all] (https://github.com/smysnk/gulp-rev-all): 版本化静态资源

### 可选插件
* [gulp-header] (https://npmjs.org/package/gulp-header)&amp; [gulp-footer] (https://npmjs.org/package/gulp-footer) || [gulp-wrapper] (https://github.com/AntouanK/gulp-wrapper)
* [gulp-load-plugins] (https://npmjs.org/package/gulp-load-plugins)
* [gulp-rev] (https://npmjs.org/package/gulp-rev) &amp; [gulp-rev-collector] (https://github.com/shonny-ua/gulp-rev-collector)
* [gulp-stylus] (https://npmjs.org/package/gulp-stylus)
* [gulp-react] (https://npmjs.org/package/gulp-react)
* [gulp-yuidoc] (https://github.com/jsBoot/gulp-yuidoc)

#### 安装(--save-dev参数表示更新package.json文件的依赖配置)
    npm install gulp gulp-util gulp-size gulp-concat gulp-imagemin gulp-less-sourcemap gulp-autoprefixer gulp-minify-css gulp-jshint gulp-requirejs gulp-uglify gulp-rename gulp-minify-html gulp-clean gulp-changed gulp-rev-all --save-dev


### 参考
http://www.mikestreety.co.uk/blog/an-advanced-gulpjs-file<br>
http://blog.nodejitsu.com/npmawesome-9-gulp-plugins/<br>
https://phphub.org/topics/49<br>
http://www.dbpoo.com/getting-started-with-gulp/<br>
http://stefanimhoff.de/2014/gulp-tutorial-13-revisioning/<br>
