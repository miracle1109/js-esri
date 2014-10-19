EsriLeaflet.Tasks.Query = EsriLeaflet.Tasks.Task.extend({
  setters: {
    'offset': 'offset',
    'limit': 'limit',
    'outFields': 'fields[]',
    'precision': 'geometryPrecision',
    'featureIds': 'objectIds[]',
    'returnGeometry': 'returnGeometry',
    'token': 'token'
  },

  path: 'query',

  params: {
    returnGeometry: true,
    where: '1=1',
    outSr: 4326,
    outFields: '*'
  },

  within: function(geometry){
    return this.intersects(geometry);
  },

  intersects: function(geometry){
    this._setGeometry(geometry);
    this.params.spatialRel = 'esriSpatialRelIntersects';
    this.params.inSr = 4326;
    return this;
  },

  contains: function(geometry){
    this._setGeometry(geometry);
    this.params.spatialRel = 'esriSpatialRelContains';
    this.params.inSr = 4326;
    return this;
  },

  crosses: function(geometry){
    this._setGeometry(geometry);
    this.params.spatialRel = 'esriSpatialRelCrosses';
    this.params.inSr = 4326;
    return this;
  },

  touches: function(geometry){
    this._setGeometry(geometry);
    this.params.spatialRel = 'esriSpatialRelTouches';
    this.params.inSr = 4326;
    return this;
  },

  overlaps: function(geometry){
    this._setGeometry(geometry);
    this.params.spatialRel = 'esriSpatialRelOverlaps';
    this.params.inSr = 4326;
    return this;
  },

  // only valid for Feature Services running on ArcGIS Server 10.3 or ArcGIS Online
  nearby: function(latlng, radius){
    this.params.geometry = ([latlng.lng,latlng.lat]).join(',');
    this.params.geometryType = 'esriGeometryPoint';
    this.params.spatialRel = 'esriSpatialRelIntersects';
    this.params.units = 'esriSRUnit_Meter';
    this.params.distance = radius;
    this.params.inSr = 4326;
    return this;
  },

  where: function(string){
    this.params.where = string.replace(/"/g, '\'');
    return this;
  },

  between: function(start, end){
    this.params.time = ([start.valueOf(), end.valueOf()]).join();
    return this;
  },

  fields: function (fields) {
    if (L.Util.isArray(fields)) {
      this.params.outFields = fields.join(',');
    } else {
      this.params.outFields = fields;
    }
    return this;
  },

  simplify: function(map, factor){
    var mapWidth = Math.abs(map.getBounds().getWest() - map.getBounds().getEast());
    this.params.maxAllowableOffset = (mapWidth / map.getSize().y) * factor;
    return this;
  },

  orderBy: function(fieldName, order){
    order = order || 'ASC';
    this.params.orderByFields = (this.params.orderByFields) ? this.params.orderByFields + ',' : '';
    this.params.orderByFields += ([fieldName, order]).join(' ');
    return this;
  },

  returnGeometry: function(bool){
    this.params.returnGeometry = bool;
    return this;
  },

  run: function(callback, context){
    this._cleanParams();
    return this.request(function(error, response){
      callback.call(context, error, (response && EsriLeaflet.Util.responseToFeatureCollection(response)), response);
    }, context);
  },

  count: function(callback, context){
    this._cleanParams();
    this.params.returnCountOnly = true;
    return this.request(function(error, response){
      callback.call(this, error, (response && response.count), response);
    }, context);
  },

  ids: function(callback, context){
    this._cleanParams();
    this.params.returnIdsOnly = true;
    return this.request(function(error, response){
      callback.call(this, error, (response && response.objectIds), response);
    }, context);
  },

  // only valid for Feature Services running on ArcGIS Server 10.3 or ArcGIS Online
  bounds: function(callback, context){
    this._cleanParams();
    this.params.returnExtentOnly = true;
    return this.request(function(error, response){
      callback.call(context, error, (response && response.extent && EsriLeaflet.Util.extentToBounds(response.extent)), response);
    }, context);
  },

  // only valid for image services
  pixelSize: function(point){
    point = L.point(point);
    this.params.pixelSize = ([point.x,point.y]).join(',');
    return this;
  },

  // only valid for map services
  layer: function(layer){
    this.path = layer + '/query';
    return this;
  },

  _cleanParams: function(){
    delete this.params.returnIdsOnly;
    delete this.params.returnExtentOnly;
    delete this.params.returnCountOnly;
  },

  _setGeometry: function(geometry) {
    if ( geometry.hasOwnProperty('length') ) {
      geometry = L.latLngBounds(geometry);
    }

    if ( geometry instanceof L.LatLngBounds ) {
      // set geometry + geometryType
      this.params.geometry = EsriLeaflet.Util.boundsToExtent(geometry);
      this.params.geometryType = 'esriGeometryEnvelope';
      return;
    }

    if ( geometry instanceof L.GeoJSON ) {
      //reassign geometry to the GeoJSON value  (we are assuming that only one feature is present)
      geometry = geometry.getLayers()[0].feature.geometry;
      this.params.geometry = EsriLeaflet.Util.geojsonToArcGIS(geometry);
      this.params.geometryType = EsriLeaflet.Util.geojsonTypeToArcGIS(geometry.type);
    }

    if ( geometry.type === 'Feature' ) {
      // get the geometry of the geojson feature
      geometry = geometry.geometry;
    }

    if ( geometry.type === 'Point' ||  geometry.type === 'LineString' || geometry.type === 'Polygon') {
      this.params.geometry = EsriLeaflet.Util.geojsonToArcGIS(geometry);
      this.params.geometryType = EsriLeaflet.Util.geojsonTypeToArcGIS(geometry.type);
      return;
    }
    /*global console */
    if(console && console.warn) {
      console.warn('invalid geometry passed to spatial query. Should be an L.LatLngBounds or GeoJSON Point Line or Polygon');
    }

    return;
  }
});

EsriLeaflet.Tasks.query = function(url, params){
  return new EsriLeaflet.Tasks.Query(url, params);
};