var layers = {
    'skin': {'label':'Skin', 'default_img': 'items/outline.png'},
    'hair': {'label':'Hair'},
    'facial-hair': {'label':'Facial Hair'},
    'shirt': {'label':'Shirt'},
    'jacket': {'label':'Jacket'},
    'glasses': {'label':'Glasses'},
    'accessories': {'label':'Accessories', 'multiple':true},
    'backgrounds': {'label':'Backgrounds'}
};
var draw_order = ['backgrounds','skin','shirt','jacket','hair','facial-hair','glasses','accessories'];

$(document).ready(function() {
    var canvas = $('#eightbitpic canvas')[0];
    var drawing_context = canvas.getContext('2d');
    $(canvas).bind('dragstart', function(e) {
        e.originalEvent.dataTransfer.effectAllowed = 'all';
        e.originalEvent.dataTransfer.setData("DownloadURL","image/png:8bitprofilepic.png:"+canvas.toDataURL("image/png"));
        e.originalEvent.dataTransfer.setData("text/html",'<img src="'+canvas.toDataURL("image/png")+'" />');
        e.originalEvent.dataTransfer.setData("uri",canvas.toDataURL("image/png"));
    });
    $(canvas).bind('dragover dragenter', function(e) {
        e.preventDefault();
    });
    $(canvas).bind('drop', function(e) {
        e.stopPropagation();
        var id = e.originalEvent.dataTransfer.getData('text').split(' ');
        var layer = layers[id[0]];
        var item = layer.items[id[1]];
        if (!layer.multiple) {
            for (i in layer.items) {
                layer.items[i].selected = false;
                layer.items[i].tab_item.classList.remove('selected');
            }
        }
        item.selected = true;
        item.tab_item.classList.add('selected');
        redraw();
        return false;
    });    
    
    function redraw() {
        canvas.width = canvas.width; //clear canvas
        for (i in draw_order) {
            var layer = layers[draw_order[i]];
            var selected_items = 0;
            for (j in layer.items) {
                var item = layer.items[j];
                if(item.selected) {
                    selected_items++;
                    if(item.image && item.image.loaded) {
                        drawing_context.drawImage(item.image, 0, 0);
                    } else {
                        $(item.image).bind('load',function() {
                            redraw();
                        });
                        return;
                    }
                }
            }
            if (selected_items == 0 && layer.default_img && layer.default_img.loaded) {
                drawing_context.drawImage(layer.default_img, 0, 0);
            }
        }
    }
    
    function reset() {
        for (key in layers) {
            for (i in layers[key].items) {
                layers[key].items[i].selected = false;
                $(layers[key].items[i].tab_item).removeClass('selected');
            }
        }
    }
    
    function makeThumb(canvas, size) {
        var thumb_canvas = document.createElement('canvas');
        var thumb_context = thumb_canvas.getContext('2d');
        thumb_canvas.width = thumb_canvas.height = size;
        thumb_context.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size, size);
        return thumb_canvas.toDataURL('image/png');
    }
    
    var tabs = $('#tabs').tabs();
    $(function(){
        tabs.find('.ui-tabs-nav > *').addClass('ui-corner-top ui-corner-bottom');
    });
    for (key in layers) {
        var tab = document.createElement('section');
        tab.id = 'tab_'+key;
        layers[key].tab = tab;
        tabs.append(tab);
        tabs.tabs('add', '#tab_'+key, layers[key].label);
        
        if (layers[key].default_img) {
            var img = new Image();
            img.src = layers[key].default_img;
            $(img).bind('load', function(e) {
                this.loaded = true;
                redraw();
            });
            layers[key].default_img = img;
        }
        
        $.getJSON('items/' + key + '/index.json', function(key) {
            return function(data) {
                var defaultColour = null;
                var colourBoxes = '';
                layers[key].items = {};
                if (data.colours) {
                    layers[key].colours = data.colours;
                    colourBoxes = '<div class="colours">';
                    for (colour in data.colours) {
                        if(!defaultColour) defaultColour = colour;
                        colourBoxes += '<span class="colour_box" data-colour="'+colour+'" " style="background-color: '+data.colours[colour]+'"></span>';
                    }
                    colourBoxes += '</div>';
                }
                for (i in data.items) {
                    var item_name = data.items[i];
                    var tab_item = document.createElement('div');
                    var colourSuffix = (defaultColour) ? '_' + defaultColour : '';
                    tab_item.classList.add('tab_item');
                    tab_item.draggable = 'true';
                    //tab_item.title = item_name;
                    tab_item.innerHTML = '<img draggable="false" src="items/models/'+key+'/'+item_name+colourSuffix+'.png" id="'+key+'_'+data.items[i]+'" />'+colourBoxes;
                    layers[key].items[item_name] = {
                        tab_item: tab_item,
                    };
                    if (defaultColour) {
                        layers[key].items[item_name].selected_colour = defaultColour;
                    }
                    $(tab_item).find('.colour_box').bind('click', function(key, item_name) {
                        return function(e) {
                            e.stopPropagation();
                            layers[key].items[item_name].selected_colour = this.dataset.colour;
                            layers[key].items[item_name].image = new Image();
                            layers[key].items[item_name].image.src = 'items/'+key+'/'+item_name+'_'+this.dataset.colour+'.png';
                            $(layers[key].items[item_name].image).bind('load', function(e) {
                                this.loaded = true;
                            });
                            $(layers[key].items[item_name].tab_item).find('img').attr('src','items/models/'+key+'/'+item_name+'_'+this.dataset.colour+'.png');
                            redraw();
                        }
                    }(key, item_name));
                    $(tab_item).bind('click', function(key, item_name, colourSuffix) {
                        return function(e) {
                            if (layers[key].items[item_name].selected) {
                                layers[key].items[item_name].selected = false;
                                layers[key].items[item_name].tab_item.classList.remove('selected');
                            } else {
                                if (!layers[key].items[item_name].image) {
                                    layers[key].items[item_name].image = new Image();
                                    layers[key].items[item_name].image.src = 'items/'+key+'/'+item_name+colourSuffix+'.png';
                                    $(layers[key].items[item_name].image).bind('load', function(e) {
                                        this.loaded = true;
                                    });
                                }
                                if (!layers[key].multiple) {
                                    for (i in layers[key].items) {
                                        layers[key].items[i].selected = false;
                                        layers[key].items[i].tab_item.classList.remove('selected');
                                    }
                                }
                                layers[key].items[item_name].selected = true;
                                layers[key].items[item_name].tab_item.classList.add('selected');
                            }
                            redraw();
                        }
                    }(key, item_name, colourSuffix));
                    $(tab_item).bind('dragstart', function(key, item_name, colourSuffix) {
                        return function(e) {
                            if (!layers[key].items[item_name].image) {
                                layers[key].items[item_name].image = new Image();
                                layers[key].items[item_name].image.src = 'items/'+key+'/'+item_name+colourSuffix+'.png';
                                $(layers[key].items[item_name].image).bind('load', function(e) {
                                    this.loaded = true;
                                });
                            }
                            e.originalEvent.dataTransfer.setDragImage($(layers[key].items[item_name].tab_item).find('img')[0], 0, 0);
                            e.originalEvent.dataTransfer.setData('text/html', layers[key].items[item_name].image.outerHTML);
                            e.originalEvent.dataTransfer.setData('text/plain', (key+' '+item_name+' '+colourSuffix).trim());
                            e.originalEvent.dataTransfer.effectAllowed = 'copy';
                        }
                    }(key, item_name, colourSuffix));
                    $(layers[key].tab).append(tab_item);
                }
            }
        }(key));
    }

    $('#btn_new').click(function(e) {
        e.preventDefault();
        reset();
        redraw();
    });

    $('#btn_open').click(function(e) {
        e.preventDefault();
        var html = '';
        var saves = JSON.parse(localStorage.saves);
        for (i in saves) {
            html += '<img src="' + saves[i].thumb + '" width="100" height="100" title="'+ saves[i].title + '" data-save-id="'+i+'" class="save_thumb" />';
        }        
        
        var dialog = document.createElement('div');
        dialog.setAttribute('title','Open Pic');
        dialog.id = 'open_dialog';
        dialog.innerHTML = html;
        $(dialog).find('.save_thumb').click(function(e) {
            $(dialog).find('.save_thumb').removeClass('selected');
            $(this).addClass('selected');
        });
        $('body').append(dialog);
        $(dialog).dialog({
            modal: true,
            height: 'auto',
            width: 'auto',
            buttons: {
                "Open": function() {    
                    if ($(this).find('.save_thumb.selected').length) {
                        var saves = JSON.parse(localStorage.saves);
                        var data = saves[$(this).find('.save_thumb.selected').attr('data-save-id')];
                        reset();
                        for (i in data.items) {
                            var item = data.items[i].split('_');
                            var colourSuffix = '';
                            if (item[2]) {
                                colourSuffix = '_' + item[2];
                                layers[item[0]].items[item[1]].selected_colour = item[2];
                            }
                            layers[item[0]].items[item[1]].selected = true;
                            layers[item[0]].items[item[1]].image = new Image();
                            layers[item[0]].items[item[1]].image.src = 'items/'+item[0]+'/'+item[1]+colourSuffix+'.png';
                            $(layers[item[0]].items[item[1]].image).bind('load', function(e) {
                                this.loaded = true;
                            });
                            $(layers[item[0]].items[item[1]].tab_item).find('img').attr('src','items/models/'+item[0]+'/'+item[1]+colourSuffix+'.png');
                            $(layers[item[0]].items[item[1]].tab_item).addClass('selected');
                        }
                        redraw();
                        $(this).dialog('close');
                    }               
                }, 
                "Delete": function() {
                    if ($(this).find('.save_thumb.selected').length) {
                        var saves = JSON.parse(localStorage.saves);
                        saves.splice($(this).find('.save_thumb.selected').attr('data-save-id'),1);
                        localStorage.saves = JSON.stringify(saves);
                        var html = '';
                        for (i in saves) {
                            html += '<img src="' + saves[i].thumb + '" width="100" height="100" title="'+ saves[i].title + '" data-save-id="'+i+'" class="save_thumb" />';
                        }        
                        $(this).html(html);
                        $(this).find('.save_thumb').click(function(e) {
                            $(dialog).find('.save_thumb').removeClass('selected');
                            $(this).addClass('selected');
                        });
                        $(this).dialog('option','height','auto');
                        $(this).dialog('option','width','auto');
                    }
                },
                "Cancel": function() {
                    $(this).dialog('close');
                }
            },
            close: function() {
                $(this).dialog('destroy');
                $('#open_dialog').remove();
            }
        })
    });
    
    $('#btn_save').click(function(e) {
        e.preventDefault();
        var saveData = {items: [], thumb: makeThumb(canvas, 100)};
        for (layer in layers) {
            for (item in layers[layer].items) {
                if (layers[layer].items[item].selected) {
                    var colourSuffix = (layers[layer].items[item].selected_colour) ? ('_'+layers[layer].items[item].selected_colour) : '';
                    saveData.items.push(layer+'_'+item+colourSuffix);
                }
            }
        }
        
        var dialog = document.createElement('div');
        dialog.setAttribute('title','Save Pic');
        dialog.id = 'save_dialog';
        dialog.innerHTML = '<img src="'+saveData.thumb+'" width="100" height="100" style="float:left;" /><label>Title: <input id="save_title" /></label>';
        $('body').append(dialog);
        $(dialog).dialog({
            modal: true,
            buttons: {
                "Save": function() {
                    saveData.title = $('#save_title').val();
                
                    var saves = [];
                    if (localStorage.saves) {
                        saves = JSON.parse(localStorage.saves);
                    }
                    saves.push(saveData);
                    localStorage.saves = JSON.stringify(saves);
                    
                    $(this).dialog('close');
                }, 
                "Cancel": function() {
                    $(this).dialog('close');
                }
            },
            close: function() {
                $(this).dialog('destroy');
                $('#save_dialog').remove();
            }
        })
    });
    
    $('#btn_share').click(function(e) {
        e.preventDefault();
        var dialog = document.createElement('div');
        dialog.setAttribute('title','Profile Pic');
        dialog.id = 'share_dialog';
        dialog.innerHTML = '<div id="share_tabs"><ul><li><a href="#sh_tab_1">Step 1</a></li><li><a href="#sh_tab_2">Step 2</a></li></ul><section id="sh_tab_1"><h1>Step 1</h1><p>Right-click on the image below, select <em>Save Image As...</em> and save to your hard drive.</p><img src="'+canvas.toDataURL('image/png')+'" alt="8-bit Profile Pic" width="200" height="200" /></section><section id="sh_tab_2"><h1>Step 2</h1><p>Upload the photo you just downloaded to Facebook</p><a href="https://www.facebook.com/editprofile.php?sk=picture">Facebook</a></section></div>';
        $('body').append(dialog);
        $(dialog).dialog({modal: true, width: '80%', position: ['auto',40] }).find('#share_tabs').tabs();
    });
});
