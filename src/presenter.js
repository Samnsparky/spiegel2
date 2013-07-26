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
var OS_INDEP_SEP = '/';

var STEP_HOLDER = '#content-holder';


/**
 * Statuful object that manages the progress of the user through the wizard.
 *
 * State machine / facade indicating which step the user is currently on, a
 * statful Object that also provides access to the current step's information.
 *
 * @param {Array} stepInfo Array of String, each with the name of a step. This
 *      Array should have steps in the order in which the user will complete
 *      them.
**/
function StepManager(stepInfo)
{
    this.currentStep = 0;

    this.stepInfo = stepInfo;

    /**
     * Indicate that the user has moved to the next step.
     *
     * @throws Error thrown if the user reaches an invalid step.
    **/
    this.incrementStep = function()
    {
        this.currentStep++;
        this.checkStep();
    };

    /**
     * Indicate that the user has moved backwards a single step.
     *
     * @throws Error thrown if the user reaches an invalid step.
    **/
    this.decrementStep = function()
    {
        this.currentStep--;
        this.checkStep();
    };

    /**
     * Indicate that the user has gone to the given step.
     *
     * @param {Number} stepNum An integer indicating the index of the step that
     *      the user has reached.
     * @throws Error thrown if the user was moved to an invalid step.
    **/
    this.setStepByNumber = function(stepNum)
    {
        this.currentStep = stepNum;
        this.checkStep();
    };

    /**
     * Indicate that the user has gone to the given step.
     *
     * @param {String} stepName A String indicating the name of the step that
     *      the user has gone to.
     * @throws Error thrown if the user was moved to an invalid or unrecognized
     *      step.
    **/
    this.setStepByName = function(stepName)
    {
        this.currentStep = stepInfo.indexOf(stepName);
        this.checkStep();
    };

    /**
     * Determines if the user has reached or passed the end of the wizard.
     *
     * @return {Boolean} true if the user has reached or passed the end of the
     *      wizard and false otherwise.
    **/
    this.reachedEnd = function()
    {
        return this.currentStep >= (stepInfo.length-1);
    };

    /**
     * Get information about the step that the user is currently on.
     *
     * @param {function} onSuccess The function to call after the current step's
     *      information is loaded. Should take a single paramter: an Object
     *      with step information.
     * @param {function} onError The function to call if an error is encountered
     *      while loading step information. However, null is passed if the user
     *      has reached the end of the wizard or is on an invalid step.
    **/
    this.getCurrentStep = function(onSuccess, onError)
    {
        if(!this.onValidStep())
            onSuccess(null);

        var stepName = stepInfo[this.currentStep];
        fs_facade.getStepInfo(stepName, onSuccess, onError);
    };

    this.getCurrentStepName = function()
    {
        return stepInfo[this.currentStep];
    };

    /**
     * Verify that the user is on a valid / recognized step.
     *
     * Verify that this state machine is in a valid state, namely that the user
     * is reported to be on a valid and recognized step.
     *
     * @throws Error thrown if the user is on an invalid or unrecognized step.
    **/
    this.checkStep = function()
    {
        if(!this.onValidStep())
        {
            throw new Error(
                'User reached invalid step (' + this.currentStep + ')'
            );
        }
    };

    /**
     * Verify that the user is on a valid / recognized step.
     *
     * Verify that this state machine is in a valid state, namely that the user
     * is reported to be on a valid and recognized step.
     *
     * @return {Boolean} true if on valid step and false otherwise
    **/
    this.onValidStep = function()
    {
        return this.currentStep >= 0 && this.currentStep < stepInfo.length;
    };

}
var stepManager = null;


/**
 * Get a singleton with information about the wizard steps.
 *
 * @param {function} onSuccess Function to call after the step manager has been
 *      loaded. Should take a single argument for the Object StepManager.
 * @param {function} onError Function to call if an error is enountered while
 *      loading the step manager.
**/
function getStepManager(onSuccess, onError)
{
    if(stepManager === null)
    {
        fs_facade.getLoadedStepsInfo(function(stepInfo){
            stepManager = new exports.StepManager(stepInfo);
            onSuccess(stepManager);
        }, onError);
    }
    else
    {
        onSuccess(stepManager);
    }
}


/**
 * Render the next step in the wizard.
 *
 * @param {Object} context Object to render the step's handlebars template with.
 * @param {function} onSuccess The function to call after the step is
 *      successfully rendered. Should take no arguments and may be null.
 * @param {function} onError The function to call if an error is encountered
 *      during rendering.
**/
function renderNextStep(context, onSuccess, onError)
{
    var onGetCurrentStep = function(currentStep)
    {
        if(currentStep === null)
            onError(new Error('Could not retrieve step information.'));

        exports.renderStep(currentStep, context, onSuccess, onError);
    };

    var onGetStepManager = function(stepManager)
    {
        if(stepManager.reachedEnd())
            onError(new Error('No more steps remaining.'));

        stepManager.incrementStep();
        
        stepManager.getCurrentStep(onGetCurrentStep, onError);
    };

    exports.getStepManager(onGetStepManager, onError);
}


/**
 * Render the current step in the wizard.
 *
 * @param {Object} context Object to render the step's handlebars template with.
 * @param {function} onSuccess The function to call after the step is
 *      successfully rendered. Should take no arguments and may be null.
 * @param {function} onError The function to call if an error is encountered
 *      during rendering.
**/
function renderCurrentStep(context, onSuccess, onError)
{
    var onGetCurrentStep = function(currentStep)
    {
        if(currentStep === null)
        {
            var msg = 'Could not retrieve step information.';
            onError(new Error(msg));
        }

        exports.renderStep(currentStep, context, onSuccess, onError);
    };

    var onGetStepManager = function(stepManager)
    {
        stepManager.getCurrentStep(onGetCurrentStep, onError);
    };

    exports.getStepManager(onGetStepManager, onError);
}


/**
 * Render / display a step.
 *
 * @param {Object} step Object about the step. Should have a string view for
 *      the name of the HTML file to render, array of string for the css files
 *      to include, and an array of string for the JavaScript files to include.
 * @param {Object} context Object with values to render the step's handlebars
 *      template with.
 * @param {function} onSuccess The function to call after the step is loaded.
 *      Should take no arguments and may be null.
 * @param {function} onError The function to call if an error is encountered
 *      while rendering the step.
**/
function renderStep(step, context, onSuccess, onError)
{
    var name = step.name;
    var view = name + OS_INDEP_SEP + step.view;
    var dest = STEP_HOLDER;
    
    var cssFiles = step.styles.map(function(style){
        return name + OS_INDEP_SEP + style;
    });
    
    var jsFiles = step.scripts.map(function(script){
        return name + OS_INDEP_SEP + script;
    });
    
    renderTemplate(view, context, dest, cssFiles, jsFiles, onSuccess, onError);
}


/**
 * Temporary / convenience error handler that re-throws errors.
 *
 * @param {Error} error The error to re-throw.
**/
function genericErrorHandler(error)
{
    throw error;
}


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
 *      This is only called if rendering was successful. May be null and should
 *      take no arguments.
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

        $(dest).fadeIn(function(){
            if(onSuc !== null)
                onSuc();
        });
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


if(typeof window === 'undefined')
{
    exports.StepManager = StepManager;
    exports.getStepManager = getStepManager;
    exports.renderNextStep = renderNextStep;
    exports.renderCurrentStep = renderCurrentStep;
    exports.renderStep = renderStep;
    exports.genericErrorHandler  = genericErrorHandler;
}
else
{
    exports = {};
    exports.StepManager = StepManager;
    exports.getStepManager = getStepManager;
    exports.renderNextStep = renderNextStep;
    exports.renderCurrentStep = renderCurrentStep;
    exports.renderStep = renderStep;
    exports.genericErrorHandler  = genericErrorHandler;
}
