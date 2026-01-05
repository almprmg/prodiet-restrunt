const { loginAdmin } = require('../../services/admin/auth.service');

// دالة تسجيل الدخول
async function login(req, res) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        const result = await loginAdmin(username, password);

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token: result.token,
                user: {
                    id: result.user.id,
                    full_name: result.user.full_name,
                    username: result.user.username,
                    role_id: result.user.role_id,
                    permissions: result.user.role.permissions || [],
                },
                branch: result.user.branch,
            },
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message,
        });
    }
}

module.exports = {
    login,
};
