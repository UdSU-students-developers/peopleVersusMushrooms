// userHandlers
const useLoginHandler = require("./userHandlers/useLoginHandler");
const useRegistrationHandler = require("./userHandlers/useRegistrationHandler");
const useLogoutHandler = require("./userHandlers/useLogoutHandler");

module.exports = {
    //users
    useLoginHandler,
    useRegistrationHandler,
    useLogoutHandler,
};