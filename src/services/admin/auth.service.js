const { User, Role, Permission, Branch } = require('../../../models');
const { comparePassword } = require('../../utils/hashPassword.util');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';

async function loginAdmin(username, password) {
    // البحث عن المستخدم مع الدور والصلاحيات والفرع
    const user = await User.findOne({
        where: { username },
        include: [
            {
                model: Role,
                as: 'role',
                include: [
                    {
                        model: Permission,
                        as: 'permissions',
                    },
                ],
            },
            {
                model: Branch,
                as: 'branch', // 👈 هذا alias المستخدم في مودل User
            },
        ],
  });

  if (!user) {
    throw new Error('Admin not found');
  }

  if (user.status !== 'active') {
    throw new Error('User inactive');
  }
  if (user.branch && (user.branch.status !== 'active' || user.branch.is_active === false)) {
    throw new Error('Branch inactive');
  }

  // تحقق من كلمة السر
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

    // توليد التوكن
    const payload = {
        user_id: user.id,
        role_id: user.role_id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return {
        token,
        user, // الآن يتضمن بيانات الفرع أيضًا
    };
}

module.exports = {
    loginAdmin,
};
