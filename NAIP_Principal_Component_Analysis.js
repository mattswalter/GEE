// Run a Principal Component Analysis (PCA) on the four band National Agriculture Imagery Program (NAIP) data

// Import and clip NAIP data
var dataset = ee.ImageCollection('USDA/NAIP/DOQQ') 
.filterBounds(roi) 
.filterDate('2013-01-01','2013-09-30')
.max()
.clip(roi);

Map.addLayer(dataset, {}, 'Original NAIP image');

var image = dataset

// PCA code from https://developers.google.com/earth-engine/guides/arrays_eigen_analysis
// Display the input imagery and the region in which to do the PCA.
var region = image.geometry();

//Map.addLayer(ee.Image().paint(Merged_counties, 0, 2), {}, 'Region');


// Set some information about the input to be used later.
var scale = 30;
var bandNames = image.bandNames();

// Mean center the data to enable a faster covariance reducer
// and an SD stretch of the principal components.
var meanDict = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: de,
    scale: scale,
    maxPixels: 1e9
});
var means = ee.Image.constant(meanDict.values(bandNames));
var centered = image.subtract(means);

// This helper function returns a list of new band names.
var getNewBandNames = function(prefix) {
  var seq = ee.List.sequence(1, bandNames.length());
  return seq.map(function(b) {
    return ee.String(prefix).cat(ee.Number(b).int());
  });
};

// This function accepts mean centered imagery, a scale and
// a region in which to perform the analysis.  It returns the
// Principal Components (PC) in the region as a new image.
var getPrincipalComponents = function(centered, scale, region) {
  // Collapse the bands of the image into a 1D array per pixel.
  var arrays = centered.toArray();

  // Compute the covariance of the bands within the region.
  var covar = arrays.reduceRegion({
    reducer: ee.Reducer.centeredCovariance(),
    geometry: de,
    scale: scale,
    maxPixels: 1e9
  });

  // Get the 'array' covariance result and cast to an array.
  // This represents the band-to-band covariance within the region.
  var covarArray = ee.Array(covar.get('array'));

  // Perform an eigen analysis and slice apart the values and vectors.
  var eigens = covarArray.eigen();

  // This is a P-length vector of Eigenvalues.
  var eigenValues = eigens.slice(1, 0, 1);
  // This is a PxP matrix with eigenvectors in rows.
  var eigenVectors = eigens.slice(1, 1);

  // Convert the array image to 2D arrays for matrix computations.
  var arrayImage = arrays.toArray(1);

  // Left multiply the image array by the matrix of eigenvectors.
  var principalComponents = ee.Image(eigenVectors).matrixMultiply(arrayImage);

  // Turn the square roots of the Eigenvalues into a P-band image.
  var sdImage = ee.Image(eigenValues.sqrt())
    .arrayProject([0]).arrayFlatten([getNewBandNames('sd')]);

  // Turn the PCs into a P-band image, normalized by SD.
  return principalComponents
    // Throw out an an unneeded dimension, [[]] -> [].
    .arrayProject([0])
    // Make the one band array image a multi-band image, [] -> image.
    .arrayFlatten([getNewBandNames('pc')])
    // Normalize the PCs by their SDs.
    .divide(sdImage);
};

// Get the PCs at the specified scale and in the specified region
var pcImage = getPrincipalComponents(centered, scale, region);

for (var i = 0; i < bandNames.length().getInfo(); i++) {
  var band = pcImage.bandNames().get(i).getInfo();}
print(pcImage)

// Create a stack of four pca bands
var pc1 = pcImage.select(['pc1']).rename('PC1')
Map.addLayer(pc1, {min: -2, max: 2}, 'PCA 1');

var pc2 = pcImage.select(['pc2']).rename('PC2')
Map.addLayer(pc2, {min: -2, max: 2}, 'PCA 2');

var pc3 = pcImage.select(['pc3']).rename('PC3')
Map.addLayer(pc3, {min: -2, max: 2}, 'PCA 3');

var pc4 = pcImage.select(['pc4']).rename('PC4')
Map.addLayer(pc4, {min: -2, max: 2}, 'PCA 4');

var pca = pc1.addBands(pc2).addBands(pc3).addBands(pc4)

// Map layer with the first three pca bands
Map.addLayer(pca, {min: -2, max: 2, bands:['PC1', 'PC2', 'PC3']}, 'PCA Image');
