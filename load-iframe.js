!function(e,t){typeof module!="undefined"?module.exports=t():typeof define=="function"&&typeof define.amd=="object"?define(t):this[e]=t()}("domready",function(){var e=[],t,n=typeof document=="object"&&document,r=n&&n.documentElement.doScroll,i="DOMContentLoaded",s=n&&(r?/^loaded|^c/:/^loaded|^i|^c/).test(n.readyState);return!s&&n&&n.addEventListener(i,t=function(){n.removeEventListener(i,t),s=1;while(t=e.shift())t()}),function(t){s?setTimeout(t,0):e.push(t)}})

domready(function(){
	var iframe = '<iframe height="300px" width="100%" style="border:none !important;" src="https://swimmania.life/gmaps/taxi/index.php?cost_per_mile=400"></iframe>'

	document.getElementById('distance-script').insertAdjacentHTML( 'afterend', iframe )
})