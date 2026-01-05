'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const days = [
      { name_ar: 'السبت', name_en: 'Saturday', status: 'active' },
      { name_ar: 'الأحد', name_en: 'Sunday', status: 'active' },
      { name_ar: 'الإثنين', name_en: 'Monday', status: 'active' },
      { name_ar: 'الثلاثاء', name_en: 'Tuesday', status: 'active' },
      { name_ar: 'الأربعاء', name_en: 'Wednesday', status: 'active' },
      { name_ar: 'الخميس', name_en: 'Thursday', status: 'active' },
      { name_ar: 'الجمعة', name_en: 'Friday', status: 'inactive' },
    ];
    const exists = await queryInterface.rawSelect('workdays', {}, ['id']);
    if (exists) return;
    await queryInterface.bulkInsert(
      'workdays',
      days.map((d) => ({
        ...d,
        created_at: new Date(),
        updated_at: new Date(),
      }))
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('workdays', null, {});
  },
};
