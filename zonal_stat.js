// Calculate statistics of an image within a feature collection

var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_32DAY_NDVI')
                  .filterDate('2018-01-01', '2018-12-31')
                  .select('NDVI')
                  .mean();

// Reduce to mean pixels per region in shapefile
var tab = l8.reduceRegions({
  collection: table,
  reducer: ee.Reducer.mean(),
  scale: 30,
});
print(tab)
