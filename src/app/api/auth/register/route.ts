import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import {
  getAuthUnavailableResponse,
  isAuthAvailable,
} from "@/lib/auth";
import { validateRegisterPayload } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import type { ApiErrorResponse, RegisterUserResponse } from "@/lib/types";

export async function POST(request: Request) {
  if (!isAuthAvailable()) {
    return getAuthUnavailableResponse();
  }

  const payload = await request.json().catch(() => null);
  const validation = validateRegisterPayload(payload);

  if (!validation.data) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Revise os campos obrigatorios antes de continuar.",
        fieldErrors: validation.fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, username } = validation.data;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
    select: {
      email: true,
      username: true,
    },
  });

  if (existingUser) {
    const fieldErrors: NonNullable<ApiErrorResponse["fieldErrors"]> = {};

    if (existingUser.email === email) {
      fieldErrors.email = "Este email ja esta em uso.";
    }

    if (existingUser.username === username) {
      fieldErrors.username = "Este username ja esta em uso.";
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        error: "Ja existe uma conta com esses dados.",
        fieldErrors,
      },
      { status: 409 },
    );
  }

  const createdUser = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      username,
      email,
      passwordHash: await hash(validation.data.password, 12),
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  return NextResponse.json<RegisterUserResponse>(
    {
      user: createdUser,
    },
    { status: 201 },
  );
}
