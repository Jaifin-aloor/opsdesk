"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.errorHandler = errorHandler;
const express_1 = require("express");
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function errorHandler(error, _req, res, _next) {
    console.error(error);
    res.status(error.status || 500).json({
        error: error.message || "Internal server error",
    });
}
//# sourceMappingURL=errorHandler.js.map