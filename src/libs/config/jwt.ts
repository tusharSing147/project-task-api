import jwt from "jsonwebtoken";
const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32)
    throw new Error("JWT_SECRET must be at least 32 characters");
  return value;
};
export interface JwtPayload {
  id: string;
  role: string;
}
export function signToken(
  payload: JwtPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = "1d",
): string {
  return jwt.sign({ id: payload.id, role: payload.role }, secret(), {
    expiresIn,
  });
}
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, secret());
    if (typeof decoded === "string" || !decoded.id) return null;
    return { id: String(decoded.id), role: String(decoded.role || "user") };
  } catch {
    return null;
  }
}
