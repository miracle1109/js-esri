/*! Esri-Leaflet - v0.0.1-beta.4 - 2014-02-24
*   Copyright (c) 2014 Environmental Systems Research Institute, Inc.
*   Apache License*/
L.esri={_callback:{}},L.esri.Support={CORS:!!(window.XMLHttpRequest&&"withCredentials"in new XMLHttpRequest)},L.esri.RequestHandlers={CORS:function(a,b,c,d){var e=new XMLHttpRequest;b.f="json",e.onreadystatechange=function(){var a;if(4===e.readyState){try{a=JSON.parse(e.responseText)}catch(b){a={error:"Could not parse response as JSON."}}d?c.call(d,a):c(a)}},e.open("GET",a+"?"+L.esri.Util.serialize(b),!0),e.send(null)},JSONP:function(a,b,c,d){var e="c"+(1e9*Math.random()).toString(36).replace(".","_");b.f="json",b.callback="L.esri._callback."+e;var f=L.DomUtil.create("script",null,document.body);f.type="text/javascript",f.src=a+"?"+L.esri.Util.serialize(b),f.id=e,L.esri._callback[e]=function(a){d?c.call(d,a):c(a),document.body.removeChild(f),delete L.esri._callback[e]}}},L.esri.get=L.esri.Support.CORS?L.esri.RequestHandlers.CORS:L.esri.RequestHandlers.JSONP,L.esri.Mixins={},L.esri.Mixins.featureGrid={_activeRequests:0,_initializeFeatureGrid:function(a){this._map=a,this._previousCells=[],this.center=this._map.getCenter(),this.origin=this._map.project(this.center),this._moveHandler=L.esri.Util.debounce(function(a){"zoomend"===a.type&&(this.origin=this._map.project(this.center),this._previousCells=[]),this._requestFeatures(a.target.getBounds())},this.options.debounce,this),a.on("zoomend resize move",this._moveHandler,this),this._requestFeatures(a.getBounds())},_destroyFeatureGrid:function(a){a.off("zoomend resize move",this._moveHandler,this)},_requestFeatures:function(a){var b=this._cellsWithin(a);b&&b.length>0&&this.fire("loading",{bounds:a});for(var c=0;c<b.length;c++)this._makeRequest(b[c],b,a)},_makeRequest:function(a,b,c){this._activeRequests++;var d={geometryType:"esriGeometryEnvelope",geometry:JSON.stringify(L.esri.Util.boundsToExtent(a.bounds)),outFields:this.options.fields.join(","),outSR:4326,inSR:4326,where:this.options.where};this.options.token&&(d.token=this.options.token),L.esri.get(this.url+"query",d,function(a){this._activeRequests--,this._activeRequests<=0&&this.fire("load",{bounds:c}),!a.error||499!==a.error.code&&498!==a.error.code?this._render(a):this._authenticating||(this._authenticating=!0,this.fire("authenticationrequired",{retry:L.Util.bind(function(a){this._authenticating=!1,this.options.token=a,this._previousCells=[],this._requestFeatures(this._map.getBounds())},this)}))},this)},_cellsWithin:function(a){var b=this._map.getSize(),c=this._map.project(this._map.getCenter());Math.min(this.options.cellSize/b.x,this.options.cellSize/b.y);for(var d=a.pad(.1),e=[],f=this._map.project(d.getNorthWest()),g=this._map.project(d.getSouthEast()),h=f.subtract(c).divideBy(this.options.cellSize),i=g.subtract(c).divideBy(this.options.cellSize),j=Math.round((this.origin.x-c.x)/this.options.cellSize),k=Math.round((this.origin.y-c.y)/this.options.cellSize),l=L.esri.Util.roundAwayFromZero(h.x)-j,m=L.esri.Util.roundAwayFromZero(i.x)-j,n=L.esri.Util.roundAwayFromZero(h.y)-k,o=L.esri.Util.roundAwayFromZero(i.y)-k,p=l;m>p;p++)for(var q=n;o>q;q++){var r="cell:"+p+":"+q,s=L.esri.Util.indexOf(this._previousCells,r)>=0;if(!s||!this.options.deduplicate){var t=this._cellExtent(p,q),u=t.getCenter(),v=u.distanceTo(t.getNorthWest()),w=u.distanceTo(this.center),x={row:p,col:q,id:r,center:u,bounds:t,distance:w,radius:v};e.push(x),this._previousCells.push(r)}}return e.sort(function(a,b){return a.distance-b.distance}),e},_cellExtent:function(a,b){var c=this._cellPoint(a,b),d=this._cellPoint(a+1,b+1),e=this._map.unproject(c),f=this._map.unproject(d);return L.latLngBounds(e,f)},_cellPoint:function(a,b){var c=this.origin.x+a*this.options.cellSize,d=this.origin.y+b*this.options.cellSize;return[c,d]}},L.esri.Mixins.identifiableLayer={identify:function(a,b,c){var d={sr:"4326",mapExtent:JSON.stringify(L.esri.Util.boundsToExtent(this._map.getBounds())),tolerance:5,geometryType:"esriGeometryPoint",imageDisplay:this._map._size.x+","+this._map._size.y+",96",geometry:JSON.stringify({x:a.lng,y:a.lat,spatialReference:{wkid:4326}})};this.options.layers&&(d.layers=this.options.layers);var e;"function"==typeof b&&"undefined"==typeof c?(c=b,e=d):"object"==typeof b&&(b.layerDefs&&(b.layerDefs=this.parseLayerDefs(b.layerDefs)),e=L.Util.extend(d,b)),L.esri.get(this.serviceUrl+"/identify",e,c)},parseLayerDefs:function(a){return a instanceof Array?"":"object"==typeof a?JSON.stringify(a):a}},function(L){var a="https:"!==window.location.protocol?"http:":"https:",b="line-height:9px; text-overflow:ellipsis; white-space:nowrap;overflow:hidden; display:inline-block;",c="position:absolute; top:-38px; right:2px;",d="<img src='https://serverapi.arcgisonline.com/jsapi/arcgis/3.5/js/esri/images/map/logo-med.png' alt='Powered by Esri' class='esri-attribution-logo' style='"+c+"'>",e=function(a){return"<span class='esri-attributions' style='"+b+"'>"+a+"</span>"};L.esri.BasemapLayer=L.TileLayer.extend({statics:{TILES:{Streets:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",attributionUrl:"https://static.arcgis.com/attribution/World_Street_Map",options:{minZoom:1,maxZoom:19,subdomains:["server","services"],attribution:e("Esri")+d}},Topographic:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",attributionUrl:"https://static.arcgis.com/attribution/World_Topo_Map",options:{minZoom:1,maxZoom:19,subdomains:["server","services"],attribution:e("Esri")+d}},Oceans:{urlTemplate:a+"//server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}",attributionUrl:"https://static.arcgis.com/attribution/Ocean_Basemap",options:{minZoom:1,maxZoom:16,subdomains:["server","services"],attribution:e("Esri")+d}},NationalGeographic:{urlTemplate:"https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,subdomains:["server","services"],attribution:e("Esri")+d}},DarkGray:{urlTemplate:a+"//tiles{s}.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Dark_Gray_Base_Beta/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:10,subdomains:[1,2],attribution:e("Esri, DeLorme, HERE")+d}},DarkGrayLabels:{urlTemplate:a+"//tiles{s}.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Dark_Gray_Reference_Beta/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:10,subdomains:[1,2]}},Gray:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,subdomains:["server","services"],attribution:e("Esri, NAVTEQ, DeLorme")+d}},GrayLabels:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:16,subdomains:["server","services"]}},Imagery:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19,subdomains:["server","services"],attribution:e("Esri, DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community")+d}},ImageryLabels:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19,subdomains:["server","services"]}},ImageryTransportation:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:19,subdomains:["server","services"]}},ShadedRelief:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:13,subdomains:["server","services"],attribution:e("ESRI, NAVTEQ, DeLorme")+d}},ShadedReliefLabels:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:12,subdomains:["server","services"]}},Terrain:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:13,subdomains:["server","services"],attribution:e("Esri, USGS, NOAA")+d}},TerrainLabels:{urlTemplate:a+"//{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}",options:{minZoom:1,maxZoom:13,subdomains:["server","services"]}}}},initialize:function(a,b){var c;if("object"==typeof a&&a.urlTemplate&&a.options)c=a;else{if("string"!=typeof a||!L.esri.BasemapLayer.TILES[a])throw new Error("L.esri.BasemapLayer: Invalid parameter. Use one of 'Streets', 'Topographic', 'Oceans', 'NationalGeographic', 'Gray', 'GrayLabels', 'DarkGray', 'DarkGrayLabels', 'Imagery', 'ImageryLabels', 'ImageryTransportation', 'ShadedRelief' or 'ShadedReliefLabels'");c=L.esri.BasemapLayer.TILES[a]}var d=L.Util.extend(c.options,b);if(L.TileLayer.prototype.initialize.call(this,c.urlTemplate,L.Util.setOptions(this,d)),c.attributionUrl){var e=c.attributionUrl;this._dynamicAttribution=!0,this._getAttributionData(e)}},_dynamicAttribution:!1,bounds:null,zoom:null,onAdd:function(a){return!a.attributionControl&&console?(console.warn("L.esri.BasemapLayer requires attribution. Please set attributionControl to true on your map"),void 0):(L.TileLayer.prototype.onAdd.call(this,a),this._dynamicAttribution&&(this.on("load",this._handleTileUpdates,this),this._map.on("viewreset zoomend dragend",this._handleTileUpdates,this)),this._map.on("resize",this._resizeAttribution,this),void 0)},onRemove:function(a){this._dynamicAttribution&&(this.off("load",this._handleTileUpdates,this),this._map.off("viewreset zoomend dragend",this._handleTileUpdates,this)),this._map.off("resize",this._resizeAttribution,this),L.TileLayer.prototype.onRemove.call(this,a)},_handleTileUpdates:function(a){var b,c;"load"===a.type&&(b=this._map.getBounds(),c=this._map.getZoom()),("viewreset"===a.type||"dragend"===a.type||"zoomend"===a.type)&&(b=a.target.getBounds(),c=a.target.getZoom()),this.attributionBoundingBoxes&&b&&c&&(b.equals(this.bounds)&&c===this.zoom||(this.bounds=b,this.zoom=c,this._updateMapAttribution()))},_resizeAttribution:function(){var a=this._map.getSize().x;this._getAttributionLogo().style.display=600>a?"none":"block",this._getAttributionSpan().style.maxWidth=.75*a+"px"},_getAttributionData:function(a){this.attributionBoundingBoxes=[],L.esri.RequestHandlers.JSONP(a,{},this._processAttributionData,this)},_processAttributionData:function(a){for(var b=0;b<a.contributors.length;b++)for(var c=a.contributors[b],d=0;d<c.coverageAreas.length;d++){var e=c.coverageAreas[d],f=new L.LatLng(e.bbox[0],e.bbox[1]),g=new L.LatLng(e.bbox[2],e.bbox[3]);this.attributionBoundingBoxes.push({attribution:c.attribution,score:e.score,bounds:new L.LatLngBounds(f,g),minZoom:e.zoomMin,maxZoom:e.zoomMax})}this.attributionBoundingBoxes.sort(function(a,b){return a.score<b.score?-1:a.score>b.score?1:0}),this.bounds&&this._updateMapAttribution()},_getAttributionSpan:function(){return this._map._container.querySelectorAll(".esri-attributions")[0]},_getAttributionLogo:function(){return this._map._container.querySelectorAll(".esri-attribution-logo")[0]},_updateMapAttribution:function(){for(var a="",b=0;b<this.attributionBoundingBoxes.length;b++){var c=this.attributionBoundingBoxes[b];if(this.bounds.intersects(c.bounds)&&this.zoom>=c.minZoom&&this.zoom<=c.maxZoom){var d=this.attributionBoundingBoxes[b].attribution;-1===a.indexOf(d)&&(a.length>0&&(a+=", "),a+=d)}}this._getAttributionSpan().innerHTML=a,this._resizeAttribution()}}),L.esri.basemapLayer=function(a,b){return new L.esri.BasemapLayer(a,b)}}(L);