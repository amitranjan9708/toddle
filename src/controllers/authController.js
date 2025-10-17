const AuthService = require('../services/authService');

class AuthController {
    static async login(req, res) {
        const { username, role } = req.body;
        
        if (!username || !role) {
            return res.status(400).json({
                success: false,
                error: 'Username and role required'
            });
        }
        
        try {
            const result = await AuthService.login(username, role);
            res.json({
                success: true,
                data: result
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                error: err.message
            });
        }
    }
}

module.exports = AuthController;
