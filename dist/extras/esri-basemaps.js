/*! Esri-Leaflet - v0.0.1 - 2013-08-04
*   Copyright (c) 2013 Environmental Systems Research Institute, Inc.
*   Apache License*/
L.esri={AttributionStyles:"line-height:9px; text-overflow:ellipsis; white-space:nowrap;overflow:hidden; display:inline-block;",LogoStyles:"position:absolute; top:-38px; right:2px;",_callback:{}},L.esri.Support={CORS:!!(window.XMLHttpRequest&&"withCredentials"in new XMLHttpRequest)},L.esri.RequestHandlers={CORS:function(a,b,c,d){var e=new XMLHttpRequest;b.f="json",e.onreadystatechange=function(){var a;if(4===e.readyState){try{a=JSON.parse(e.responseText)}catch(b){a={error:"Could not parse response as JSON."}}d?c.call(d,a):c(a)}},e.open("GET",a+L.esri.Util.serialize(b),!0),e.send(null)},JSONP:function(a,b,c,d){var e="c"+(1e9*Math.random()).toString(36).replace(".","_");b.f="json",b.callback="L.esri._callback."+e;var f=document.createElement("script");f.type="text/javascript",f.src=a+L.esri.Util.serialize(b),f.id=e,L.esri._callback[e]=function(a){d?c.call(d,a):c(a),document.body.removeChild(f),delete L.esri._callback[e]},document.body.appendChild(f)}},L.esri.get=L.esri.Support.CORS?L.esri.RequestHandlers.CORS:L.esri.RequestHandlers.JSONP,L.esri.Util={debounce:function(a,b){var c=null;return function(){var d=this||d,e=arguments;clearTimeout(c),c=setTimeout(function(){a.apply(d,e)},b)}},roundAwayFromZero:function(a){return a>0?Math.ceil(a):Math.floor(a)},trim:function(a){return a.replace(/^\s\s*/,"").replace(/\s\s*$/,"")},cleanUrl:function(a){return a=L.esri.Util.trim(a),"/"!==a[a.length-1]&&(a+="/"),a},serialize:function(a){var b="?";for(var c in a)if(a.hasOwnProperty(c)){var d=c,e=a[c];b+=encodeURIComponent(d),b+="=",b+=encodeURIComponent(e),b+="&"}return b.substring(0,b.length-1)},indexOf:function(a,b,c){if(c=c||0,a.indexOf)return a.indexOf(b,c);for(var d=c,e=a.length;e>d;d++)if(a[d]===b)return d;return-1},extentToBounds:function(a){var b=new L.LatLng(a.xmin,a.ymin),c=new L.LatLng(a.xmax,a.ymin);return new L.LatLngBounds(b,c)},boundsToExtent:function(a){return{xmin:a.getSouthWest().lng,ymin:a.getSouthWest().lat,xmax:a.getNorthEast().lng,ymax:a.getNorthEast().lat,spatialReference:{wkid:4326}}},boundsToEnvelope:function(a){var b=L.esri.Util.boundsToExtent(a);return{x:b.xmin,y:b.ymin,w:Math.abs(b.xmin-b.ymax),h:Math.abs(b.ymin-b.ymax)}}},L.esri.Mixins={},L.esri.Mixins.featureGrid={_initializeFeatureGrid:function(a){this._map=a,this._previousCells=[],this.center=this._map.getCenter(),this.origin=this._map.project(this.center),this._moveHandler=L.esri.Util.debounce(function(a){"zoomend"===a.type&&(this.origin=this._map.project(this.center),this._previousCells=[]),this._requestFeatures(a.target.getBounds())},this.options.debounce,this),a.on("zoomend resize move",this._moveHandler,this),this._requestFeatures(a.getBounds())},_destroyFeatureGrid:function(a){a.on("zoomend resize move",this._moveHandler,this)},_requestFeatures:function(a){for(var b=this._cellsWithin(a),c=0;c<b.length;c++){var d=b[c];L.esri.get(this.url+"query",{geometryType:"esriGeometryEnvelope",geometry:JSON.stringify(L.esri.Util.boundsToExtent(d.bounds)),outFields:"*",outSr:4326},this._render,this)}},_cellsWithin:function(a){for(var b=this._map.getSize(),c=this._map.project(this._map.getCenter()),d=a.pad(Math.min(this.options.cellSize/b.x,this.options.cellSize/b.y)),e=[],f=this._map.project(d.getNorthWest()),g=this._map.project(d.getSouthEast()),h=f.subtract(c).divideBy(this.options.cellSize),i=g.subtract(c).divideBy(this.options.cellSize),j=Math.round((this.origin.x-c.x)/this.options.cellSize),k=Math.round((this.origin.y-c.y)/this.options.cellSize),l=L.esri.Util.roundAwayFromZero(h.x)-j,m=L.esri.Util.roundAwayFromZero(i.x)-j,n=L.esri.Util.roundAwayFromZero(h.y)-k,o=L.esri.Util.roundAwayFromZero(i.y)-k,p=l;m>p;p++)for(var q=n;o>q;q++){var r="cell:"+p+":"+q,s=this._previousCells.indexOf(r)>=0;if(!s||!this.options.deduplicate){var t=this._cellExtent(p,q),u=t.getCenter(),v=u.distanceTo(t.getNorthWest()),w=u.distanceTo(this.center),x={row:p,col:q,id:r,center:u,bounds:t,distance:w,radius:v};e.push(x),this._previousCells.push(r)}}return e.sort(function(a,b){return a.distance-b.distance}),e},_cellExtent:function(a,b){var c=this._cellPoint(a,b),d=this._cellPoint(a+1,b+1),e=this._map.unproject(c),f=this._map.unproject(d);return L.latLngBounds(e,f)},_cellPoint:function(a,b){var c=this.origin.x+a*this.options.cellSize,d=this.origin.y+b*this.options.cellSize;return[c,d]}},L.esri.Mixins.identifiableLayer={identify:function(a,b,c){var d,e={sr:"4265",mapExtent:JSON.stringify(L.esri.Util.boundsToExtent(this._map.getBounds())),tolerance:3,geometryType:"esriGeometryPoint",imageDisplay:"800,600,96",geometry:JSON.stringify({x:a.lng,y:a.lat,spatialReference:{wkid:4265}})};"function"==typeof b&&"undefined"==typeof c?(c=b,d=e):"object"==typeof b&&(b.layerDefs&&(b.layerDefs=this.parseLayerDefs(b.layerDefs)),d=L.Util.extend(e,b)),L.esri.get(this._url+"/identify",d,c)},parseLayerDefs:function(a){return a instanceof Array?"":"object"==typeof a?JSON.stringify(a):a}},L.esri.BasemapLayer=L.TileLayer.extend({statics:{TILES:{Streets:{urlTemplate:"http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",attributionUrl:"http://static.arcgis.com/attribution/World_Street_Map?f=json",options:{minZoom:1,maxZoom:19,attribution:"<span class='esri-attributions' style='"+L.esri.AttributionStyles+"'>Esri</span><img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+L.esri.LogoStyles+"'>"}},Topographic:{urlTemplate:"http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",attributionUrl:"http://static.arcgis.com/attribution/World_Topo_Map?f=json",options:{minZoom:1,maxZoom:19,attribution:"<span class='esri-attributions' style='"+L.esri.AttributionStyles+"'>Esri</span><img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+L.esri.LogoStyles+"'>"}},Oceans:{urlTemplate:"http://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}",attributionUrl:"http://static.arcgis.com/attribution/Ocean_Basemap?f=json",options:{minZoom:1,maxZoom:16,attribution:"<span class='esri-attributions' style='"+L.esri.AttributionStyles+"'>Esri</span><img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+L.esri.LogoStyles+"'>"}},NationalGeographic:{urlTemplate:"http://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,attribution:"<span class='esri-attributions' style='"+L.esri.AttributionStyles+"'>Esri</span><img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+L.esri.LogoStyles+"'>"}},Gray:{urlTemplate:"http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,attribution:"<span class='esri-attributions' style='"+L.esri.AttributionStyles+"'>Copyright: &copy;2013 Esri, DeLorme, NAVTEQ</span><img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+L.esri.LogoStyles+"'>"}},GrayLabels:{urlTemplate:"http://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16}},Imagery:{urlTemplate:"http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19,attribution:"<span class='esri-attributions' style='"+L.esri.AttributionStyles+"'>Esri, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community</span><img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+L.esri.LogoStyles+"'>"}},ImageryLabels:{urlTemplate:"http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19}}}},initialize:function(a,b){var c;if("object"==typeof a&&a.urlTemplate&&a.options)c=a;else{if("string"!=typeof a||!L.esri.BasemapLayer.TILES[a])throw new Error("L.esri.BasemapLayer: Invalid parameter. Use one of 'Streets', 'Topographic', 'Oceans', 'NationalGeographic', 'Gray', 'GrayLabels', 'Imagery' or 'ImageryLabels'");c=L.esri.BasemapLayer.TILES[a]}var d=L.Util.extend(c.options,b),e=L.esri.Util.cleanUrl(c.urlTemplate);if(L.TileLayer.prototype.initialize.call(this,e,L.Util.setOptions(this,d)),c.attributionUrl){var f=L.esri.Util.cleanUrl(c.attributionUrl);this.dynamicAttribution=!0,this.getAttributionData(f)}},dynamicAttribution:!1,bounds:null,zoom:null,handleTileUpdates:function(a){var b,c;"load"===a.type&&(b=this._map.getBounds(),c=this._map.getZoom()),("viewreset"===a.type||"dragend"===a.type||"zoomend"===a.type)&&(b=a.target.getBounds(),c=a.target.getZoom()),this.attributionBoundingBoxes&&b&&c&&(b.equals(this.bounds)&&c===this.zoom||(this.bounds=b,this.zoom=c,this.updateMapAttribution()))},onAdd:function(a){L.TileLayer.prototype.onAdd.call(this,a),this.dynamicAttribution&&(this.on("load",this.handleTileUpdates,this),this._map.on("viewreset zoomend dragend",this.handleTileUpdates,this)),this._map.on("resize",this.resizeAttribution,this)},resizeAttribution:function(){var a=this._map.getSize().x;this.getAttributionLogo().style.display=600>a?"none":"block",this.getAttributionSpan().style.maxWidth=.75*a+"px"},onRemove:function(a){this.dynamicAttribution&&(this.off("load",this.handleTileUpdates,this),this._map.off("viewreset zoomend dragend",this.handleTileUpdates,this)),this._map.off("resize",this.resizeAttribution,this),L.TileLayer.prototype.onRemove.call(this,a)},getAttributionData:function(a){this.attributionBoundingBoxes=[],L.esri.get(a,{},L.bind(this.processAttributionData,this))},processAttributionData:function(a){for(var b=0;b<a.contributors.length;b++)for(var c=a.contributors[b],d=0;d<c.coverageAreas.length;d++){var e=c.coverageAreas[d],f=new L.LatLng(e.bbox[0],e.bbox[1]),g=new L.LatLng(e.bbox[2],e.bbox[3]);this.attributionBoundingBoxes.push({attribution:c.attribution,score:e.score,bounds:new L.LatLngBounds(f,g),minZoom:e.zoomMin,maxZoom:e.zoomMax})}this.attributionBoundingBoxes.sort(function(a,b){return a.score<b.score?-1:a.score>b.score?1:0}),this.bounds&&this.updateMapAttribution()},getAttributionSpan:function(){return this._map._container.querySelectorAll(".esri-attributions")[0]},getAttributionLogo:function(){return this._map._container.querySelectorAll(".esri-attribution-logo")[0]},updateMapAttribution:function(){for(var a="",b=0;b<this.attributionBoundingBoxes.length;b++){var c=this.attributionBoundingBoxes[b];if(this.bounds.intersects(c.bounds)&&this.zoom>=c.minZoom&&this.zoom<=c.maxZoom){var d=this.attributionBoundingBoxes[b].attribution;-1===a.indexOf(d)&&(a.length>0&&(a+=", "),a+=d)}}this.getAttributionSpan().innerHTML=a,this.resizeAttribution()}}),L.esri.basemapLayer=function(a,b){return new L.esri.BasemapLayer(a,b)};