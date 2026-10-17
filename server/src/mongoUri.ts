/** Only MongoDB driver's two supported URI schemes are valid.
 * Never log the URI itself, because it can contain private credentials.
 */
export function isMongoUri(uri: string): boolean {
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
}
