/// <reference types="astro/client" />

type SessionUser = import('./lib/auth').SessionUser;

declare namespace App {
  interface Locals {
    user: SessionUser | null;
  }
}
