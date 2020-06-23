local function serialize_stack(stack)
    return { stack:get_name() or "", stack:get_definition().type == "tool" and stack:get_wear() or stack:get_count() }
end
item_defs = {}
usages = {}
crafts = {}
groups = {}
local function get_craft_recipes(def_name)
    local item_crafts = minetest.get_all_craft_recipes(def_name)
    if not item_crafts then
        return
    end
    for index, craft in ipairs(item_crafts) do
        local stack = ItemStack(craft.output)
        local craft_items = {}
        local width = craft.width > 0 and craft.width or 1
        for i = #craft.items, width, -width do
            local keep_line
            for j = i, math.max(1, i - width), -1 do
                local item = craft.items[j]
                if item and item ~= "" then
                    keep_line = true
                    break
                end
            end
            if not keep_line then
                for j = i, math.max(1, i - width), -1 do
                    table.remove(craft.items, j)
                end
            end
        end
        local maxidx = 1
        for index, item in pairs(craft.items) do
            craft_items[index] = serialize_stack(ItemStack(item))
            maxidx = math.max(maxidx, index)
        end
        for i = 1, maxidx do
            if not craft_items[i] then
                craft_items[i] = {}
            end
        end
        local craft_index = #crafts
        item_crafts[index] = craft_index
        table.insert(crafts, {
            method = craft.method,
            shapeless = craft.width == 0,
            width = craft.width ~= 0 and math.min(#craft_items, craft.width),
            items = craft_items,
            output = serialize_stack(stack)
        })
        for _, item in ipairs(craft.items or {}) do
            local itemname = ItemStack(item):get_name()
            if not item_defs[itemname] then
                usages[itemname] = { craft_index }
            else
                local tab = item_defs[itemname].usages
                if not tab then
                    tab = {}
                    item_defs[itemname].usages = tab
                end
                if not modlib.table.find(tab, craft_index) then
                    table.insert(tab, craft_index)
                end
            end
        end
    end
    return item_crafts
end
local handle = io.open(minetest.get_modpath("online_craftguide") .. "/docs/index.html", "w")
function minetest_to_html(text)
    local previous_color
    return text:gsub("<", "&lt;"):gsub("'", "&apos;"):gsub('"', "&quot;"):gsub("\n", "<br>"):gsub("\27E", ""):gsub("\27%((%a)@(.-)%)", function(type, args)
        if type == "c" and previous_color ~= args then
            local retval = (previous_color and "</span>" or "") .. "<span style='color: " .. args .. " !important;'>"
            previous_color = args
            return retval
        end
        return ""
    end) .. (previous_color and "</span>" or "")
end
function minetest_to_searchable(text)
    return text:gsub("\27%((%a)@(.-)%)", ""):gsub("\27E", ""):lower()
end
function add_item(name, def)
    if (def.groups and def.groups.not_in_creative_inventory) or def.description == "" then
        return
    end
    local def_name = def.name
    local item = item_defs[def_name]
    if not item then
        local title, description = unpack(modlib.text.split(def.description, "\n", 2))
        item = {
            crafts = get_craft_recipes(def_name),
            title = minetest_to_html(title),
            description = description and minetest_to_html(description) or nil,
            searchable_description = minetest_to_searchable(def.description),
            type = def.type,
            groups = def.groups,
            usages = usages[def.name]
        }
        if def.groups then
            for group, rating in pairs(def.groups) do
                groups[group] = groups[group] or {}
                groups[group][def_name] = rating
            end
        end
        item_defs[def_name] = item
    end
    if name ~= def_name then
        item.aliases = item.aliases or {}
        table.insert(item.aliases, name)
    end
end
function preprocess_html(text)
    local regex = [[(<svg%s+class=['"]bi%sbi%-)(.-)(['"].->.-</svg>)]]
    local replaced
    return text:gsub(regex, function(_, match)
        local svg = modlib.file.read(minetest.get_modpath("online_craftguide") .. "/node_modules/bootstrap-icons/icons/" .. modlib.text.split(match, "%s", 2, true)[1] .. ".svg")
        return svg:gsub(regex, function(before, _, after)
            return before .. match .. after
        end):gsub("\n", "")
    end):gsub([[<script%s*src=['"]online_craftguide['"]>.-</script>]], function()
        if replaced then
            error("multiple script tags")
        end
        replaced = true
        return "<script>items = " .. minetest.write_json(item_defs) .. "; crafts = " .. minetest.write_json(crafts) .. "; groups = " .. minetest.write_json(groups) .. "</script>"
    end)
end
minetest.register_on_mods_loaded(function()
    for name, def in pairs(minetest.registered_items) do
        add_item(name, def)
    end
    for _, item in pairs(item_defs) do
        if item.aliases then
            table.sort(item.aliases)
        end
    end
    local html = preprocess_html(modlib.file.read(modlib.mod.get_resource("online_craftguide", "index.html")))
    handle:write(html)
    handle:close()
end)