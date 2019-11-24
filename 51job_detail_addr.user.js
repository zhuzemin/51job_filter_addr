// ==UserScript==
// @name       	51job search filter with distance
// @namespace   https://github.com/zhuzemin
// @description 51job搜索结果以距离过滤
// @author      zhuzemin
// @include     https://search.51job.com/list/*
// @version     1.0
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant         GM_setValue
// @grant         GM_getValue
// @grant         GM_addStyle
// ==/UserScript==

/*
Require: 
	Firefox <=56
	Greasemonky <=3.x
Setting "Home point" & "Distance limit":
	Coordinate from Baidu map: https://api.map.baidu.com/lbsapi/getpoint/index.html
	Click on drop-down triangle next to the Greasemonkey Icon
	"User Scripts Commands"...
*/
  
"use strict";

// prepare UserPrefs
setUserPref(
    'homepoint',
    '0',
    'Set Home point',
    `Set "home point" with "Baidu map" point". Example: "39.122174, 117.215491"`
);

setUserPref(
    'distance',
    '6000',
    'Set Distance limit',
    'Set distance limit for how far from home.'
);
//addr column weight 
let cssContent = `	
		.dw_table .t3{
			width:200px
		}
	`
//modified	addr column weight	
GM_addStyle(cssContent);
//homepoint
const HOMEPOINT = GM_getValue("homepoint");
//limit distance from home
const LIMIT = GM_getValue("distance");
//51job request info
class Job51 {
    constructor(jobid) {
        this.url = 'https://search.51job.com/jobsearch/bmap/map.php?jobid=' + jobid;
        this.jobid = jobid;
        this.charset = 'text/plain;charset=gbk';
    }
}
//baidu map request info
class Baidu {
    constructor(homepoint, lat, lng) {
        this.ak = "RGBBNuGoAcxvzl02ibOAxGZM";
        this.url = `https://api.map.baidu.com/direction/v2/riding?origin=${homepoint}&destination=${lat},${lng}&ak=${this.ak}`;
        this.charset = 'text/plain;charset=utf8';
    }
}
//resultList
var resultList = window.content.document.querySelector("#resultList");
//result array
var divs = resultList.querySelectorAll("div.el");
//main
for (var i = 1; i < divs.length; ++i) {
    //jobid
    let jobid = divs[i].querySelector("input.checkbox").getAttribute("value");
    //declare '51job' object
    let job51 = new Job51(jobid);
    //response object
    var ret = request(job51);
    //responseText
    let g_company = ret.responseText;
    //company info
    g_company = g_company.match(/\{.*\}/)[0];
    //edit to json string
    g_company = g_company.replace(/([\'\"])?([a-zA-Z0-9_]+)([\'\"])?:/g, '"$2": ');
    //convert to json
    g_company = JSON.parse(g_company);
    //company addr
    let address = g_company.address;
    //company lat
    var lat = g_company.lat;
    //company lng	
    var lng = g_company.lng;
    //company region
    let region = divs[i].querySelector("span.t3");
    //replace region with addr
    region.textContent = address;
    //if homepoint had set	
    if (HOMEPOINT != "0" || HOMEPOINT != "") {
        try {
            //declare 'baidu map' object
            let baidu = new Baidu(HOMEPOINT, lat, lng);
            //response object
            ret = request(baidu);
            //riding route
            let riding = JSON.parse(ret.responseText);
            //distance
            let distance = parseInt(riding.result.routes[0].distance);
            //if big then 'LIMIT'
            if (distance > LIMIT && distance < 100000) {
                //remove the row of the company
                resultList.removeChild(divs[i]);
            }
        } catch (err) {
            console.log(err.message);
            continue;
        }
    }
}
//request function, return response object
function request(object) {
    //GM api
    return GM_xmlhttpRequest({
        method: 'GET',
        url: object.url,
        headers: {
            'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
            'Accept': 'application/atom+xml,application/xml,text/xml',
            'Referer': 'https://search.51job.com/jobsearch/bmap/map.php?jobid=102801929',
        },
        overrideMimeType: object.charset,
        synchronous: true
    });
}
//string 2 dom object
function createElementFromHTML(htmlString) {
    var div = window.content.document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild;
}
//add css
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }

    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}
// setting User Preferences
function setUserPref(varName, defaultVal, menuText, promtText) {
    GM_registerMenuCommand(menuText, function() {
        var val = prompt(promtText, GM_getValue(varName, defaultVal));
        // end execution if clicked CANCEL
        if (val === null) {
            return;
        }
        GM_setValue(varName, val);
    });
}
