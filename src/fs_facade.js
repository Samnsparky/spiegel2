/**
 * Convienece wrapper around file system and path manipulation operations.
 *
 * @author A. Samuel Pottinger (CU Boulder and Gleap LLC, 2013)
**/

/*jslint node: true */

var fs = require('fs');
var path = require('path');

var handlebars = require('handlebars');

var STEPS_DIR = 'steps';
var STEP_DESC_FILENAME = 'step.json';
var STEPS_DESC_FILENAME = 'steps.json';

var EXTERNAL_RESOURCES_DIR = 'steps';


/**
 * Get the full location (URI) for a resource not bundled with the application.
 *
 * Get the full URI or location for a resource that is not bundled with the
 * application executable. This should be used for late loaded steps.
 *
 * @param {String} fullResourceName The name of the resource to resolve.
 * @return {String} The fully resolved URI or null if it could not be resolved.
**/
exports.getExternalURI = function(fullResourceName)
{
    var resourceNamePieces = fullResourceName.split('/');
    var stepName = resourceNamePieces[0];
    var resourceName = resourceNamePieces[1];
    var parentDir = exports.getParentDir();
    return path.join(parentDir, EXTERNAL_RESOURCES_DIR, stepName,
        resourceName);
};


/**
 * Get the directory that the executable is being run out of.
 *
 * @return {string} The full path to the directory that this executable is being
 *      run out of.
**/
exports.getParentDir = function()
{
    var pathPieces = path.dirname(process.execPath).split(path.sep);
    
    var cutIndex;
    var numPieces = pathPieces.length;
    for(cutIndex=0; cutIndex<numPieces; cutIndex++)
    {
        if(pathPieces[cutIndex].indexOf('.app') != -1)
            break;
    }

    return pathPieces.slice(0, cutIndex).join(path.sep);
};


/**
 * Render a Handlebars template.
 *
 * @param {String} location The location of the template to render.
 * @param {Object} context The context to render the template with.
 * @param {function} onError The function to call if an error is encountered
 *      while rendering the template. Should take a single argument which
 *      would be the error.
 * @param {function} onSuccess The function to call after the template is
 *      successfully rendered. Should take a single argument which would
 *      be the String rendred html.
**/
exports.renderTemplate = function(location, context, onError, onSuccess)
{
    fs.exists(location, function(exists)
    {
        if(exists)
        {
            fs.readFile(location, 'utf8',
                function (error, template)
                {
                    if (error)
                    {
                        onError(error);
                    }
                    else
                    {
                        onSuccess(handlebars.compile(template)(context));
                    }
                }
            );
        }
        else
        {
            onError(new Error('Template ' + location + ' could not be found.'));
        }
    });
};


/**
 * Get information about a specific step.
 *
 * Get the standard information about a specific step that the user has
 * already downloaded. Does not query any remote repositories.
 *
 * @param {String} name The name of the step to query.
 * @param {function} onSuccess The function to call with the step information
 *      after it is loaded.
 * @param {function} onError The function to call if the step is not found
 *      or could not otherwise be quieried.
**/
exports.getStepInfo = function(name, onSuccess, onError)
{
    var stepDir = path.join(exports.getParentDir(), STEPS_DIR);
    var stepsDescriptorSrc = path.join(stepDir, name,
        STEP_DESC_FILENAME);

    fs.exists(stepsDescriptorSrc, function(exists)
    {
        if(exists)
        {
            fs.readFile(stepsDescriptorSrc, 'utf8',
                function (error, contents)
                {
                    if (error)
                    {
                        onError(error);
                    }
                    else
                    {
                        onSuccess(JSON.parse(contents));
                    }
                }
            );
        }
        else
        {
            var error = new Error(
                'Could not find steps info at ' + stepsDescriptorSrc + '.'
            );
            onError(error);
        }
    });
};


/**
 * Get information about the steps the user has installed for Spiegel.
 *
 * @param {function} onError The function to call if an error is encountered
 *      while reading step information.
 * @param {function} onSuccess The function to call after the step information
 *      is loaded. Should take one argument: an Array of Object with step
 *      information.
**/
exports.getLoadedStepsInfo = function(onError, onSuccess)
{
    var stepDir = path.join(exports.getParentDir(), STEPS_DIR);
    var stepsDescriptorSrc = path.join(stepDir, STEPS_DESC_FILENAME);

    fs.exists(stepsDescriptorSrc, function(exists)
    {
        if(exists)
        {
            fs.readFile(stepsDescriptorSrc, 'utf8',
                function (error, contents)
                {
                    if (error)
                    {
                        onError(error);
                    }
                    else
                    {
                        onSuccess(JSON.parse(contents));
                    }
                }
            );
        }
        else
        {
            var error = new Error(
                'Could not find steps info at ' + stepsDescriptorSrc + '.'
            );
            onError(error);
        }
    });
};


/**
 * Convienence function to get and decode a JSON file.
 *
 * @param {String} location The full path of the JSON file to load.
 * @param {function} onError The function to call if an error is encountered
 *      while reading this JSON file.
 * @param {function} onSuccess The funciton to call after the JSON has been
 *      successfully loaded. The only function parameter should be for the Array
 *      or Object loaded.
**/
exports.getJSON = function(location, onError, onSuccess)
{
    fs.exists(location, function(exists)
    {
        if(exists)
        {
            fs.readFile(location, 'utf8',
                function (error, contents)
                {
                    if (error)
                    {
                        onError(error);
                    }
                    else
                    {
                        onSuccess(JSON.parse(contents));
                    }
                }
            );
        }
        else
        {
            var error = new Error(
                'Could not find JSON at ' + location + '.'
            );
            onError(error);
        }
    });
};
