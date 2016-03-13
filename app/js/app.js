var App = new Vue({
    el: '#app',
    init: updateView,
    data: {
        FolderList: [],
        Bookmarks: [],
        Draged: {}
    },
    computed: {},
    methods: {
        voidFilter: function(item) {
            var bookmarks = item.children;
            for (var i in bookmarks) {
                if (bookmarks[i].url) {
                    if (bookmarks[i].url.indexOf('javascript:') !== 0) {
                        return item;
                    }
                }
            }
        },
        urlFilter: function(item) {
            if (!item.children) {
                if (item.url.indexOf('javascript:') !== 0) {
                    return item;
                }
            }
        },
        drag: function(event) {
            var oldElement = event.srcElement.parentElement;
            var id = oldElement.id;
            var pid = oldElement.getAttribute('pid');
            var app = this;
            allocate(this.FolderList, id, pid, function(FolderList, FolderIdx, BookmarkIdx) {
                app.Draged = FolderList[FolderIdx].children.splice(BookmarkIdx, 1)[0];
            });
        },
        drop: function(event) {
            var Destination = event.srcElement.parentElement;
            var id = Destination.id;
            var pid = Destination.getAttribute('pid');
            var old = this.Draged;
            old.parentId = pid;
            allocate(this.FolderList, id, pid, function(FolderList, FolderIdx, BookmarkIdx) {
                FolderList[FolderIdx].children.splice(BookmarkIdx, 0, old);
                moveBookmark(old.id, pid, BookmarkIdx);
            });
        },
        toggle:function(event){
        	var show = event.target.parentElement.children[1].style.display;
        	if (show == "none"){
        		event.target.parentElement.children[1].style.display = "";
        	}else{
        		event.target.parentElement.children[1].style.display = "none";
        	}
        }
    }
});

function allocate(FolderList, id, pid, callback) {
    //在FolderList中搜索书签的辅助函数
    //输入书签的id，返回书签在FolderList中的索引
    var li = FolderList;
    OuterLoop:
        for (var i in li) {
            if (li[i].id == pid) {
                for (var b in li[i].children) {
                    if (li[i].children[b].id == id) {
                        callback(li, i, b);
                        break OuterLoop;
                    }
                }
            }
        }
}

function moveBookmark(id, newPid, idx) {
	//简单粗暴的方法移动书签
    var Destination = {
        parentId: newPid,
        index: parseInt(idx)
    };
    chrome.bookmarks.move(id.toString(), Destination);
}

function updateView() {
    if (App) {
        App.FolderList = [];
    }
    chrome.bookmarks.getTree(function(bookmarks) {
        //将书签文件夹树展开为列表，存在FolderList中
        function treeWalker(BookmarkList) {
            //搜索书签树，展开为文件夹列表
            //每个文件夹列表的children属性为书签列表
            var Bookmark = {};
            for (var i in BookmarkList) {
                if (!BookmarkList[i].children) {
                    //不是文件夹
                    if (BookmarkList[i].url.indexOf('javascript:') !== 0) {
                        //不是js脚本
                        App.Bookmarks.push(BookmarkList[i]);
                    }
                } else {
                    //是文件夹，向下递归检索
                    App.FolderList.push(BookmarkList[i]);
                    treeWalker(BookmarkList[i].children);
                }
            }
        }
        treeWalker(bookmarks);
    });
}

chrome.bookmarks.onChildrenReordered.addListener(updateView);
chrome.bookmarks.onImportEnded.addListener(updateView);
chrome.bookmarks.onChanged.addListener(updateView);
chrome.bookmarks.onRemoved.addListener(updateView);
chrome.bookmarks.onCreated.addListener(updateView);

// 不想被闪瞎的话请注释掉下面一行代码
// chrome.bookmarks.onMoved.addListener(updateView);
