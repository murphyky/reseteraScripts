// ==UserScript==
// @name         Resetera filter threads
// @version      0.75
// @description  Filters threads based on keywords
// @author       Kyle Murphy
// @match        https://www.resetera.com/*
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
.hideButtonDiv {
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
.hideButton{
padding: 8px;
color: white !important;
text-align:center;
padding:0 4px;
}
`);

(function() {
    'use strict';

    window.pushToBlocklist = function (str) {
        localStorage.blockList = localStorage.blockList || "[]";
        var blockList = JSON.parse(localStorage.blockList);
        blockList.push(str);
        localStorage.blockList = JSON.stringify(blockList);
    };

    window.onload = hideThreads;

    function hideThreads(){

        var blockList = localStorage.blockList ? JSON.parse(localStorage.blockList) : [];

        var d = document.getElementsByClassName("discussionListItem");

        for (var y = 0; y < d.length;y++) {
            var elem = d[y];

            for (var i = 0; i < blockList.length; i++) {

                if (elem.innerText.toLowerCase().indexOf(blockList[i].toLowerCase())>-1){
                    console.log("Hiding this thread", elem.innerText);
                    elem.style.display = "none";
                }
            }
        }
    }


    var threads = document.getElementsByClassName("discussionListItem");

    function hide(e) {
        e.preventDefault();

        var threadTitle = e.toElement.parentNode.getElementsByTagName("h3")[0];
        var blockThreadText = threadTitle.innerText;
        pushToBlocklist(blockThreadText);
        hideThreads();
    }

    for (var i = 0; i < threads.length; i++) {
        var g = document.createElement("a");
        var hideDiv = document.createElement("div");
        hideDiv.className = "hideButtonDiv";
        hideDiv.appendChild(g);
        g.href = "/#/";
        g.onclick = hide;
        g.className = "hideButton";
        g.innerText = "Hide";
        var threadSubSection = threads[i].getElementsByClassName("main")[0];
        threadSubSection.appendChild(hideDiv);
    }

})();