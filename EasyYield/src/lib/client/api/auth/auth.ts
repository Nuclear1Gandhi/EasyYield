import ky from "ky";

export async function loginWithJwt(address: string): Promise<string | null> {
  try {
    const { token } = await ky
      .post("/api/auth/login", {
        json: { address },
      })
      .json<{ token: string }>();

    return token;
  } catch (err) {
    console.error("JWT login error:", err);
    return null;
  }
}