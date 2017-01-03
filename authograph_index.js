(function() {
    tinymce.create("tinymce.plugins.authograph_button_plugin", {

        //url argument holds the absolute url of our plugin directory
        init : function(ed, url) {

            //add new button   


            ed.addButton("Authograph", {
                title : "Insert Authograph",
                cmd : "authograph_command",
                image : authograph_php.plugin_url+"fourcorners-logo-150x150.png"
            });

            //button functionality.
            ed.addCommand("authograph_command", function() {
                var selected_text = ed.selection.getContent();
                var image = wp.media({ 
                title: 'Upload Image',
                // mutiple: true if you want to upload multiple files at once
                multiple: false, 
                default_tab: 'upload'

                }).open()
                    .on('select', function(e){

                        // This will return the selected image from the Media Uploader, the result is an object
                        var uploaded_image = image.state().get('selection').first();
                        // We convert uploaded_image to a JSON object to make accessing it easier
                        // Output to the console uploaded_image
                        var image_url = uploaded_image.toJSON().url;
                        var image_name = uploaded_image.toJSON().filename;
                        var image_id = uploaded_image.toJSON().id;

                        var return_text = '<img data-4c="xmp_'+image_name+'" src="'+image_url+'"/>';
                        
                        
                        var tb_frame = "https://cdn.rawgit.com/digitalinteraction/fourcorners-editor/gh-pages/index.html?TB_iframe=true"; //"wp-authograph-editor.php?TB_iframe=true";
                        tb_show("Authograph - Metadata Editor", tb_frame);

                        var iframe = jQuery("iframe#TB_iframeContent")[0];
                        
                        window.addEventListener("message", receiveMetadata, false);
                        function receiveMetadata(event){
                            tb_remove();
                            var scriptData = event.data;
                            return_text += "<br /><script data-4c-meta='xmp_"+image_name+"' type='text/json'>"+scriptData+"</script>";
                            ed.execCommand("mceInsertContent", 0, return_text);
                            return;
                        }

                        jQuery.get("/wp-json/wp_authograph/metadata/"+image_id,function(data, status){
                                iframe.contentWindow.postMessage(data,"*");
                        });


                        
                    })
                });

        },

        createControl : function(n, cm) {
            return null;
        },

        getInfo : function() {
            return {
                longname : "Authograph Button",
                author : "Kyle Montague",
                version : "1"
            };
        }
    });

    tinymce.PluginManager.add("authograph_button_plugin", tinymce.plugins.authograph_button_plugin);
})();