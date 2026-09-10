/**
 * Global feature toggles. Flip a flag here and rebuild.
 */

/**
 * Price verification voting (👍/👎 "confirm / deny" on individual prices).
 * Temporarily OFF: every submitted price is shown to everyone immediately,
 * nothing is hidden by a low verification score.
 * The `price_verifications` table and service are kept intact for re-enabling.
 */
export const PRICE_VOTING_ENABLED = false
