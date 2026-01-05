'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const exists = await queryInterface.rawSelect('units', {}, ['id']);
    if (exists) return;
    const rows = [
      { name: 'جرام', status: 'active' },
      { name: 'لتر', status: 'active' },
      { name: 'علبة', status: 'active' },
    ].map((u) => ({ ...u, created_at: new Date(), updated_at: new Date() }));
    await queryInterface.bulkInsert('units', rows);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('units', null, {});
  },
};
