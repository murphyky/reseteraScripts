// ==UserScript==
// @name         Resetera filter threads
// @version      0.95
// @description  Filters threads based on keywords
// @author       Kyle Murphy
// @match        https://www.resetera.com/forums/*
// @grant GM_addStyle
// @run-at        document-idle
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


    function filterByKeyword(e) {
        e.preventDefault();
        //prevent empty strings from removing every thread
        if (!!keyWordFilter.value.trim()) {
            pushToBlocklist(keyWordFilter.value);
            hideShowThreads();
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

    function unblockThread(e) {
        e.preventDefault();
        var val = blockedThreadsDropdown.value;
        localStorage.blockList = localStorage.blockList || "[]";
        var blockList = JSON.parse(localStorage.blockList);
        blockList = blockList.filter(function(blockedItem) {
            return blockedItem !== val;
        });
        localStorage.blockList = JSON.stringify(blockList);
        hideShowThreads();

        for (var i = 0; i < blockedThreadsDropdown.length; i++) {
            if (val === blockedThreadsDropdown.options[i].value) {
                blockedThreadsDropdown.remove(i);
            }
        }
    }

    window.pushToBlocklist = function(str) {
        localStorage.blockList = localStorage.blockList || "[]";
        var blockList = JSON.parse(localStorage.blockList);
        blockList.push(str);
        localStorage.blockList = JSON.stringify(blockList);

        var newOption = document.createElement("option");
        newOption.value = str;
        newOption.innerText = str;
        blockedThreadsDropdown.appendChild(newOption);
    };

    window.onload = init;

    function init() {
        hideShowThreads();
        initiateBlockedThreadDropdown();
    }

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

                if (text.toLowerCase().indexOf(blockList[i].toLowerCase()) > -1) {
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
            threadTitle = e.toElement.parentElement.previousElementSibling.getElementsByTagName("h3")[0];
        } else {
            threadTitle = e.target.parentElement.previousElementSibling.getElementsByTagName("h3")[0];
        }
        var blockThreadText = threadTitle.innerText;
        pushToBlocklist(blockThreadText);
        hideShowThreads();
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

})();