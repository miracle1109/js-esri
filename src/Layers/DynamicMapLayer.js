/* globals L */

/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Sanborn Map Company, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

L.esri.DynamicMapLayer = L.Class.extend({
  includes: L.esri.Mixins.identifiableLayer,

  options: {
    opacity: 1,
    position: 'front'
  },

  _defaultLayerParams: {
    format: 'png24',
    transparent: true,
    f: 'image',
    bboxSR: 4326,
    imageSR: 3857,
    layers: ''
  },

  initialize: function (url, options) {
    this.serviceUrl = L.esri.Util.cleanUrl(url);
    this._layerParams = L.Util.extend({}, this._defaultLayerParams);

    for (var opt in options) {
      if (!options.hasOwnProperty(opt) && this._defaultLayerParams.hasOwnProperty(opt)) {
        this._layerParams[opt] = options[opt];
      }
    }

    this._parseLayers();
    this._parseLayerDefs();

    L.esri.get(this.serviceUrl, {}, function(response){
      this.fire("metadata", { metadata: response });
    }, this);

    L.Util.setOptions(this, options);
  },

  onAdd: function (map) {
    this._map = map;
    this._moveHandler = L.esri.Util.debounce(this._update, 150, this);

    map.on("moveend", this._moveHandler, this);

    if (map.options.crs && map.options.crs.code) {
      // spatial reference of the map
      var sr = parseInt(map.options.crs.code.split(":")[1], 10);

      // we want to output the image for the same spatial reference as the map
      this._layerParams.imageSR = sr;

      // we pass the bbox in 4326 (lat,lng)
      this._layerParams.bboxSR = (sr === 3857) ? 4326 : sr;
    }

    this._update();
  },

  onRemove: function (map) {
    this._map.removeLayer(this._currentImage);
    map.off("moveend", this._moveHandler, this);
  },

  _parseLayers: function () {
    if (typeof this._layerParams.layers === 'undefined') {
      delete this._layerParams.layerOption;
      return;
    }

    var action = this._layerParams.layerOption || null,
        layers = this._layerParams.layers || null,
        verb = 'show',
        verbs = ['show', 'hide', 'include', 'exclude'];

    delete this._layerParams.layerOption;

    if (!action) {
      if (layers instanceof Array) {
        this._layerParams.layers = verb + ':' + layers.join(',');
      } else if (typeof layers === 'string') {
        var match = layers.match(':');

        if (match) {
          layers = layers.split(match[0]);
          if (Number(layers[1].split(',')[0])) {
            if (verbs.indexOf(layers[0]) !== -1) {
              verb = layers[0];
            }

            layers = layers[1];
          }
        }
        this._layerParams.layers = verb + ':' + layers;
      }
    } else {
      if (verbs.indexOf(action) !== -1) {
        verb = action;
      }

      this._layerParams.layers = verb + ':' + layers;
    }
  },

  _parseLayerDefs: function () {
    if (typeof this._layerParams.layerDefs === 'undefined') {
      return;
    }

    var layerDefs = this._layerParams.layerDefs;

    var defs = [];

    if (layerDefs instanceof Array) {
      var len = layerDefs.length;
      for (var i = 0; i < len; i++) {
        if (layerDefs[i]) {
          defs.push(i + ':' + layerDefs[i]);
        }
      }
    } else if (typeof layerDefs === 'object') {
      for (var layer in layerDefs) {
        if(layerDefs.hasOwnProperty(layer)){
          defs.push(layer + ':' + layerDefs[layer]);
        }
      }
    } else {
      delete this._layerParams.layerDefs;
      return;
    }
    this._layerParams.layerDefs = defs.join(';');
  },

  _getImageUrl: function () {
    var size = this._map.getSize();

    this._layerParams.bbox = this._map.getBounds().toBBoxString();
    this._layerParams.size = size.x + ',' + size.y;

    var url = this.serviceUrl + 'export' + L.Util.getParamString(this._layerParams);

    return url;
  },

  _update: function (e) {
    if(this._animatingZoom){
      return;
    }

    if (this._map._panTransition && this._map._panTransition._inProgress) {
      return;
    }

    var zoom = this._map.getZoom();

    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
      return;
    }

    var bounds = this._map.getBounds();

    var image = new L.ImageOverlay(this._getImageUrl(), bounds, {
      opacity: 0
    }).addTo(this._map);

    image.on('load', function(e){
      var newImage = e.target;
      var oldImage = this._currentImage;

      if(newImage._bounds.equals(bounds)){
        this._currentImage = newImage;

        if(this.options.position === "front"){
          this._currentImage.bringToFront();
        } else {
          this._currentImage.bringToBack();
        }

        this._currentImage.setOpacity(this.options.opacity);

        if(oldImage){
          this._map.removeLayer(oldImage);
        }
      } else {
        this._map.removeLayer(newImage);
      }
    }, this);


    this.fire('loading', {
      bounds: bounds
    });
  }
});

L.esri.DynamicMapLayer.include(L.Mixin.Events )

L.esri.dynamicMapLayer = function (url, options) {
  return new L.esri.DynamicMapLayer(url, options);
};
