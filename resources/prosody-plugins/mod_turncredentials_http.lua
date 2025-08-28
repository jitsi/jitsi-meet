-- http endpoint to expose turn credentials for other services
-- Copyright (C) 2023-present 8x8, Inc.

local ext_services = module:depends("external_services");
local get_services = ext_services.get_services;

local async_handler_wrapper = module:require "util".async_handler_wrapper;
local json = require 'cjson.safe';

--- Handles request for retrieving turn credentials
-- @param event the http event, holds the request query
-- @return GET response, containing a json with participants details
function handle_get_turn_credentials (event)
    local GET_response = {
        headers = {
            content_type = "application/json";
        };
        body = json.encode(get_services());
    };
    return GET_response;
end;

function module.load()
    module:depends("http");
    module:provides("http", {
        default_path = "/";
        route = {
            ["GET turn-credentials"] = function (event) return async_handler_wrapper(event,handle_get_turn_credentials) end;
        };
    });
end
