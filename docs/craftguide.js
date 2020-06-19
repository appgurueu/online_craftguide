"use strict";
function searchItems(query) {
    let filtered = [];
    for (let itemname in items) {
        if (!query) {
            filtered.push(itemname);
        } else {
            let item = items[itemname];
            for (let word of query) {
                word = word.toLowerCase();
                if (itemname.indexOf(word) >= 0 || item.searchable_description.indexOf(word) >= 0) {
                    filtered.push(itemname);
                    break;
                }
            }
        }
    }
    filtered.sort();
    return filtered;
}

function getItemName(required_groups) {
    let items = {};
    for (let itemname in groups[required_groups[0]])
        items[itemname] = true;
    for (let i=1; i < required_groups.length; i++) {
        let more_items = groups[required_groups[1]];
        for (let itemname in items)
            if (!more_items[itemname]) delete items[itemname];
    }
    for (let itemname in items)
        return itemname;
}

const max_wear = Math.pow(2, 16)-1;
const no_item = '<div class="card card-item p-1 m-1 bg-light"><img src="images/blank.png" class="card-img-top img-item" alt="Nothing"></div>';
function itemInfo(itemname, number, highlighted) {
    if (!itemname)
        return no_item;
    let groups = itemname.startsWith("group:") ? itemname.substr("group:".length).split(","):"";
    if (groups) {
        itemname = getItemName(groups);
        for (let i in groups)
            groups[i] = '<span class="card-text badge badge-primary mt-1">'+groups[i].replace(/_/g, " ")+'</span>';
        groups = groups.join(" ");
    }
    let img = '<img src="images/unknown_item.png" class="card-img-top img-item" alt="?">';
    let overlay_content = groups;
    let tooltip = "No such item";
    let justify_overlay_content = "end";
    if (itemname) {
        let item = items[itemname];
        var casual_name = itemname.replace(":", "_");
        img = '<img src="images/' + (casual_name + ".png") + '" class="card-img-top img-item" alt="' + itemname + '">';
        tooltip = item.title;
        let is_tool = item.type == "tool";
        if (is_tool) {
            if (number > 0) {
                let percentage = 100*(max_wear-number)/max_wear;
                overlay_content += '<div class="progress"><div class="progress-bar bg-secondary" role="progressbar" style="width: '+percentage+'%" aria-valuenow="'+percentage+'" aria-valuemin="0" aria-valuemax="100"></div></div>';
                justify_overlay_content = "center";
            }
        } else if (number > 1) {
            overlay_content += '<span class="card-text badge badge-secondary">' + number + '</span>';
        }
    }
    if (overlay_content)
        overlay_content = '<div class="card-img-overlay m-0 p-0 d-flex flex-wrap align-items-end align-content-' + justify_overlay_content + ' justify-content-' + justify_overlay_content + '">' + overlay_content + '</div>';
    let data = itemname ? 'id="item-' + casual_name + '" data-itemname="' + itemname + '"':"";
    return '<div class="card card-item btn btn-light p-1 m-1' + (highlighted ? " border-secondary":"") + '" '+data+' data-toggle="tooltip" data-placement="top" data-html="true" title="' + tooltip + '">' + img + overlay_content + '</div>';
}

function itemList(filtered) {
    let html = "";
    for (let itemname of filtered) {
        html += '<div class="col-auto p-0">' + itemInfo(itemname) + '</div>';
    }
    return html;
}

function renderItemList(filtered) {
    $("#items").html(itemList(filtered));
}

function viewCraft(craft, highlighted) {
    let html = '<div class="d-flex align-items-center justify-content-start"><div class="container">';
    let width = craft.width || craft.items.length;
    let height = Math.ceil(craft.items.length/width);

    for (let y = 0; y < height; y++) {
        let index_base = y * width;
        html += '<div class="row justify-content-start flex-nowrap">';
        for (let x = 0; x < width; x++) {
            let stack = craft.items[index_base + x];
            html += '<div class="col-auto p-0">' + (stack ? itemInfo(...stack, stack[0] == highlighted):itemInfo()) + "</div>";
        }
        html += "</div>";
    }
    let method = craft.method == "normal" ? "":'<span class="badge badge-primary py-1 my-1">'+craft.method+'</span>';
    method += craft.shapeless ? '<span class="badge badge-secondary py-1 my-1">shapeless</span>':"";
    return html+'</div>'+method+arrow+itemInfo(...craft.output)+"</div>";
}

function groupInfo(groupname) {
    for (var itemname in groups[groupname]) break;
    $("#modal-item-info-label").html('<img class="mr-2" src="images/' + itemname.replace(":", "_") + '.png" alt="' + itemname + '"><span class="badge badge-primary">' + groupname.replace(/\_/g, " ") + "</span>");
    let items = [];
    for (itemname in groups[groupname]) {
        items.push(itemname);
    }
    items.sort();
    $("#modal-item-info .modal-body").html('<div class="row d-flex justify-content-left ml-2">' + itemList(items) + '</div>');
    updateListeners('#modal-item-info');
    updateTooltips('#modal-item-info');
}

function detailedItemInfo(itemname) {
    let casual_name = itemname.replace(":", "_");
    let item = items[itemname];
    let body =  '<dl class="row">';
    const addDefinition = (property, value) => body += '<dt class="col-sm-3">' + property + '</dt><dd class="col-sm-9' + '">' + value + '</dd>';
    addDefinition("Type", {"craft": "Item", "tool": "Tool", "node": "Block"}[item.type]);
    if (item.description)
        addDefinition("Description", item.description);
    if (item.groups) {
        let groups = [];
        for (let group in item.groups) {
            groups.push({group: group.replace(/\_/g, " "), rating: item.groups[group], data: group});
        }
        groups.sort((a, b) => a.rating < b.rating ? -1 : 1);
        for (let index in groups) {
            let group = groups[index];
            groups[index] = '<button class="btn btn-sm btn-primary badge badge-group" data-group="'+group.data+'">' + group.group + ' <span class="badge badge-light">' + group.rating + '</span></button>';
        }
        addDefinition("Groups", groups.join(" "));
    }
    body += "</dl>";
    if (item.aliases) {
        body += "<h4>Aliases</h4><ul>";
        for (let alias of item.aliases) {
            body += "<li><code>" + alias + "</code></li>";
        }
        body += "</ul>";
    }
    if (item.crafts) {
        body += '<hr><h5>Recipes <span class="badge badge-secondary">' + item.crafts.length + '</span></h5>';
        let recipes = [];
        for (let craft of item.crafts) {
            recipes.push(viewCraft(crafts[craft]));
        }
        body += recipes.join("<hr>");
    }
    if (item.usages) {
        body += '<hr><h5>Usages <span class="badge badge-secondary">' + item.usages.length + '</span></h5>';
        let usages = [];
        for (let usage of item.usages) {
            usages.push(viewCraft(crafts[usage], itemname));
        }
        body += usages.join("<hr>");
    }
    let modal = $('#modal-item-info');
    modal.modal("hide");
    $("#modal-item-info-label").html('<img class="mr-2" src="images/' + casual_name + '.png" alt="' + itemname + '">' + item.title + " (<code>" + itemname + "</code>)");
    $("#modal-item-info .modal-body").html(body);
    updateListeners('#modal-item-info');
    updateTooltips('#modal-item-info');
    modal.modal("show");
    $(".badge-group").on("click", function(event) {
        let groupname = event.currentTarget.attributes["data-group"].value;
        groupInfo(groupname);
    })
}

function updateTooltips(base) {
    $((base ? base+" ":"") + '[data-toggle="tooltip"]').tooltip({
        sanitize: false
    });
}

function updateListeners(base) {
    $((base ? base+" ":"") + "div.card-item").on("click", function (event) {
        let itemname = event.currentTarget.attributes["data-itemname"].value;
        $('#recipe *[data-toggle="tooltip"]').tooltip("dispose");
        detailedItemInfo(itemname);
        $('#recipe *[data-toggle="tooltip"]').tooltip({
            sanitize: false
        });
    });
}

function updateSearch() {
    renderItemList(searchItems($("#search").val().split(/\s+/g)));
    updateTooltips();
    updateListeners();
}

$("#search").on("change", updateSearch);
$("#search-btn").on("input", updateSearch);
$(updateSearch);

renderItemList(searchItems());