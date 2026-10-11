import "server-only";

import { randomInt } from "crypto";

const lower = "abcdefghijkmnopqrstuvwxyz";
const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const digits = "23456789";
const symbols = "!@#$%^&*()-_=+";
const allCharacters = lower + upper + digits + symbols;

function randomCharacter(characters: string): string {
  return characters[randomInt(0, characters.length)] ?? characters[0] ?? "x";
}

export function generateTemporaryPassword(length = 20): string {
  const required = [
    randomCharacter(lower),
    randomCharacter(upper),
    randomCharacter(digits),
    randomCharacter(symbols),
  ];

  const remaining = Array.from({ length: Math.max(length - required.length, 0) }, () =>
    randomCharacter(allCharacters)
  );

  return [...required, ...remaining]
    .map((character) => ({ character, sort: randomInt(0, 1_000_000) }))
    .sort((left, right) => left.sort - right.sort)
    .map((entry) => entry.character)
    .join("");
}
