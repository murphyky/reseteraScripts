// ==UserScript==
// @name         Resetera filter threads
// @version      1.1.8
// @description  Filters threads based on keywords
// @author       Kyle Murphy
// @match        https://www.resetera.com/forums/*
// @grant GM_addStyle
// @run-at        document-idle
// @require https://code.jquery.com/jquery-1.12.4.js
// @require https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @namespace    http://tampermonkey.net/
// @license CC-BY-NC-SA-4.0; https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
// @license GPL-3.0+; http://www.gnu.org/licenses/gpl-3.0.txt
// @author          Kyle Murphy
// @downloadURL https://github.com/murphyky/reseteraScripts/raw/master/reseterafilter.user.js
// @updateURL https://github.com/murphyky/reseteraScripts/raw/master/reseterafilter.user.js

// ==/UserScript==

GM_addStyle(`
.customButtonDiv {
background: #7e52b8;
position:relative;
border-radius:3px;
float:right;
top: 10px;
}
.titleText {
float:left;
width: 80%;
}
.customButtons{
padding: 8px;
color: white !important;
text-align:center;
padding:0 4px;
}
#blockedThreadsDropdown{
    width: 175px;
}

#extraFilteringOptionsContainer #keyWordFilter {
        float: left;
        width: 170px;
    }
#extraFilteringOptionsContainer .customButtonDiv{
        top:0px;
        float:none;
        display:inline-block;
        width: 120px;
    }

`);

(function() {
    'use strict';

    window.onload = function() {

        var username = getUsername();

        var topNav = document.getElementsByClassName("PageNav");
        topNav = topNav[0];

        var keyWordFilter = document.createElement("input");
        keyWordFilter.id = "keyWordFilter";
        keyWordFilter.placeholder = "Enter keyword to filter out threads";
        keyWordFilter.type = "text";

        var filterKeywordDiv = document.createElement("div");
        filterKeywordDiv.className = "customButtonDiv";
        var filterKeywordButton = document.createElement("a");
        filterKeywordButton.href = "/#/"
        filterKeywordButton.className = "customButtons";
        filterKeywordButton.onclick = filterByKeyword;
        filterKeywordButton.innerText = "Add keyword to filter";
        filterKeywordButton.id = "filterKeywordButton";
        filterKeywordDiv.appendChild(filterKeywordButton);

        var keyworldFilterContainer = document.createElement("div");
        keyworldFilterContainer.id = "keyworldFilterContainer";

        keyworldFilterContainer.appendChild(keyWordFilter);
        keyworldFilterContainer.appendChild(filterKeywordDiv);

        var extraFilteringOptionsContainer = document.createElement("div");
        extraFilteringOptionsContainer.id = "extraFilteringOptionsContainer";
        extraFilteringOptionsContainer.appendChild(keyworldFilterContainer);

        topNav.insertAdjacentElement("afterend", extraFilteringOptionsContainer);
        var controlPanelBlockedItemList = null;
        var CP = null;

        $('.controlGroup').controlgroup();

        function getUsername() {
            var eles = $(".concealed");
            var username;
            for (var i in eles) {
                if (eles[i].title) {
                    return eles[i].innerText || null;
                }
            }

            return username;
        }

        function syncWithServer(cb, createDate) {

            var data = JSON.stringify({
                user:username,
                blockList:localStorage.blockList || "[]",
                unblockList: localStorage.unblockList || "[]",
                createDate: createDate
            });

            $.ajax({
                type: "POST",
                url: "https://kyle-murphy.co.uk/api/filters",
                data: data,
                contentType: "application/json",
                processdata: true,
                success: function(res) {

                    res = res || {};
                    res.data = res.data || {};
                    if (res.data.filters) {
                        //we get the latest filter collection back
                        var blockList = res.data.filters;
                        setBlockList(blockList);
                    }
                    clearUnblockList()
                    cb()
                },
                error: function(err){
                    console.error(err);
                    cb();
                }
            });
        }

        //do a simple pattern match and block threads by keyword (eg: 'Trump', 'Brexit')
        function filterByKeyword(e) {
            e.preventDefault();
            //prevent empty strings from removing every thread
            if (!!keyWordFilter.value.trim()) {
                var createDate = new Date();
                pushToBlocklist(keyWordFilter.value, createDate);

                syncWithServer(function(){
                    hideShowThreads();
                }, createDate);
            }
        }

        /*
        function initiateBlockedThreadDropdown() {
            localStorage.blockList = localStorage.blockList || "[]";
            var blockList = JSON.parse(localStorage.blockList);
            for (var idx in blockList) {
                var item = blockList[idx];
                var opt = document.createElement("option");
                opt.value = item.value;
                opt.innerText = item.value;
                blockedThreadsDropdown.appendChild(opt);
            }
        }*/

        function buildElem(elem, className, innerText) {

            var ele = document.createElement(elem);
            if (className)
                ele.className = className;
            if (innerText) {
                ele.innerText = innerText;

                ele.getInnerText = function() {
                    return innerText;
                }
            }
            return ele;
        }

        function buildControlPanel() {

            var CP = buildElem("div", "widget", null)
            .appendChild(buildElem("fieldset", null, null))
            .appendChild(buildElem("legend", null, "Blacklisted threads and keywords"))
            .insertAdjacentElement("afterend", buildElem("div", "controlGroup", null))
            
            controlPanelBlockedItemList = buildElem("ul", "blockList", null);

            getBlockList().forEach(function(blockedItem){

                appendBlockedItem(blockedItem);
            });

            CP.appendChild(controlPanelBlockedItemList);
            console.log(CP);
            return CP;
        }

        function appendBlockedItem(blockedItem) {
            var innerText = blockedItem.value;

            var blockedListItem = buildElem("li", "blockedListItem", innerText);

            var href = buildElem("a", "customButtons unblockControlPanel", "Unblock");
            href.onclick = unblockThread;
            href.href = "/#/";

            var unblockButton = buildElem("div", "customButtonDiv", null);
            unblockButton.appendChild(href);

            blockedListItem.appendChild(unblockButton);
            controlPanelBlockedItemList.appendChild(blockedListItem);
        }

        function removeUnblockedItem(unblockedItem) {
            
            var blockedItems = controlPanelBlockedItemList.getElementsByClassName("blockedListItem");

            for (var i = 0 ;i < blockedItems.length; i++) {
                if (blockedItems[i].getInnerText() === unblockedItem) {
                    controlPanelBlockedItemList.removeChild(blockedItems[i]);
                }
            }
        }

        function getBlockList() {
            localStorage.blockList = localStorage.blockList || "[]";
            return JSON.parse(localStorage.blockList);
        }

        function setBlockList(blockList) {
            if (typeof blockList !== "string")
                blockList = JSON.stringify(blockList);
            localStorage.blockList = blockList;
        }

        function clearUnblockList() {
            setUnblockList([]);
        }

        function getUnblockList() {
            localStorage.unblockList = localStorage.unblockList || "[]";
            return JSON.parse(localStorage.unblockList);
        }

        function setUnblockList(unblockList) {
            if (typeof unblockList !== "string")
                unblockList = JSON.stringify(unblockList);
            localStorage.unblockList = unblockList;
        }

        function unblockThread(e) {
            console.log(e);
            e.preventDefault();

            var createDate = new Date();
            var val;
            if (e.srcElement.classList.contains("unblockControlPanel")) {
                var srcElement = e.srcElement.parentElement.parentElement;
                val = srcElement.getInnerText();
            } else {
                val = null;
            }

            var blockList = getBlockList();
            blockList = blockList.filter(function(blockedItem) {
                var blockedItemVal = blockedItem.value;
                return val !== blockedItemVal;
            });
            setBlockList(blockList);

            var unblockList = getUnblockList();
            unblockList.push({
                value: val,
                created: createDate
            });
            setUnblockList(unblockList);

            syncWithServer(function(){
                hideShowThreads();
                removeUnblockedItem(val);
            }, createDate);
        }

        window.pushToBlocklist = function(str, createDate) {

            var blockList = getBlockList();
            var filter = {
                value: str,
                created: createDate
            }
            blockList.push(filter);
            setBlockList(blockList);
            appendBlockedItem(filter);
        };

        function init() {

            syncWithServer(function(){
                hideShowThreads();
                CP = buildControlPanel();
                topNav.insertAdjacentElement("afterend", CP);
            }, new Date());
        }

        init();

        function hideShowThreads() {

            var blockList = getBlockList();
            var d = document.getElementsByClassName("discussionListItem");

            for (var y = 0; y < d.length; y++) {
                var elem = d[y];
                var threadTitle = null;
                for (var i = 0; i < blockList.length; i++) {

                    var text = elem.getElementsByTagName("h3")[0];
                    text = text.innerText;
                    text = text.trim();

                    var blockListFilter = blockList[i].value || "";

                    if (text.toLowerCase().indexOf(blockListFilter.toLowerCase()) > -1) {
                        threadTitle = text;
                    }
                }

                if (threadTitle) {
                    console.log("Hiding this thread", threadTitle);
                    elem.style.display = "none";
                } else {
                    if (elem.style.display === "none") {
                        console.log("Unhiding this thread", elem.innerText);
                        elem.style.display = "";
                    }
                }

            }
        }

        function hide(e) {
            e.preventDefault();
            var threadTitle;
            if (e.toElement) {
                var parentElement = e.toElement.parentElement;
                parentElement = parentElement.parentElement;
                threadTitle = parentElement.getElementsByTagName("h3")[0];
            } else {
                var parentElement = e.target.parentElement;
                parentElement = parentElement.parentElement;

                threadTitle = parentElement.getElementsByTagName("h3")[0];
            }
            var blockThreadText = threadTitle.innerText;
            var createDate = new Date();

            pushToBlocklist(blockThreadText, createDate);
            syncWithServer(function(){
                hideShowThreads();
            }, createDate);
        }

        function generateHideButtons() {
            var threads = document.getElementsByClassName("discussionListItem");
            for (var i = 0; i < threads.length; i++) {
                var g = document.createElement("a");
                var hideDiv = document.createElement("div");
                hideDiv.className = "customButtonDiv";
                hideDiv.appendChild(g);
                g.href = "/#/";
                g.onclick = hide;
                g.className = "customButtons";
                g.innerText = "Hide";
                var threadSubSection = threads[i].getElementsByClassName("main")[0];
                threadSubSection.appendChild(hideDiv);
            }            
        }
        generateHideButtons();
    };
})();