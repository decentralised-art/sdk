export const ADDR = '0x1111111111111111111111111111111111111111';
export const FORMAT = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
export const HASH = `0x${'c'.repeat(64)}`;
export const TX = `0x${'d'.repeat(64)}`;
export const NONCE = 'e'.repeat(66);
export const SIGN_IN_MESSAGE = `example.invalid wants you to sign in with your Ethereum account:\n${ADDR}\n\nNonce: ${NONCE}`;

export function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
