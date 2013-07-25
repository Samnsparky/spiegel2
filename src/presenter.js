/**
 * Presentation logic that renders steps of the wizard.
 *
 * Presentation logic to render steps of the wizard, move the user between steps
 * of the wizard, and carry data between those steps.
 *
 * @author A. Samuel Pottinger (CU Boulder & Gleap LLC, 2013)
**/

var handlebars = require('handlebars');

var fs_facade = require('./fs_facade');

var LATE_LOADED_JS_TEMPLATE_STR = '<script src="{{ href }}"' +
    'type="text/javascript" class="late-js-{{ type }}">';
var LATE_LOADED_CSS_TEMPLATE_STR = '<link href="{{ href }}" rel="stylesheet" ' +
    'class="late-css-{{ type }}">';

var LATE_LOADED_CSS_TEMPLATE = handlebars.compile(LATE_LOADED_CSS_TEMPLATE_STR);
var LATE_LOADED_JS_TEMPLATE = handlebars.compile(LATE_LOADED_JS_TEMPLATE_STR);

var STEP_HOLDER = '#content-holder';


function StepManager(stepInfo)
{
    this.currentStep = 0;

    this.incrementStep = function()
    {
        this.currentStep++;
    };

    this.decrementStep = function()
    {
        this.currentStep--;
    }

    this.reachedEnd = function()
    {
        return this.currentStep >= stepInfo.length;
    }

    this.getCurrentStep = function(onSuccess, onError)
    {
        if(this.reachedEnd())
            return null;

        var stepName = stepInfo[this.currentStep];
        fs_facade.getStepInfo(name, onSuccess, onError)
    }
}
var stepManager = null;


function getStepManager(onSuccess, onError)
{
    if(stepManager === null)
    {
        getLoadedStepsInfo(function(stepInfo){
            onSuccess(new StepManager(stepInfo));
        }, onError);
    }
    else
    {
        onSuccess(stepManager);
    }
}


function renderNextStep(context, onSuccess, onError)
{
    var onGetCurrentStep = function(currentStep)
    {
        if(currentStep === null)
            onError(new Error('Could not retrieve step information.'));

        renderStep(currentStep, context, onSuccess, onError);
    };

    var onGetStepManager = function(stepManager)
    {
        stepManager.incrementStep();
        
        if(stepManager.reachedEnd())
            onError(new Error('No more steps remaining.'));
        
        stepManager.getCurrentStep(onGetCurrentStep, onError);
    };

    getStepManager(onGetStepManager, onError);
}


function renderStep(currentStep, context, onSuccess, onError)
{
    var name = step.view;
    var dest = STEP_HOLDER;
    var cssFiles = step.styles;
    var jsFiles = step.scripts;
    renderTemplate(name, context, dest, cssFiles, jsFiles, onSuccess, onError);
}


/**
 * Temporary / convenience error handler that re-throws errors.
 *
 * @param {Error} error The error to re-throw.
**/
var genericErrorHandler = function(error)
{
    throw error;
};


/**
 * Render a template located outside of the application bundle.
 *
 * @param {String} name The name of the template (ex: test.html) that should be
 *      rendered.
 * @param {Object} context The key / values to use to render the template.
 * @param {String} dest The jQuery descriptor of the element whose inner HTML
 *      should be set to the rendered template.
 * @param {Array} cssFiles An array of strings with names of (interally located)
 *      css files to apply to the new template.
 * @param {Array} jsFiles An array of strings with the names of (internally
 *      located) JavaScript files to load.
 * @param {function} onError The function to call after rendring the template.
 *      This is only called if rendering was successful.
 * @param {function} onError The function to call if rendering the template was
 *      unsuccessful.
**/
function renderTemplate(name, context, dest, cssFiles, jsFiles, onSuc, onErr)
{
    var onRender = function (renderedHTML)
    {
        var cssHTML;
        var jsHTML;

        // TODO: These should be in constants with Mustache
        var safeDest = dest.replace('#', '');
        $('.late-css-' + safeDest).remove();
        $('.late-js-' + safeDest).remove();

        $(dest).hide();
        $(dest).html(renderedHTML);

        $.each(cssFiles, function (index, fileLoc)
        {
            fileLoc = fs_facade.getExternalURI(fileLoc);

            if(fileLoc === null)
            {
                onErr(new Error('Could not find ' + fileLoc + ' .'));
                return;
            }

            cssHTML = LATE_LOADED_CSS_TEMPLATE({
                'href': fileLoc,
                'type': safeDest
            }); 
            $('head').append(cssHTML);
        });

        $.each(jsFiles, function (index, fileLoc)
        {
            fileLoc = fs_facade.getExternalURI(fileLoc);

            if(fileLoc === null)
            {
                onErr(new Error('Could not find ' + fileLoc + ' .'));
                return;
            }

            jsHTML = LATE_LOADED_JS_TEMPLATE({
                'href': fileLoc,
                'type': safeDest
            });
            $('head').append(jsHTML);
        });

        $(dest).fadeIn();
    };

    var fileLoc;
    fileLoc = fs_facade.getExternalURI(name);

    if(fileLoc === null)
    {
        onErr(new Error('Could not find ' + fileLoc + ' .'));
        return;
    }
    
    fs_facade.renderTemplate(fileLoc, context, onErr, onRender);
}
