// ==UserScript==
// @name         Resetera filter threads
// @version      0.7
// @description  Filters threads based on keywords
// @author       Kyle Murphy
// @match        https://www.resetera.com/*
// @grant none
// @run-at        document-idle
// @namespace    http://tampermonkey.net/
// @license CC-BY-NC-SA-4.0; https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode
// @license GPL-3.0+; http://www.gnu.org/licenses/gpl-3.0.txt
// @author          Kyle Murphy
// @downloadURL https://github.com/murphyky/reseteraScripts/raw/master/reseterafilter.user.js
// @updateURL https://github.com/murphyky/reseteraScripts/raw/master/reseterafilter.user.js

// ==/UserScript==


(function() {
    'use strict';

    window.pushToBlocklist = function (str) {
        localStorage.blockList = localStorage.blockList || "[]";
        var blockList = JSON.parse(localStorage.blockList);
        blockList.push(str);
        localStorage.blockList = JSON.stringify(blockList);
    };

    window.onload = function(){

        var blockList = localStorage.blockList ? localStorage.blockList.split("|") : [];
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

    };


    var threads = document.getElementsByClassName("discussionListItem");

    function hide(e) {
        e.preventDefault();
        console.log(e);

        var threadTitle = e.toElement.parentNode.getElementsByTagName("h3")[0];
        var blockThreadText = threadTitle.innerText;
        pushToBlocklist(blockThreadText)
    }

    for (var i = 0; i < threads.length; i++) {
        var g = document.createElement("button");
        g.innerText = "Hide Thread";
        g.onclick = hide;
        threads[i].appendChild(g)
    }



})();