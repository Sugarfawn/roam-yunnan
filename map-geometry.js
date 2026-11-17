(function (root) {
  'use strict';
  function projectRaw([lng, lat]) {
    const rad = Math.PI / 180;
    return [lng * rad, -Math.log(Math.tan(Math.PI / 4 + lat * rad / 2))];
  }
  function rings(geometry) {
    if (geometry.type === 'Polygon') return geometry.coordinates;
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat();
    throw new Error('Unsupported province geometry');
  }
  function create(geojson, width = 900, height = 760, padding = 54) {
    const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson];
    const allRings = features.flatMap(feature => rings(feature.geometry));
    const points = allRings.flat().map(projectRaw);
    const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
    const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
    const scale = Math.min((width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY));
    function project(coordinates) {
      const [x, y] = projectRaw(coordinates);
      return [width / 2 + (x - (minX + maxX) / 2) * scale, height / 2 + (y - (minY + maxY) / 2) * scale];
    }
    function path(geometry) {
      return rings(geometry).map(ring => ring.map((coordinate, index) => {
        const [x, y] = project(coordinate);
        return (index ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2);
      }).join(' ') + ' Z').join(' ');
    }
    return { project, path, features };
  }
  const api = { create, projectRaw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RoamGeometry = api;
})(typeof window !== 'undefined' ? window : globalThis);
