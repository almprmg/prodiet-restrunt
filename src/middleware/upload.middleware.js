const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const userPhotoUpload = () => {
  const dir = path.join(process.cwd(), 'uploads', 'users');
  ensureDir(dir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '');
      const name = `${Date.now()}_${base}${ext}`;
      cb(null, name);
    },
  });
  const fileFilter = (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  };
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};

const mealPhotoUpload = () => {
  const dir = path.join(process.cwd(), 'uploads', 'meals');
  ensureDir(dir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '');
      const name = `${Date.now()}_${base}${ext}`;
      cb(null, name);
    },
  });
  const fileFilter = (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  };
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};

const planPhotoUpload = () => {
  const dir = path.join(process.cwd(), 'uploads', 'plans');
  ensureDir(dir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '');
      const name = `${Date.now()}_${base}${ext}`;
      cb(null, name);
    },
  });
  const fileFilter = (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  };
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};

const subscriberPhotoUpload = () => {
  const dir = path.join(process.cwd(), 'uploads', 'subscribers');
  ensureDir(dir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '');
      const name = `${Date.now()}_${base}${ext}`;
      cb(null, name);
    },
  });
  const fileFilter = (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  };
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};

const generalPhotoUpload = () => {
  const dir = path.join(process.cwd(), 'uploads', 'general');
  ensureDir(dir);
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '');
      const name = `${Date.now()}_${base}${ext}`;
      cb(null, name);
    },
  });
  const fileFilter = (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
  };
  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
};

module.exports = { userPhotoUpload, mealPhotoUpload, planPhotoUpload, subscriberPhotoUpload, generalPhotoUpload };
