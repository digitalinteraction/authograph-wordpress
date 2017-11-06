(function () {
    const VERSION = 1;
    tinymce.create("tinymce.plugins.authograph_button_plugin", {

        //url argument holds the absolute url of our plugin directory
        init: function (ed, url) {

            //add new button   
            ed.addButton("Authograph", {
                title: "Insert Four Corners",
                cmd: "authograph_command",
                image: authograph_php.plugin_url + "fourcorners-logo-150x150.png"
            });

            //button functionality.
            ed.addCommand("authograph_command", function () {
                //var selected_text = ed.selection.getContent();
                var selected_element = ed.selection.getNode();
                var selected_tag, data_elements;
                if (selected_element != null && selected_element.getAttribute('data-4c') != null) {
                    selected_tag = selected_element.getAttribute('data-4c');
                    data_elements = (find_script_metadata(selected_tag) || find_attribute_metadata(selected_tag));
                }

                if (data_elements)
                    edit_4c_image();
                else
                    create_new_image();


                function edit_4c_image() {
                    var image_url = selected_element.getAttribute('src');
                    var image_name = selected_tag;
                    var iframe = loadFrame(image_name, image_url);

                    jQuery("iframe#TB_iframeContent").load(function () {
                        var obj = data_elements.data;
                        obj.url = image_url;
                        obj.version = VERSION;
                        obj.type = "data";
                        iframe.contentWindow.postMessage(JSON.stringify(obj), "*");
                    });
                }

                function create_new_image() {
                    var image = wp.media({
                        title: 'Upload Image',
                        multiple: false,
                        default_tab: 'upload'

                    }).open()
                        .on('select', function (e) {

                            // This will return the selected image from the Media Uploader, the result is an object
                            var uploaded_image = image.state().get('selection').first();
                            // We convert uploaded_image to a JSON object to make accessing it easier
                            // Output to the console uploaded_image
                            var image_url = uploaded_image.toJSON().url;
                            var image_name = uploaded_image.toJSON().filename;
                            var image_id = uploaded_image.toJSON().id;
                            var script_element = find_script_metadata('xmp_' + image_name);

                            var iframe = loadFrame(image_name, image_url);

                            //get pre-existing metadata from the image using wordpress api
                            jQuery.get("/wp-json/wp_authograph/metadata/" + image_id, function (data, status) {
                                var obj = (script_element && script_element.el && script_element.el.length > 0) ? JSON.parse(jQuery(urldecode(script_element.el[0].getAttribute('data-wp-preserve'))).html()) : JSON.parse(data);
                                obj.url = image_url;
                                obj.version = VERSION;
                                obj.type = "data";
                                iframe.contentWindow.postMessage(JSON.stringify(obj), "*");
                            });
 
                            
                        })
                }

                function find_script_metadata(tag) {
                    var data_elements = {};
                    var script_elements = [];
                    var script_array = ed.dom.select('img.mce-object[alt="<script>"]')
                    script_array.forEach(function (script) {
                        if (jQuery(urldecode(script.getAttribute('data-wp-preserve'))).attr('data-4c-meta') == tag) {
                            script_elements.push(script);
                        }
                    });
                    if (script_array.length > 0) {
                        data_elements.data = JSON.parse(jQuery(urldecode(script_elements[0].getAttribute('data-wp-preserve'))).html());
                        data_elements.el = script_elements;
                        return data_elements;
                    } else
                        return;
                }

                function find_attribute_metadata(tag) {
                    var data_elements = {};
                    img_elements = ed.dom.select('img[data-4c="' + tag + '"][data-4c-metadata]');
                    if (img_elements.length == 0) return;
                    img_elements.forEach(function (el) {
                        if (el.getAttribute('data-4c-metadata')) {
                            data_elements.data = JSON.parse(decodeURI(el.getAttribute('data-4c-metadata')));
                            return;
                        }
                    });
                    data_elements.el = img_elements;
                    return data_elements;
                }

                function urldecode(url) {
                    return decodeURIComponent(url.replace(/\+/g, ' '));
                }

                function loadFrame(image_name, image_url) {
                    //display editor
                    var tb_frame = authograph_php.plugin_url + "/editor/?TB_iframe=true";
                    tb_show("Four Corners - Metadata Editor", tb_frame);
                    var iframe = jQuery("iframe#TB_iframeContent")[0];

                    var tb_unload_count = 1;
                    jQuery(window).bind('tb_unload', function () {
                        if (tb_unload_count > 1) {
                            tb_unload_count = 1;
                        } else {
                            window.removeEventListener("message", receiveMetadata); tb_unload_count = tb_unload_count + 1;
                        }
                    });

                    //register event listener for getting resulting data from editor
                    window.addEventListener("message", receiveMetadata, false);
                    function receiveMetadata(event) {
                        var data = JSON.parse(event.data);
                        if (data.type == "imageRequest") {
                            var image = wp.media({
                                title: 'Select Image',
                                multiple: false,
                                default_tab: 'upload'

                            }).open()
                                .on('select', function (e) {
                                    var selected_image = image.state().get('selection').first();
                                    var obj = {};
                                    obj.index = data.index;
                                    obj.url = selected_image.toJSON().url;
                                    obj.type = "imageResponse";
                                    iframe.contentWindow.postMessage(JSON.stringify(obj), "*");
                                });
                        } else /* if (data.type == "data") */ {
                            tb_remove();
                            window.removeEventListener("message", receiveMetadata);
                            var scriptData = event.data;
                            var stripped_image_name = (image_name.substr(0,4) == "xmp_") ? image_name.substr(4) : image_name;
                            var return_text = '<img data-4c="xmp_' + stripped_image_name + '" src="' + image_url + '" data-4c-metadata="'+ encodeURI(scriptData) +'"/>';
                            var similar_images = ed.dom.select('img[data-4c="'+ image_name +'"]');
                            similar_images.forEach(function(img){
                                img.setAttribute('data-4c', 'xmp_' + stripped_image_name);
                                img.setAttribute('data-4c-metadata', encodeURI(scriptData));
                            });
                            remove_script_tags(image_name);
                            ed.execCommand("mceInsertContent", 0, return_text);
                        }  
                        return;
                    }

                    return iframe;
                }

                function remove_script_tags(tag) {
                    var scriptArray = ed.dom.select('img.mce-object[alt="<script>"]')
                    scriptArray.forEach(function (script) {
                        if (jQuery(urldecode(script.getAttribute('data-wp-preserve'))).attr('data-4c-meta') == tag) {
                            script.remove();
                        }
                    });
                }
            });

        },

        createControl: function (n, cm) {
            return null;
        },

        getInfo: function () {
            return {
                longname: "Four Corners Button",
                author: "Tom Bartindale",
                version: "1"
            };
        }
    });

    tinymce.PluginManager.add("authograph_button_plugin", tinymce.plugins.authograph_button_plugin);
})();
