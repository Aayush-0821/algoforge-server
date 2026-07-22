"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "AlgoForge AI is Running",
    });
});
exports.default = app;
//# sourceMappingURL=app.js.map