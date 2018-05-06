// Get file read/write modules from core node
const fs = require('fs');
const lr = require('readline');

// Files to read and write
const slcspFile = __dirname + '/slcsp.csv';
const plansFile = __dirname + '/plans.csv';
const zipsFile = __dirname + '/zips.csv';

// Maps to store data needed from the plans.csv and zips.csv
// Due to size of files and data stored memory is not an issue
const rateAreaToRateMap = {};
const zipToRateAreaMap = {};

// Start the process
startSLCSPGeneration();

function startSLCSPGeneration() {
    try {
        // First build the rate area map
        buildRateAreaMap();
    } catch (err) {
        console.log(err);
    }
}

// Reads the plans.csv file line by line and builds the rateAreatoRate map
function buildRateAreaMap() {
    var reader = lr.createInterface({
        input: fs.createReadStream(plansFile)
    });

    reader.on('line', function (data) {

        try {

            // Parse plan line
            // 0=plan_id,1=state,2=metal_level,3=rate,4=rate_area
            var planData = data.split(',');
            var metal = planData[2];
            var rate = Number(planData[3]);
            var rateArea = planData[1] + planData[4];

            // Only add to map if silver plan and a valid line with rate as number
            if (isNaN(rate) === false && metal === 'Silver') {
                var rateArray = rateAreaToRateMap[rateArea];

                if (!rateArray) {
                    rateArray = [rate];
                    rateAreaToRateMap[rateArea] = rateArray;
                }
                else if (rateArray.indexOf(rate) < 0) {
                    // Do not add duplicate rates
                    rateArray.push(rate);
                }
            }
        }
        catch (err) {
            // Report error if something went wrong
            console.log(err);
        }

    }).on('close', function () {
        // Once plans file is read, build the zipToRateAreaMap
        buildZipToRateAreaMap();
    });

}

// Reads the zips.csv file line by line and builds the zipToRateAreaMap map
function buildZipToRateAreaMap() {
    var reader = lr.createInterface({
        input: fs.createReadStream(zipsFile)
    });

    reader.on('line', function (data) {

        try {

            // Parse zip line
            // 0=zipcode,1=state,2=county_code,3=name,4=rate_area
            // Only zipcode, state, and rate area are needed
            var zipData = data.split(',');
            var zip = zipData[0];
            var rateArea = zipData[1] + zipData[4];

            // Skip header and invalid zip data
            if (isNaN(zip) === false) {
                var raArray = zipToRateAreaMap[zip];

                if (!raArray) {
                    raArray = [rateArea];
                    zipToRateAreaMap[zip] = raArray;
                }
                else if (raArray.indexOf(rateArea) < 0) {
                    // Dont add duplicate rate areas
                    raArray.push(rateArea);
                }
            }
        }
        catch (err) {
            // Report error if something went wrong
            console.log(err);
        }

    }).on('close', function () {
        // Once done write the slcsp file
        writeSLCSP();
    });
}

// Modifies the slcsp.csv file with the calculated slcsp
function writeSLCSP() {
    var reader = lr.createInterface({
        input: fs.createReadStream(slcspFile)
    });
    var lines = [];

    reader.on('line', function (data) {

        try {

            // Read zipcode to calculate slcsp for
            var zipData = data.split(',');
            var zip = zipData[0];
            var line = data;

            // Skip header and invalid zip data
            if (isNaN(zip) === false) {

                // Get the rate areas for the zip code
                var rateAreas = zipToRateAreaMap[zip];
                var slcsp = '';

                // Skip zip code if not a single rate area
                if (rateAreas.length == 1) {
                    var rates = rateAreaToRateMap[rateAreas[0]];

                    // If rate array is undefined there is no plan for rate area and skip
                    // If rate array length is not greater than 1 then cannot get
                    // slcsp and also skip
                    if (rates && rates.length > 1) {
                        
                        // Sort the rates annd slcsp is second value 
                        rates.sort(sortFunc);
                        slcsp = rates[1];
                        line = zip + ',' + slcsp;
                    }
                }
            }

            lines.push(line);

        }
        catch (err) {
            // Report error if something went wrong
            console.log(err);
        }

    }).on('close', function () {
        
        // Write to slcsp file with the lines calculated above and exit    
        fs.writeFile(slcspFile, lines.join('\n'), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log('Successfully generated SLCSP');
            process.exit(0);
        });
    });

}

// Sort helper to properly sort numbers
function sortFunc(a, b) {
    return a - b;
}

