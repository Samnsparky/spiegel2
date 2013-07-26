/**
 * Unit tests for the file system facade.
 *
 * @author A. Samuel Pottinger (CU Boulder and Gleap LLC, 2013)
 * @license GNU GPL v3
**/

var rewire = require('rewire');

var fs_facade = rewire('./fs_facade');

var EXTERNAL_RESOURCES_DIR = fs_facade.__get__('EXTERNAL_RESOURCES_DIR');
var STEPS_DIR = fs_facade.__get__('STEPS_DIR');
var STEP_DESC_FILENAME = fs_facade.__get__('STEP_DESC_FILENAME');


var originalGetParentDir;
var mockExistsRetVal = false;
var lastMockExistsLocation = null;
var mockReadFileRetVal = '';
var lastMockReadFileLocation = null;
fs_facade.__set__('fs', {
    exists: function(location, onSuccess)
    {
        lastMockExistsLocation = location;
        onSuccess(mockExistsRetVal);
    },
    readFile: function(location, encoding, onSuccess)
    {
        lastMockReadFileLocation = location;
        onSuccess(null, mockReadFileRetVal);
    }
});


exports.fsFacadeTests = {

    testGetExternalURI: function(test)
    {
        var testPath = fs_facade.getExternalURI('testName/resourceName.json');
        testPath = testPath.replace('\\', '/');

        var expectedPath = '/parent_dir/';
        expectedPath = expectedPath + EXTERNAL_RESOURCES_DIR;
        expectedPath = expectedPath + '/testName/resourceName.json';
        test.equal(testPath, expectedPath);

        test.done();
    },


    testRenderTemplate: function(test)
    {
        mockExistsRetVal = true;
        mockReadFileRetVal = 'test 1 = {{test1}}, test 2 = {{test2}}';
        fs_facade.renderTemplate(
            'test_location',
            {'test1': 1, 'test2': 2},
            function(err){throw err;},
            function(retVal){
                test.equal(retVal, 'test 1 = 1, test 2 = 2');
                test.equal(lastMockReadFileLocation, 'test_location');
                test.done();
            }
        );
    },


    testRenderTemplateNonExists: function(test)
    {
        mockExistsRetVal = false;
        mockReadFileRetVal = 'test 1 = {{test1}}, test 2 = {{test2}}';
        fs_facade.renderTemplate(
            'test_location',
            {'test1': 1, 'test2': 2},
            function(err){
                test.done();
            },
            function(retVal){}
        );
    },


    testGetStepInfo: function(test)
    {
        var expectedPath = '/parent_dir/';
        expectedPath = expectedPath + STEPS_DIR;
        expectedPath = expectedPath + '/test_name/';
        expectedPath = expectedPath + STEP_DESC_FILENAME;

        var expectedRetVal = {"test1": 5, "test2": 10};

        mockExistsRetVal = true;
        mockReadFileRetVal = '{"test1": 5, "test2": 10}';

        fs_facade.getStepInfo(
            'test_name',
            function(result)
            {
                test.equal(result.test1, 5);
                test.equal(result.test2, 10);

                test.equal(lastMockExistsLocation, expectedPath);
                test.equal(lastMockReadFileLocation, expectedPath);

                test.done();
            },
            function(err) {throw err;}
        );
    },


    testGetStepInfoNonExists: function(test)
    {
        var expectedPath = '/parent_dir/';
        expectedPath = expectedPath + STEPS_DIR;
        expectedPath = expectedPath + '/test_name/';
        expectedPath = expectedPath + STEP_DESC_FILENAME;

        mockExistsRetVal = false;

        fs_facade.getStepInfo(
            'test_name',
            function(result) {},
            function(err) {
                test.equal(lastMockExistsLocation, expectedPath);
                test.done();
            }
        );
    },


    testGetLoadedStepsInfo: function(test)
    {
        var expectedPath = '/parent_dir/';
        expectedPath = expectedPath + STEPS_DIR;
        expectedPath = expectedPath + '/test_name/';
        expectedPath = expectedPath + STEP_DESC_FILENAME;

        test.done();
    },


    setUp: function(callback)
    {
        originalGetParentDir = fs_facade.getParentDir;
        fs_facade.getParentDir = function()
        {
            return '/parent_dir';
        };

        callback();
    },


    tearDown: function(callback)
    {
        fs_facade.getParentDir = originalGetParentDir;
        callback();
    }

};
