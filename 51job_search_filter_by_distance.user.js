// ==UserScript==
// @name:zh-CN        	51job search filter with distance
// @name        	51job search filter with distance
// @namespace   https://github.com/zhuzemin
// @description:zh-CN  51job搜索结果以距离过滤
// @description  51job搜索结果以距离过滤
// @author      zhuzemin
// @include     https://search.51job.com/list/*
// @version     1.2
// @grant         GM_xmlhttpRequest
// @grant         GM_registerMenuCommand
// @grant         GM_setValue
// @grant         GM_getValue
// @grant         GM_addStyle
// @connect-src api.map.baidu.com
// @connect-src search.51job.com
// ==/UserScript==

/*
Setting "Home point" & "Distance limit":
	Coordinate from Baidu map: https://api.map.baidu.com/lbsapi/getpoint/index.html
*/
  
"use strict";
  // setting User Preferences
  function setUserPref(varName, defaultVal, menuText, promtText, sep){
    GM_registerMenuCommand(menuText, function() {
      var val = prompt(promtText, GM_getValue(varName, defaultVal));
      if (val === null)  { return; }  // end execution if clicked CANCEL
      // prepare string of variables separated by the separator
      if (sep && val){
        var pat1 = new RegExp('\\s*' + sep + '+\\s*', 'g'); // trim space/s around separator & trim repeated separator
        var pat2 = new RegExp('(?:^' + sep + '+|' + sep + '+$)', 'g'); // trim starting & trailing separator
        //val = val.replace(pat1, sep).replace(pat2, '');
      }
      //val = val.replace(/\s{2,}/g, ' ').trim();    // remove multiple spaces and trim
      GM_setValue(varName, val);
      // Apply changes (immediately if there are no existing highlights, or upon reload to clear the old ones)
      //if(!document.body.querySelector(".THmo")) THmo_doHighlight(document.body);
      //else location.reload();
    });
  }
  
  // prepare UserPrefs
  setUserPref(
  'homepoint',
  '0',
  'Set Home point',
  `Set "home point" with "Baidu Map" point". Example: "39.122174, 117.215491"`,	  
  ','
  );
  
  setUserPref(
  'distance',
  '6000',
  'Set Distance',
  'Set the distance for how far from home.'
  );

	var cssContent= `	
.dw_table .t3{
	width:200px
}
`
GM_addStyle(cssContent);
const ORIGINP=GM_getValue("homepoint");
const LIMIT=GM_getValue("distance");
class Job51{
	constructor(jobid){
		this.url='https://search.51job.com/jobsearch/bmap/map.php?jobid='+jobid;
		this.jobid=jobid;
		this.charset='text/plain;charset=gbk';
	}
}
class Baidu{
	constructor(originP,lat,lng){
		this.ak="RGBBNuGoAcxvzl02ibOAxGZM";
		this.url=`https://api.map.baidu.com/direction/v2/riding?origin=${originP}&destination=${lat},${lng}&ak=${this.ak}`;
		this.charset='text/plain;charset=utf8';
	}
}
var resultList=document.querySelector("#resultList");
var divs=resultList.querySelectorAll("div.el");
for (var i = 1; i < divs.length; ++i){
	(function(div){
	var jobid=div.querySelector("input.checkbox").getAttribute("value");
	//console.log(riding);
	let job51=new Job51(jobid);
GM_xmlhttpRequest({
	method: 'GET',
	url: job51.url,
	headers: {
		'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
		'Accept':	'application/atom+xml,application/xml,text/xml',
		'Referer': 'https://search.51job.com/jobsearch/bmap/map.php?jobid=102801929',
	},
	overrideMimeType:job51.charset, 
  	//synchronous: true
	onload: function(responseDetails) {
	var a=detail_addr(	responseDetails,div);
	var lat=a[0];
	var lng=a[1];
	//	console.log(lat);
if(ORIGINP!="0"||ORIGINP!=""){
		(function(){
		let baidu=new Baidu(ORIGINP,lat,lng);
GM_xmlhttpRequest({
	method: 'GET',
	url: baidu.url,
	headers: {
		'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
		'Accept':	'application/atom+xml,application/xml,text/xml',
		'Referer': 'https://search.51job.com/jobsearch/bmap/map.php?jobid=102801929',
	},
	overrideMimeType:baidu.charset, 
  	//synchronous: true
	onload: function(responseDetails) {
	try{
		filter(	responseDetails,div,resultList);
	}
	catch(err){
		console.log(err);
		//continue;
	}
	}
});
})();

}
	}
});
})(divs[i]);
}
function detail_addr(ret,div){
	var g_company=JSON.parse(ret.responseText.match(/\{.*\}/)[0].replace(/([\'\"])?([a-zA-Z0-9_]+)([\'\"])?:/g, '"$2": '));
	var address=g_company.address;
	var lat=g_company.lat;
	var lng=g_company.lng;
	var region=div.querySelector("span.t3");
	//region.width="300px";
	region.textContent=address;
	return [lat,lng]
}
function filter(ret,div,resultList){
		let riding=JSON.parse(ret.responseText);
//	console.log(riding);
		let distance=parseInt(riding.result.routes[0].distance);
		//console.log(distance);
		if(distance>LIMIT&&distance<100000){
			resultList.removeChild(div);
		}
}
function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes
  return div.firstChild; 
}
function addGlobalStyle(css) {
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) { return; }
  
	style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = css;
	head.appendChild(style);
}
	

				