// ==UserScript==
// @name         Resetera filter threads
// @version      1.0.7
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

        var blockedThreadsDropdown = document.createElement("select");
        var defaultOption = document.createElement("option")
        defaultOption.innerText = "--- Remove a filter ---";
        blockedThreadsDropdown.appendChild(defaultOption);
        blockedThreadsDropdown.id = "blockedThreadsDropdown";

        var topNav = document.getElementsByClassName("PageNav");
        topNav = topNav[0];

        var unblockButtonDiv = document.createElement("div");
        unblockButtonDiv.className = "customButtonDiv";
        var unblockButton = document.createElement("a");
        unblockButton.onclick = unblockThread;
        unblockButton.href = "/#/";
        unblockButton.className = "customButtons";
        unblockButton.innerText = "Unblock Item";
        unblockButton.id = "unblockButton";
        unblockButtonDiv.appendChild(unblockButton);

        var unblockContainer = document.createElement("div");
        unblockContainer.className = "unblockContainer";
        unblockContainer.appendChild(blockedThreadsDropdown);
        unblockContainer.appendChild(unblockButtonDiv);

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
        extraFilteringOptionsContainer.appendChild(unblockContainer);

        topNav.insertAdjacentElement("afterend", extraFilteringOptionsContainer);
        var CP = buildControlPanel();
        topNav.insertAdjacentElement("afterend", CP);

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
                        console.log(blockList)

                        localStorage.blockList = JSON.stringify(blockList);                        
                    }

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

        function initiateBlockedThreadDropdown() {
            localStorage.blockList = localStorage.blockList || "[]";
            var blockList = JSON.parse(localStorage.blockList);
            for (var idx in blockList) {
                var opt = document.createElement("option");
                opt.value = blockList[idx];
                opt.innerText = blockList[idx];
                blockedThreadsDropdown.appendChild(opt);
            }
        }

        function buildElem(elem, className, innerText) {

            var ele = document.createElement(elem);
            if (className)
                ele.className = className;
            if (innerText)
                ele.innerText = innerText;
            return ele;
        }

        function buildControlPanel() {

            var CP = buildElem("div", "widget", null)
            .appendChild(buildElem("fieldset", null, null))
            .appendChild(buildElem("legend", null, "Blacklisted threads and keywords"))
            .insertAdjacentElement("afterend", buildElem("div", "controlGroup", null))
            
            var unorderedList = buildElem("ul", "blockList", null);

            getBlockedItems().forEach(function(blockedItem){

                var blockedListItem = buildElem("li", "blockedListItem", blockedItem);

                var href = buildElem("a", "customButtons", "Unblock");
                href.onclick = unblockThread;
                href.href = "/#/";

                var unblockButton = buildElem("div", "customButtonDiv", null);
                unblockButton.appendChild(href);

                blockedListItem.appendChild(unblockButton);
                unorderedList.appendChild(blockedListItem);
            });

            CP.appendChild(unorderedList);
            console.log(CP);
            return CP;
        }

        function unblockThread(e) {
            console.log(e);
            e.preventDefault();

            var createDate = new Date();

            var val = blockedThreadsDropdown.value;
            localStorage.blockList = localStorage.blockList || "[]";
            var blockList = JSON.parse(localStorage.blockList);
            blockList = blockList.filter(function(blockedItem) {
                var blockedItemVal = blockedItem.value;
                return blockedItem !== blockedItemVal;
            });
            localStorage.blockList = JSON.stringify(blockList);

            localStorage.unblockList = localStorage.unblockList || "[]";
            var unblockList = JSON.parse(localStorage.unblockList);
            unblockList.push({
                value: val,
                created: createDate
            });

            localStorage.unblockList = JSON.stringify(unblockList);
            syncWithServer(function(){
                hideShowThreads();

                for (var i = 0; i < blockedThreadsDropdown.length; i++) {
                    if (blockList.indexOf(blockedThreadsDropdown.options[i].value) === -1){
                        blockedThreadsDropdown.remove(i);
                    }
                }
            }, createDate);
        }

        function getBlockedItems() {
            localStorage.blockList = localStorage.blockList || "[]";
            var blockList = JSON.parse(localStorage.blockList);
            return blockList;            
        }

        window.pushToBlocklist = function(str, createDate) {

            localStorage.blockList = localStorage.blockList || "[]";
            var blockList = JSON.parse(localStorage.blockList);

            var filter = {
                value: str,
                created: createDate
            }

            blockList.push(filter);
            localStorage.blockList = JSON.stringify(blockList);

            var newOption = document.createElement("option");
            newOption.value = str;
            newOption.innerText = str;
            blockedThreadsDropdown.appendChild(newOption);
        };

        function init() {

            syncWithServer(function(){
                hideShowThreads();
                initiateBlockedThreadDropdown();
            }, new Date());
        }

        init();

        function hideShowThreads() {

            var blockList = localStorage.blockList ? JSON.parse(localStorage.blockList) : [];

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


        var threads = document.getElementsByClassName("discussionListItem");

        function hide(e) {
            e.preventDefault();
            var threadTitle;
            if (e.toElement) {
                var parentElement = e.toElement.parentElement;
                parentElement = parentElement.parentElement;
                threadTitle = e.toElement.parentElement.previousElementSibling.getElementsByTagName("h3")[0];
            } else {
                var parentElement = e.target.parentElement;
                parentElement = parentElement.parentElement;

                threadTitle = e.target.parentElement.previousElementSibling.getElementsByTagName("h3")[0];
            }
            var blockThreadText = threadTitle.innerText;
            var createDate = new Date();

            var filter {
                value: blockThreadText,
                created: createDate
            }

            pushToBlocklist(filter);
            syncWithServer(function(){
                hideShowThreads();
            }, createDate);
        }

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

    };
})();