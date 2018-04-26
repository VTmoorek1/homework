import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

// Your retrieve function plus any additional functions go here ...
const LIMIT = 10;

function retrieve(options) {
    return new Promise(function(resolve) {

        // Get the url with given options
        var url = buildURL(options);

        // Fetch request the records api 
        fetch(url).then(function(response) {

            if (response.ok) {
                response.json().then(function(data) {

                    // Check if there is another page with modified url and 
                    // send another fetch request
                    var checkLastUrl = URI(url);
                    var pageOffset = parseInt(checkLastUrl.search(true)['offset']) + LIMIT;
                    checkLastUrl.setSearch('offset', pageOffset);

                    fetch(checkLastUrl.toString()).then(function(response2) {

                        if (response2.ok) {
                            response2.json().then(function(data2) {

                                // Calculate previous page
                                var previousPage = null;
                                var page = null;

                                if (options) {
                                    page = options['page'];
                                }

                                if (!page || isNaN(page)) {
                                    page = 1;
                                }
                                else if (page > 1) {
                                    previousPage = page - 1;
                                }

                                // Calculate next page based of last fetch 
                                // results
                                var nextPage = null;

                                if (data2.length > 0) {
                                    nextPage = page + 1;
                                }

                                // Now that the initial and next fetch have  
                                // completed build the fetch object and resolve 
                                resolve(buildFetchObject(data, previousPage,
                                    nextPage));
                            }).catch(function(rj2Error) {
                                errorHandler('Error on response 2 json. Message= ' +
                                    rj2Error, resolve);
                            });
                        }
                        else {
                            // Response 2 failed
                            errorHandler('Error on response 2. Message= ' +
                                response2.statusText, resolve);
                        }
                    }).catch(function(f2Error) {
                        errorHandler('Error on second fetch. Message= ' +
                            f2Error, resolve);
                    });

                }).catch(function(rjError) {
                    errorHandler('Error on response json. Message= ' +
                        rjError, resolve);
                });
            }
            else {
                errorHandler('Error on response 1. Message= ' +
                    response.statusText, resolve);
            }

        }).catch(function(error) {
            errorHandler(error, resolve);
        });

    });
}

// Error handler that logs givent error text and then resolves promise with 
// null
function errorHandler(text, resolve) {
    console.log(text);
    resolve(null);
}

// Constructs a url with given options object using URI.js 
function buildURL(options) {
    var uri = URI(window.path);
    var index = 0;

    // Get 10 pages at a time
    uri.addSearch('limit', LIMIT);

    if (options) {

        // Make sure options has a page and is 1 or greater
        var page = options['page'];

        if (options.hasOwnProperty('page') && page && isNaN(page) === false &&
            page > 1) {
            index = ((page - 1) * LIMIT);
        }

        // Make sure the colors array exists and is not empty      
        var colorArr = options['colors']

        if (options.hasOwnProperty('colors') && Array.isArray(colorArr) &&
            colorArr.length > 0) {
            uri.addSearch({ 'color[]': colorArr });
        }
    }

    // Set the offset and color in query
    uri.addSearch('offset', index);

    return uri.toString();
}

// Constructs a fetch object from the response object 
// Format found in README.md
function buildFetchObject(data, previousPage, nextPage) {
    var fetchObj = {};
    var idArray = [];
    var openArray = [];
    var closedPrimaryCount = 0;

    // Only read 10 since API may return more
    var responseSliced = data.slice(0, LIMIT);

    // Visit each response object in array without using loop
    responseSliced.forEach(function(obj) {

        idArray.push(obj['id']);

        var color = obj['color'];
        var isPrimary = (color === 'red' || color === 'blue' ||
            color === 'yellow');

        // Add object to open array if disposition is open and set isPrimary
        // true if color is red, blue, or yellow
        if (obj['disposition'] === 'open') {
            obj['isPrimary'] = isPrimary;
            openArray.push(obj);
        }
        else if (isPrimary) {
            closedPrimaryCount++;
        }
    });

    // Build fetch object
    fetchObj = {
        ids: idArray,
        open: openArray,
        'closedPrimaryCount': closedPrimaryCount,
        'previousPage': previousPage,
        'nextPage': nextPage
    };

    return fetchObj;
}

export default retrieve;
