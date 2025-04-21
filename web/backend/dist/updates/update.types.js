"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSessionState = exports.UpdateType = void 0;
var UpdateType;
(function (UpdateType) {
    UpdateType["FIRMWARE"] = "FIRMWARE";
    UpdateType["CONFIGURATION"] = "CONFIGURATION";
})(UpdateType || (exports.UpdateType = UpdateType = {}));
var UpdateSessionState;
(function (UpdateSessionState) {
    UpdateSessionState["INITIATED"] = "INITIATED";
    UpdateSessionState["PREPARING"] = "PREPARING";
    UpdateSessionState["TRANSFERRING"] = "TRANSFERRING";
    UpdateSessionState["VALIDATING"] = "VALIDATING";
    UpdateSessionState["APPLYING"] = "APPLYING";
    UpdateSessionState["RESTARTING"] = "RESTARTING";
    UpdateSessionState["VERIFYING"] = "VERIFYING";
    UpdateSessionState["COMPLETED"] = "COMPLETED";
    UpdateSessionState["FAILED"] = "FAILED";
    UpdateSessionState["ROLLING_BACK"] = "ROLLING_BACK";
    UpdateSessionState["ROLLED_BACK"] = "ROLLED_BACK";
    UpdateSessionState["CRITICAL_FAILURE"] = "CRITICAL_FAILURE";
})(UpdateSessionState || (exports.UpdateSessionState = UpdateSessionState = {}));
//# sourceMappingURL=update.types.js.map