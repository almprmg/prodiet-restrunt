const { GeneralInfo } = require('../../../models');
const { validatePhone05 } = require('../../utils/helpers.util');

async function getGeneralInfo() {
  const info = await GeneralInfo.findOne();
  return info;
}

async function updateGeneralInfo(payload, logoPath) {
  const updates = {};
  if (payload.org_name !== undefined) updates.org_name = payload.org_name;
  if (payload.restaurant_phone !== undefined) {
    if (!validatePhone05(payload.restaurant_phone)) throw new Error('Invalid restaurant_phone');
    updates.restaurant_phone = payload.restaurant_phone;
  }
  if (payload.restaurant_email !== undefined) updates.restaurant_email = payload.restaurant_email;
  if (payload.primary_color !== undefined) updates.primary_color = payload.primary_color;
  if (payload.secondary_color !== undefined) updates.secondary_color = payload.secondary_color;
  if (logoPath !== undefined) updates.logo = logoPath;
  const existing = await GeneralInfo.findOne();
  if (existing) {
    await existing.update(updates);
    return existing;
  } else {
    const created = await GeneralInfo.create({
      org_name: updates.org_name || 'Prodiet',
      restaurant_phone: updates.restaurant_phone || '0500000000',
      restaurant_email: updates.restaurant_email || null,
      logo: updates.logo || null,
      primary_color: updates.primary_color || null,
      secondary_color: updates.secondary_color || null,
    });
    return created;
  }
}

module.exports = {
  getGeneralInfo,
  updateGeneralInfo,
};
