import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DecentralisedArtClient } from '../src/client';
import { ADDR, NONCE, SIGN_IN_MESSAGE } from './fixtures';

describe('decentralised.art JS auth facade', () => {
  let sdk: DecentralisedArtClient;

  beforeEach(() => {
    sdk = new DecentralisedArtClient({ baseUrl: 'https://example.invalid/chain' });
  });

  it('authenticates with nonce and attaches bearer token afterwards', async () => {
    const { nonce, message } = await sdk.getNonce(ADDR);
    expect(message).toBe(SIGN_IN_MESSAGE);
    const auth = await sdk.loginWithSignature(ADDR, nonce, '0xSIG');
    expect(auth.access_token).toBe('access-123');
    expect(sdk.accessToken).toBe('access-123');

    const authHeaders = () =>
      globalThis.__lastRequests.slice(-2).map(({ init }) => new Headers(init?.headers as HeadersInit).get('Authorization'));

    await sdk.execute('pitch', 8);
    await sdk.simulate('pitch', 8);
    expect(authHeaders()).toEqual([null, null]);

    await sdk.publishPrepare('connector', 'pitch');
    await sdk.publishSend('connector', { name: 'pitch', content_hash: `0x${'c'.repeat(64)}`, raw_tx: '0x02abcd' });
    expect(authHeaders()).toEqual(['Bearer access-123', 'Bearer access-123']);
  });

  it('authenticates wallets with getAddress and the issued sign-in message', async () => {
    const wallet = {
      getAddress: vi.fn(async () => ADDR),
      signMessage: vi.fn(async (message: string) => {
        expect(message).toBe(SIGN_IN_MESSAGE);
        return '0xSIG';
      }),
    };

    const auth = await sdk.loginWithWallet(wallet, { origin: 'https://example.invalid' });
    expect(auth.access_token).toBe('access-123');
    expect(wallet.getAddress).toHaveBeenCalledOnce();
    expect(wallet.signMessage).toHaveBeenCalledWith(SIGN_IN_MESSAGE);

    const [nonceRequest, authRequest] = globalThis.__lastRequests.slice(-2);
    expect(new URL(String(nonceRequest.input)).searchParams.get('origin')).toBe('https://example.invalid');
    expect(JSON.parse(authRequest.init?.body as string)).toEqual({
      address: ADDR,
      nonce: NONCE,
      signature: '0xSIG',
    });
  });

  it('rejects wallet login when no address is available', async () => {
    await expect(sdk.loginWithWallet({ signMessage: vi.fn() })).rejects.toThrow(
      'Wallet address is unavailable'
    );
  });
});
