export function extractPort(port?: string): number {
  if (port == null) {
    return 8080;
  }
  if (/tcp:\/\//.test(port)) {
    return parseInt(port.split(':')[2]);
  }
  return Number(port);
}
