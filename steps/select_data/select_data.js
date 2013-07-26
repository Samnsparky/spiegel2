var MODULE_RESOURCES_PREFIX = 'select_data/';
var FORMAT_CONTROLS_DEST = '#format-options-pane';


function showFormatControls(formatName)
{
    var viewLoc = MODULE_RESOURCES_PREFIX + formatName + '.html';
    var cssLoc = MODULE_RESOURCES_PREFIX + formatName + '.css';
    var jsLoc = MODULE_RESOURCES_PREFIX + formatName + '.js';
    renderTemplate(viewLoc, {}, FORMAT_CONTROLS_DEST, [cssLoc], [jsLoc]);
}


$('#select-data-step').ready(function(){
    var defaultFormat = $('.default-format')[0].id.replace('-selector', '');
    showFormatControls(defaultFormat);
});


function chooseFile(name)
{
    var chooser = $(name);
    chooser.change(function(evt) {
        console.log($(this).val());
    });

    chooser.trigger('click');  
}
