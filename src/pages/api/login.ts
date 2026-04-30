import type { APIRoute } from "astro";

const TEST_USERS = [
  "marc.thinkupai@gmail.com",
  "leon.thinkupai@gmail.com",
  "julius.thinkupai@gmail.com",
];

const TEST_PASSWORD = "JulianKreutter";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const isValidUser = TEST_USERS.includes(email);
  const isValidPassword = password === TEST_PASSWORD;

  if (!isValidUser || !isValidPassword) {
    return redirect("/login?error=1");
  }

  cookies.set("thinkup_session", email, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: import.meta.env.PROD,
    maxAge: 60 * 60 * 24,
  });

  return redirect("/kundenbereich");
};