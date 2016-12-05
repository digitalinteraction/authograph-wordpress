(function() {
    tinymce.create("tinymce.plugins.authograph_button_plugin", {

        //url argument holds the absolute url of our plugin directory
        init : function(ed, url) {

            //add new button     
            ed.addButton("Authograph", {
                title : "Insert Authograph",
                cmd : "authograph_command",
                image : "https://fourcorners.io/wp-content/uploads/2016/10/fourcorners-logo-300x300.png"
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
                        console.log(uploaded_image);
                        var image_url = uploaded_image.toJSON().url;
                        // Let's assign the url value to the input field

                        var return_text = '<img data-xmp src="'+image_url+'"/>';
                        
                        
                        window.addEventListener("authograph-metadata", receiveMetadata, false);

                        function receiveMetadata(event){
                            return_text += "<h1>content</h1>";
                            ed.execCommand("mceInsertContent", 0, return_text);
                            return;
                        }
                        
                        var tb_frame = "https://digitalinteraction.github.io/fourcorners-editor/?TB_iframe=true"; //"wp-authograph-editor.php?TB_iframe=true";
                        tb_show("Authograph - Metadata Editor", tb_frame);

                        

                    });
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