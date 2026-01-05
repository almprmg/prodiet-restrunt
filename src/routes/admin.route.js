const express = require('express');
const router = express.Router();
const { login } = require('../controllers/admin/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/permission.middleware');
const BranchController = require('../controllers/admin/branch.controller');
const RoleController = require('../controllers/admin/role.controller');
const UserController = require('../controllers/admin/user.controller');
const MealController = require('../controllers/admin/meal.controller');
const WorkdayController = require('../controllers/admin/workday.controller');
const UnitController = require('../controllers/admin/unit.controller');
const PlanController = require('../controllers/admin/plan.controller');
const SubscriberController = require('../controllers/admin/subscriber.controller');
const GeneralInfoController = require('../controllers/admin/generalinfo.controller');
const DashboardController = require('../controllers/admin/dashboard.controller');
const CategoryController = require('../controllers/admin/category.controller');
const { userPhotoUpload, mealPhotoUpload, planPhotoUpload, subscriberPhotoUpload, generalPhotoUpload } = require('../middleware/upload.middleware');
const { checkEmergencyPausePermission } = require('../middleware/custom-permission.middleware');
const upload = userPhotoUpload();
const mealUpload = mealPhotoUpload();
const planUpload = planPhotoUpload();
const subscriberUpload = subscriberPhotoUpload();
const generalUpload = generalPhotoUpload();

// POST /admin/login
router.post('/login', login);

router.get('/me', authMiddleware, UserController.me);
router.put('/me', authMiddleware, upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]), UserController.meUpdate);
router.put('/me/password', authMiddleware, UserController.changePassword);

router.get(
  '/dashboard/stats',
  authMiddleware,
  checkPermission('Dashboard', 'view'),
  DashboardController.stats
);
router.get(
  '/dashboard/latest-subscribers',
  authMiddleware,
  checkPermission('Dashboard', 'view'),
  DashboardController.latestSubscribers
);
router.get(
  '/dashboard/near-expiry',
  authMiddleware,
  checkPermission('Dashboard', 'view'),
  DashboardController.nearExpiry
);
router.get(
  '/dashboard/subscription-by-phone',
  authMiddleware,
  checkPermission('Dashboard', 'view'),
  DashboardController.subscriptionByPhone
);
router.post(
  '/branches',
  authMiddleware,
  checkPermission('Branches', 'add'),
  BranchController.create
);

router.put(
  '/branches/:id',
  authMiddleware,
  checkPermission('Branches', 'edit'),
  BranchController.update
);

router.get(
  '/branches',
  authMiddleware,
  checkPermission('Branches', 'view'),
  BranchController.list
);

router.get(
  '/branches/:id',
  authMiddleware,
  checkPermission('Branches', 'view'),
  BranchController.findById
);

router.patch(
  '/branches/:id/activate',
  authMiddleware,
  checkPermission('Branches', 'edit'),
  BranchController.activate
);

router.patch(
  '/branches/:id/deactivate',
  authMiddleware,
  checkPermission('Branches', 'edit'),
  BranchController.deactivate
);

router.post(
  '/roles',
  authMiddleware,
  checkPermission('RolesAndPermissions', 'add'),
  RoleController.create
);

router.put(
  '/roles/:id',
  authMiddleware,
  checkPermission('RolesAndPermissions', 'edit'),
  RoleController.update
);

router.get(
  '/roles',
  authMiddleware,
  checkPermission('RolesAndPermissions', 'view'),
  RoleController.list
);

router.get(
  '/roles/:id',
  authMiddleware,
  checkPermission('RolesAndPermissions', 'view'),
  RoleController.findById
);

router.patch(
  '/roles/:id/activate',
  authMiddleware,
  checkPermission('RolesAndPermissions', 'edit'),
  RoleController.activate
);

router.patch(
  '/roles/:id/deactivate',
  authMiddleware,
  checkPermission('RolesAndPermissions', 'edit'),
  RoleController.deactivate
);

router.post(
  '/users',
  authMiddleware,
  checkPermission('Users', 'add'),
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  UserController.create
);

router.put(
  '/users/:id',
  authMiddleware,
  checkPermission('Users', 'edit'),
  upload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  UserController.update
);

router.get(
  '/users',
  authMiddleware,
  checkPermission('Users', 'view'),
  UserController.list
);

router.get(
  '/users/:id',
  authMiddleware,
  checkPermission('Users', 'view'),
  UserController.findById
);

router.patch(
  '/users/:id/activate',
  authMiddleware,
  checkPermission('Users', 'edit'),
  UserController.activate
);

router.patch(
  '/users/:id/deactivate',
  authMiddleware,
  checkPermission('Users', 'edit'),
  UserController.deactivate
);



router.post(
  '/meals',
  authMiddleware,
  checkPermission('Meals', 'add'),
  mealUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  MealController.create
);

router.put(
  '/meals/:id',
  authMiddleware,
  checkPermission('Meals', 'edit'),
  mealUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  MealController.update
);

router.delete(
  '/meals/:id',
  authMiddleware,
  checkPermission('Meals', 'delete'),
  MealController.remove
);

router.get(
  '/meals',
  authMiddleware,
  checkPermission('Meals', 'view'),
  MealController.list
);

router.get(
  '/meals/:id',
  authMiddleware,
  checkPermission('Meals', 'view'),
  MealController.findById
);

router.get(
  '/workdays',
  authMiddleware,
  checkPermission('WorksDays', 'view'),
  WorkdayController.list
);

router.put(
  '/workdays/:id',
  authMiddleware,
  checkPermission('WorksDays', 'edit'),
  WorkdayController.update
);

router.patch(
  '/workdays/:id/activate',
  authMiddleware,
  checkPermission('WorksDays', 'edit'),
  WorkdayController.activate
);

router.patch(
  '/workdays/:id/deactivate',
  authMiddleware,
  checkPermission('WorksDays', 'edit'),
  WorkdayController.deactivate
);

router.get(
  '/units',
  authMiddleware,
  UnitController.list
);

router.post(
  '/plans',
  authMiddleware,
  checkPermission('Plans', 'add'),
  planUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  PlanController.create
);

router.delete(
  '/plans/:id',
  authMiddleware,
  checkPermission('Plans', 'delete'),
  PlanController.remove
);

router.get(
  '/plans',
  authMiddleware,
  checkPermission('Plans', 'view'),
  PlanController.list
);

router.get(
  '/plans/:id',
  authMiddleware,
  checkPermission('Plans', 'view'),
  PlanController.findById
);

router.patch(
  '/plans/:id/activate',
  authMiddleware,
  checkPermission('Plans', 'edit'),
  PlanController.activate
);

router.patch(
  '/plans/:id/deactivate',
  authMiddleware,
  checkPermission('Plans', 'edit'),
  PlanController.deactivate
);

router.post(
  '/subscribers',
  authMiddleware,
  checkPermission('Subscribers', 'add'),
  subscriberUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  SubscriberController.create
);

router.put(
  '/subscribers/:id',
  authMiddleware,
  checkPermission('Subscribers', 'edit'),
  subscriberUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  SubscriberController.update
);

router.get(
  '/subscribers',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.list
);

router.get(
  '/subscribers/:id/preview',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.previewBySubscriber
);

router.get(
  '/subscriptions',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.listAll
);

router.get(
  '/subscriptions/:id/preview',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.previewBySubscription
);

router.patch(
  '/subscriptions/:id/emergency-pause',
  authMiddleware,
  checkPermission('Subscribers', 'edit'),
  checkEmergencyPausePermission(),
  SubscriberController.pause
);

router.patch(
  '/subscriptions/:id/resume',
  authMiddleware,
  checkPermission('Subscribers', 'edit'),
  checkEmergencyPausePermission(),
  SubscriberController.resume
);

router.put(
  '/subscriptions/:id',
  authMiddleware,
  checkPermission('Subscribers', 'edit'),
  SubscriberController.updateSubscriptionBranch
);

router.patch(
  '/subscriptions/:id/normal-pause',
  authMiddleware,
  checkPermission('Subscribers', 'edit'),
  SubscriberController.pauseNormal
);

router.get(
  '/subscribers/:id/subscriptions',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.listSubscriptions
);

router.get(
  '/subscriptions/:id/pauses',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.listPauses
);

router.post(
  '/subscribers/:id/renew',
  authMiddleware,
  checkPermission('Subscribers', 'edit'),
  SubscriberController.renew
);

router.post(
  '/subscription-deliveries',
  authMiddleware,
  checkPermission('Subscribers', 'edit'),
  SubscriberController.deliver
);

router.get(
  '/subscription-deliveries',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.listDeliveries
);

router.get(
  '/subscriptions/:id/deliveries',
  authMiddleware,
  checkPermission('Subscribers', 'view'),
  SubscriberController.listDeliveriesBySubscription
);

router.get(
  '/inventory/today',
  authMiddleware,
  checkPermission('StockManagment', 'view'),
  SubscriberController.listInventoryToday
);

router.get(
  '/inventory/tomorrow',
  authMiddleware,
  checkPermission('StockManagment', 'view'),
  SubscriberController.listInventoryTomorrow
);
router.get(
  '/subscription-settings',
  authMiddleware,
  checkPermission('SubscriptionSettings', 'view'),
  SubscriberController.getSettings
);

router.put(
  '/subscription-settings',
  authMiddleware,
  checkPermission('SubscriptionSettings', 'edit'),
  SubscriberController.updateSettings
);

router.post(
  '/categories',
  authMiddleware,
  checkPermission('Categories', 'add'),
  CategoryController.create
);

router.put(
  '/categories/:id',
  authMiddleware,
  checkPermission('Categories', 'edit'),
  CategoryController.update
);

router.delete(
  '/categories/:id',
  authMiddleware,
  checkPermission('Categories', 'delete'),
  CategoryController.remove
);

router.get(
  '/categories',
  authMiddleware,
  checkPermission('Categories', 'view'),
  CategoryController.list
);

router.get(
  '/categories/snacks',
  authMiddleware,
  checkPermission('Categories', 'view'),
  CategoryController.listSnacks
);

router.get(
  '/categories/:id',
  authMiddleware,
  checkPermission('Categories', 'view'),
  CategoryController.findById
);

router.post(
  '/dashboard/subscribers',
  authMiddleware,
  checkPermission('Dashboard', 'add'),
  subscriberUpload.fields([{ name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  SubscriberController.create
);

router.post(
  '/dashboard/subscription-deliveries',
  authMiddleware,
  checkPermission('Dashboard', 'edit'),
  SubscriberController.deliver
);

router.post(
  '/dashboard/subscribers/:id/renew',
  authMiddleware,
  checkPermission('Dashboard', 'edit'),
  SubscriberController.renew
);
router.get(
  '/general-info',
  authMiddleware,
  checkPermission('GeneralInfo', 'view'),
  GeneralInfoController.get
);

router.put(
  '/general-info',
  authMiddleware,
  checkPermission('GeneralInfo', 'edit'),
  generalUpload.fields([{ name: 'logo', maxCount: 1 }, { name: 'photo', maxCount: 1 }, { name: 'file', maxCount: 1 }]),
  GeneralInfoController.update
);
module.exports = router;
