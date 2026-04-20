// Simple NNIT backend logging system
module.exports = {
  authLogger: {
    register: (id, email) => console.log(`[REGISTER] User ${email} (${id}) registered.`),
    login: (id, email) => console.log(`[LOGIN] User ${email} (${id}) logged in.`),
    logout: (id) => console.log(`[LOGOUT] User ${id} logged out.`),
    failed: (email, reason) => console.log(`[AUTH FAILED] ${email}: ${reason}`)
  }
};
