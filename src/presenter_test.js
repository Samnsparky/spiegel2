/**
 * Unit tests for the step presenter.
 *
 * @author A. Samuel Pottinger (CU Boulder and Gleap LLC, 2013)
 * @license GNU GPL v3
**/

/* jslint node: true */

var rewire = require('rewire');

var presenter = rewire('./presenter');

presenter.__set__('fs_facade', {
    getLoadedStepsInfo: function(onSuccess, onError)
    {
        onSuccess(['step1', 'step2', 'step3']);
    },
    getStepInfo: function(stepName, onSuccess, onError)
    {
        onSuccess({'name': stepName});
    }
});


var stepManager;
exports.stepManagerTests = {
    setUp: function(callback)
    {
        stepManager = new presenter.StepManager(['step1', 'step2', 'step3']);
        callback();
    },
    testIncrementStep: function(test)
    {
        stepManager.incrementStep();
        test.equal(stepManager.getCurrentStepName(), 'step2');
        test.done();
    },
    testDecrementStep: function(test)
    {
        stepManager.setStepByNumber(2);
        stepManager.decrementStep();
        test.equal(stepManager.getCurrentStepName(), 'step2');
        test.done();
    },
    testSetStepByNumber: function(test)
    {
        stepManager.setStepByNumber(1);
        test.equal(stepManager.getCurrentStepName(), 'step2');
        test.done();
    },
    testSetStepByName: function(test)
    {
        stepManager.setStepByName('step2');
        stepManager.incrementStep();
        test.equal(stepManager.getCurrentStepName(), 'step3');
        test.done();
    },
    testReachedEnd: function(test)
    {
        stepManager.incrementStep();
        test.ok(!stepManager.reachedEnd());

        stepManager.incrementStep();
        test.ok(stepManager.reachedEnd());
        test.done();
    },
    testCheckStep: function(test)
    {
        stepManager.incrementStep();
        stepManager.incrementStep();
        test.throws(function(){
            stepManager.incrementStep();
        });
        test.done();
    }
};


exports.testGetStepManager = function(test)
{
    var stepManager = presenter.getStepManager(function(stepManager){
        test.equal(stepManager.getCurrentStepName(), 'step1');
        stepManager.incrementStep();

        presenter.getStepManager(function(stepManager){
            test.equal(stepManager.getCurrentStepName(), 'step2');
            test.done();
        }, presenter.genericErrorHandler);

    }, presenter.genericErrorHandler);
};


exports.testRenderNextStep = function(test)
{
    var originalRenderStep = presenter.renderStep;
    var originalGetStepManager = presenter.getStepManager;
    var lastStep;
    var lastContext;
    presenter.renderStep = function(step, context, onSuccess, onError)
    {
        lastStep = step;
        lastContext = context;
        onSuccess();
    };
    presenter.getStepManager = function(onSuccess, onError)
    {
        onSuccess(new presenter.StepManager(['step1', 'step2']));
    };

    var testContext = {'test1': 1, 'test2': 2};

    presenter.renderNextStep(
        testContext,
        function(){
            test.equal(lastStep.name, 'step2');
            test.equal(lastContext, testContext);
            presenter.renderStep = originalRenderStep;
            presenter.getStepManager = originalGetStepManager;
            test.done();
        },
        presenter.genericErrorHandler
    );
};
