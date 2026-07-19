export const POST_PERMISSIONS = {
  CREATE: "post.create",
  READ: "post.read",
  EDIT: "post.edit",
  DELETE: "post.delete",
  PIN: "post.pin",
  HIDE: "post.hide",
  APPROVE: "post.approve",
  REJECT: "post.reject",
} as const;

export const COMMENT_PERMISSIONS = {
  CREATE: "comment.create",
  READ: "comment.read",
  EDIT: "comment.edit",
  DELETE: "comment.delete",
  HIDE: "comment.hide",
  APPROVE: "comment.approve",
  REJECT: "comment.reject",
} as const;

export const USER_PERMISSIONS = {
  FOLLOW: "user.follow",
  BLOCK: "user.block",
  VERIFY: "user.verify",
  SUSPEND: "user.suspend",
  WARN: "user.warn",
  VIEW_DETAILS: "user.view_details",
  EDIT_PROFILE: "user.edit_profile",
  DELETE_ACCOUNT: "user.delete_account",
  VIEW_EMAIL: "user.view_email", // For support/admin
  VIEW_PHONE: "user.view_phone", // For support/admin
} as const;

export const ADMIN_PERMISSIONS = {
  DASHBOARD_ACCESS: "admin.dashboard.access",
  ANALYTICS_VIEW: "admin.analytics.view",
  USERS_VIEW: "admin.users.view",
  USERS_EDIT: "admin.users.edit",
  USERS_DELETE: "admin.users.delete",
  ROLES_ASSIGN: "admin.roles.assign",
  ROLES_MANAGE: "admin.roles.manage",
  PERMISSIONS_MANAGE: "admin.permissions.manage",
  SETTINGS_MANAGE: "admin.settings.manage",
  SITE_CONTENT_MANAGE: "admin.site_content.manage",
  SYSTEM_LOGS_VIEW: "admin.system_logs.view",
} as const;

export const REPORT_PERMISSIONS = {
  REVIEW: "report.review",
  RESOLVE: "report.resolve",
  ESCALATE: "report.escalate",
  VIEW_ALL: "report.view_all",
} as const;

export const WALLET_PERMISSIONS = {
  MANAGE_OWN: "wallet.manage_own",
  VIEW_TRANSACTIONS_OWN: "wallet.view_transactions_own",
  VIEW_TRANSACTIONS_ALL: "wallet.view_transactions_all", // For finance/admin
  INITIATE_PAYOUT: "wallet.initiate_payout",
  APPROVE_PAYOUT: "wallet.approve_payout",
  REJECT_PAYOUT: "wallet.reject_payout",
} as const;

export const ADS_PERMISSIONS = {
  CREATE: "ads.create",
  MANAGE_OWN: "ads.manage_own",
  VIEW_PERFORMANCE_OWN: "ads.view_performance_own",
  MANAGE_ALL: "ads.manage_all", // For advertiser/admin
  VIEW_PERFORMANCE_ALL: "ads.view_performance_all", // For advertiser/admin
  APPROVE: "ads.approve",
  REJECT: "ads.reject",
} as const;
