/**
 * تحديث/تصفية الحقول المسموح بها
 * @param {Object} inputData - البيانات القادمة من العميل
 * @param {Array} allowedFields - قائمة الحقول المسموح بها
 * @param {Boolean} required - إذا كانت الحقول إلزامية
 * @returns {Object} - البيانات المفلترة
 */
const updateFieldsFilter = (inputData, allowedFields = [], required = false) => {
    const filteredData = {};
    for (let field of allowedFields) {
      if (inputData[field] !== undefined) {
        filteredData[field] = inputData[field];
      } else if (required) {
        throw new Error(`Field ${field} is required`);
      }
    }
    return filteredData;
  };
  
  const validatePhone05 = (phone) => {
    if (typeof phone !== 'string') return false;
    return /^05\d{8}$/.test(phone);
  };
  
  const addDays = (date, days) => {
    const d = new Date(date);
    const base = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const result = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    return result;
  };
  
  const toDateOnly = (input) => {
    if (!input) return null;
    if (typeof input === 'string') {
      const parts = input.split('-').map((x) => parseInt(x, 10));
      if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
      const d = new Date(input);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    if (input instanceof Date) {
      return new Date(input.getFullYear(), input.getMonth(), input.getDate());
    }
    return null;
  };
  
  const calculateRemainingDays = (endDate, refDate = new Date()) => {
    const end = toDateOnly(endDate);
    if (!end) return null;
    const ref = toDateOnly(refDate);
    const diffMs = end.getTime() - ref.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(0, days);
  };
  
  const calculatePausedDays = (pauseDate, resumeDate) => {
    const start = toDateOnly(pauseDate);
    const end = toDateOnly(resumeDate);
    if (!start || !end) return 0;
    const diffMs = end.getTime() - start.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const exclusive = Math.max(0, days - 1);
    return exclusive;
  };
  
  const buildFileUrl = (req, filePath) => {
    if (!filePath) return null;
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const override = process.env.PUBLIC_BASE_URL || process.env.BASE_URL;
    const normalized = String(filePath).replace(/^\/+/, '');
    if (override) {
      const base = String(override).replace(/\/+$/,'');
      return `${base}/${normalized}`;
    }
    const xfProto = req.get('x-forwarded-proto');
    const proto = (xfProto ? xfProto.split(',')[0] : (req.protocol || 'http'));
    const xfHost = req.get('x-forwarded-host');
    const host = xfHost || req.get('host');
    const base = `${proto}://${host}`;
    return `${base}/${normalized}`;
  };
  
  const normalizeArrayInput = (input) => {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') {
      try {
        const v = JSON.parse(input);
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    }
    return [];
  };
  
  module.exports = {
    updateFieldsFilter,
    validatePhone05,
    addDays,
    calculateRemainingDays,
    calculatePausedDays,
    buildFileUrl,
    normalizeArrayInput,
  };
  
