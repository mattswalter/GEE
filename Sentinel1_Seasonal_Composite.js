// Create a seasonal composite for Sentinel 1 Sythetic Aperature Radar (SAR) data for summer, fall, and spring using both VV and VH bands
// Import and filter VV polarisation
var collectionVV = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .filterBounds(de)
    .filterDate('2018-01-01', '2018-12-31')
    .select(['VV']);
print(collectionVV);

// Import and filter VH polarisation
// VH Band descending track
var collectionVH = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .filterBounds(de)
    .filterDate('2018-01-01', '2018-12-31')
    .select(['VH']);
print(collectionVH);

// Median collection
var VV = collectionVV.median();

// Adding the VV layer to the map
Map.addLayer(VV, {min: -30, max: 0}, 'VV');

//Calculate the VH layer and add it
var VH = collectionVH.median();
Map.addLayer(VH, {min: -30, max: 0}, 'VH');


// Create a 3 band stack by selecting from different periods (months)
var VV1 = ee.Image(collectionVV.filterDate('2018-04-01', '2018-06-30').median());
var VV2 = ee.Image(collectionVV.filterDate('2018-07-01', '2018-09-30').median());
var VV3 = ee.Image(collectionVV.filterDate('2018-10-01', '2018-12-31').median());
var VH1 = ee.Image(collectionVH.filterDate('2018-04-01', '2018-06-30').median());
var VH2 = ee.Image(collectionVH.filterDate('2018-07-01', '2018-09-30').median());
var VH3 = ee.Image(collectionVH.filterDate('2018-10-01', '2018-12-31').median());


// Add VV seasonal composite to map
var season_composite = VV1.addBands(VV2).addBands(VV3).clip(de)
//Add VH seasonal composite to map
var season_composite1 = VH1.addBands(VH2).addBands(VH3).clip(de)

Map.addLayer(season_composite, {min: -12, max: -7}, 'Season composite VV');
Map.addLayer(season_composite1, {min: -20, max: -7}, 'Season composite VH');
