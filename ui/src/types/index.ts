export type WorkbenchView =
  | 'dashboard'
  | 'upload'
  | 'register'
  | 'results'
  | 'matches'
  | 'metrics'
  | 'exports'
  | 'logs'
  | 'settings'
  | 'about';

export type MatcherType = 'auto' | 'loftr' | 'xfeat' | 'lightglue' | 'crater_graph' | 'phase_corr' | 'mutual_info' | 'sift';

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  sensor: string;
  gsd: string;
  sunAngle: string;
  previewUrl: string;
  file?: File;
  bandIdx?: number;
}

export interface ImagePairState {
  reference: ImageMetadata | null;
  source: ImageMetadata | null;
  sourceSensor: string;
}

export interface PipelineStageInfo {
  id: string;
  name: string;
  sub: string;
}

export interface RegistrationResults {
  rmse: number;
  rmseVal?: number;
  qualityGatePass?: boolean;
  raw: number;
  inliers: number;
  ratio: number;
  ce90: number;
  nni: number;
  coverage: number;
  time: string;
  method: string;
  matcherUsed: string;
  /** Job ID returned by the backend; undefined in demo/simulation mode */
  jobId?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface SettingsConfig {
  defaultGsdStrategy: string;
  defaultMatcher: string;
  heatmapOpacity: number;
  coordinateSystem: string;
  apiUrl: string;
  autoSave: boolean;
}
