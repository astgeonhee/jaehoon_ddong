const STORAGE_KEY_OBSTACLE = 'custom_obstacle_image';
const STORAGE_KEY_PLAYER_FACE = 'custom_player_face';
const STORAGE_KEY_PLAYER_BODY = 'custom_player_body';

export function saveCustomObstacle(dataUrl: string) {
  localStorage.setItem(STORAGE_KEY_OBSTACLE, dataUrl);
}

export function getCustomObstacle(): string | null {
  return localStorage.getItem(STORAGE_KEY_OBSTACLE);
}

export function saveCustomPlayerFace(dataUrl: string) {
  localStorage.setItem(STORAGE_KEY_PLAYER_FACE, dataUrl);
}

export function getCustomPlayerFace(): string | null {
  return localStorage.getItem(STORAGE_KEY_PLAYER_FACE);
}

export function saveCustomPlayerBody(dataUrl: string) {
  localStorage.setItem(STORAGE_KEY_PLAYER_BODY, dataUrl);
}

export function getCustomPlayerBody(): string | null {
  return localStorage.getItem(STORAGE_KEY_PLAYER_BODY);
}

export function clearCustomImages() {
  localStorage.removeItem(STORAGE_KEY_OBSTACLE);
  localStorage.removeItem(STORAGE_KEY_PLAYER_FACE);
  localStorage.removeItem(STORAGE_KEY_PLAYER_BODY);
}
