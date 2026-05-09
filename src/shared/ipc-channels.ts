/**
 * IPC channel names used between main and renderer.
 * Keep in sync with src/preload/index.ts.
 */

export const IPC = {
  // Profiles
  ProfilesList: 'profiles:list',
  ProfilesGet: 'profiles:get',
  ProfilesCreate: 'profiles:create',
  ProfilesUpdate: 'profiles:update',
  ProfilesDelete: 'profiles:delete',
  ProfilesDuplicate: 'profiles:duplicate',
  ProfilesLaunch: 'profiles:launch',
  ProfilesClose: 'profiles:close',
  ProfilesImportCookies: 'profiles:import-cookies',
  ProfilesExportCookies: 'profiles:export-cookies',

  // Folders
  FoldersList: 'folders:list',
  FoldersCreate: 'folders:create',
  FoldersUpdate: 'folders:update',
  FoldersDelete: 'folders:delete',

  // Proxies
  ProxiesList: 'proxies:list',
  ProxiesCreate: 'proxies:create',
  ProxiesUpdate: 'proxies:update',
  ProxiesDelete: 'proxies:delete',
  ProxiesTest: 'proxies:test',
  ProxiesImportBulk: 'proxies:import-bulk',

  // Extensions
  ExtensionsList: 'extensions:list',
  ExtensionsAdd: 'extensions:add',
  ExtensionsRemove: 'extensions:remove',
  ExtensionsToggle: 'extensions:toggle',

  // Automation
  ScenariosList: 'scenarios:list',
  ScenariosCreate: 'scenarios:create',
  ScenariosUpdate: 'scenarios:update',
  ScenariosDelete: 'scenarios:delete',
  ScenariosRun: 'scenarios:run',
  RunsList: 'runs:list',

  // Fingerprint
  FingerprintGenerate: 'fingerprint:generate',
  FingerprintPresets: 'fingerprint:presets',

  // Settings
  SettingsGet: 'settings:get',
  SettingsUpdate: 'settings:update',
  SettingsDetectChrome: 'settings:detect-chrome',

  // Local API server
  ApiInfo: 'api:info',

  // System
  SystemOpenPath: 'system:open-path',
  SystemSelectFile: 'system:select-file',
  SystemSelectDir: 'system:select-dir',

  // Events from main -> renderer
  EventProfileStatusChanged: 'event:profile-status-changed',
  EventRunUpdated: 'event:run-updated'
} as const
