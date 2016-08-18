(function(window) {
    'use strict';
    var ChromeBM = window.chrome.bookmarks,
        //Vue.js实例对象
        App = new window.Vue({
            el: '#app',
            init: initView,
            data: {
                FolderList: [],
                Bookmarks: [],
                Draged: {},
                KeyWord: {},
                RecentAdd: [],
            },
            computed: {},
            methods: {
                //过滤空文件夹
                voidFilter: function(item) {
                    var bookmarks = item.children,
                        i;

                    for (i in bookmarks) {
                        if (bookmarks[i].url) {

                            if (bookmarks[i].url.indexOf('javascript:') !== 0) {
                                return item;
                            }
                        }
                    }
                },
                //过滤文件夹和js脚本
                urlFilter: function(item) {
                    if (!item.children) {

                        if (item.url.indexOf('javascript:') !== 0) {
                            return item;
                        }
                    }
                },
                drag: function(event) {
                    var oldElement = event.srcElement.parentElement,
                        id = oldElement.id,
                        pid = oldElement.getAttribute('pid'),
                        app = this;

                    allocate(this.FolderList, id, pid, function(List, Idx, BMIdx) {
                        app.Draged = List[Idx].children.splice(BMIdx, 1)[0];
                    });
                },
                drop: function(event) {
                    var Destination = event.srcElement.parentElement,
                        id = Destination.id,
                        pid = Destination.getAttribute('pid'),
                        old = this.Draged;

                    old.parentId = pid;
                    allocate(this.FolderList, id, pid, function(List, Idx, BMIdx) {
                        List[Idx].children.splice(BMIdx, 0, old);
                        moveBookmark(old.id, pid, BMIdx);
                    });
                }
            }
        });

    // 在FolderList中搜索书签的辅助函数
    // 输入书签的id，返回书签在FolderList中的索引
    function allocate(FolderList, id, pid, callback) {
        var li = FolderList,
            i, b;

        Loop:
            for (i in li) {

                if (li[i].id == pid) {

                    for (b in li[i].children) {

                        if (li[i].children[b].id == id) {
                            callback(li, i, b);
                            break Loop;
                        }
                    }
                }
            }
    }
    //移动书签到指定文件夹
    function moveBookmark(id, newPid, idx) {
        var Destination = {
            parentId: newPid,
            index: parseInt(idx)
        };

        ChromeBM.move(id.toString(), Destination);
    }

    //更新视图
    function updateView() {
        if (App) {
            App.FolderList = [];
        }

        //将书签文件夹树展开为列表，存在FolderList中
        ChromeBM.getTree(function(bookmarks) {

            //搜索书签树，展开为文件夹列表
            //每个文件夹列表的children属性为书签列表
            function treeWalker(BookmarkList) {
                var i;

                for (i in BookmarkList) {

                    //不是文件夹
                    if (!BookmarkList[i].children) {

                        //不是js脚本
                        if (BookmarkList[i].url.indexOf('javascript:') !== 0) {
                            App.Bookmarks.push(BookmarkList[i]);
                        }
                    } else { //是文件夹，向下递归检索
                        App.FolderList.push(BookmarkList[i]);
                        treeWalker(BookmarkList[i].children);
                    }
                }
            }

            treeWalker(bookmarks);
        });
    }

    function getRecentAdd(num = 10) {
        ChromeBM.getRecent(num, function(bookmarks) {
            App.RecentAdd = bookmarks;
        });
    }

    function initView() {
        getRecentAdd();
        updateView();
    }

    ChromeBM.onChildrenReordered.addListener(updateView);
    ChromeBM.onImportEnded.addListener(updateView);
    ChromeBM.onChanged.addListener(updateView);
    ChromeBM.onRemoved.addListener(updateView);
    ChromeBM.onCreated.addListener(updateView);

    // 不想被闪瞎的话请注释掉下面一行代码
    // ChromeBM.onMoved.addListener(updateView);

})(window);
//TODO
//最上边：搜索栏，输入以搜索特定书签
//最右边：最近添加的书签
//最右边：最近的历史纪录
//最下边：大大的书签删除框
