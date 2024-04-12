export function randomHexId(): string {
  return Math.floor(Math.random() * 0xff_ff_ff_ff).toString(16);
}
