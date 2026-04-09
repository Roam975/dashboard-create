import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const validUsername = process.env.ADMIN_USERNAME || "admin";
    const validPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (username === validUsername && password === validPassword) {
      const cookieStore = await cookies();
      
      const d = new Date();
      d.setTime(d.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      cookieStore.set("site-auth", "authenticated", {
        expires: d,
        path: "/",
        httpOnly: false, // Accessible to middleware and client if needed
        secure: process.env.NODE_ENV === "production",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Credenciais inválidas" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
