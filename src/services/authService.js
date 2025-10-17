const jwtUtils = require('../utils/jwt');
const User = require('../repositories/userRepository');

class AuthService {
    static async login(username, role) {
        let user = await User.findOne({ where: { username } });
        if(!user){
            user = await User.create({ username, role });
        }

        // support both styles: module.exports = { signToken } and module.exports = signToken
        const sign = (typeof jwtUtils === 'function') ? jwtUtils : jwtUtils && jwtUtils.signToken;

        let token;
        if (typeof sign === 'function') {
            token = sign({ id: user.id, role: user.role });
        } else {
            // fallback: sign directly with jsonwebtoken and a fallback secret
            const jwt = require('jsonwebtoken');
            const SECRET = (jwtUtils && jwtUtils.SECRET) ? jwtUtils.SECRET : 'supersecretkey';
            token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
        }
        return { user, token };
    }
}

module.exports = AuthService;

